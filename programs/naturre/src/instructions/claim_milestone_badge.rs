use anchor_lang::prelude::*;
use crate::constants::{
    CONFIG_SEED, MILESTONE_FIRST_ROOT, MILESTONE_FLAG_FIRST_ROOT, MILESTONE_FLAG_FOREST_GUARDIAN,
    MILESTONE_FLAG_GROVE_BUILDER, MILESTONE_FOREST_GUARDIAN, MILESTONE_GROVE_BUILDER,
    USER_STATS_SEED,
};
use crate::errors::NaturreError;
use crate::events::MilestoneBadgeClaimed;
use crate::metaplex::mint_milestone_badge_cpi;
use crate::state::{ProtocolConfig, UserStats};

#[derive(Accounts)]
#[instruction(tier: u8)]
pub struct ClaimMilestoneBadge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [USER_STATS_SEED, user.key().as_ref()],
        bump = user_stats.bump,
        constraint = user_stats.user == user.key() @ NaturreError::InvalidPlanter
    )]
    pub user_stats: Account<'info, UserStats>,

    /// New Metaplex Core milestone badge asset keypair
    #[account(mut)]
    pub badge_asset: Signer<'info>,

    /// Metaplex Core milestone badge collection
    /// CHECK: Validated against protocol_config.badge_collection
    #[account(mut)]
    pub milestone_collection: AccountInfo<'info>,

    /// Metaplex Core program
    /// CHECK: Validated against mpl_core::ID
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_claim_milestone_badge(
    ctx: Context<ClaimMilestoneBadge>,
    tier: u8,
    name: Option<String>,
    uri: Option<String>,
) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    // Verify milestone collection has been initialized and matches
    let collection_pubkey = ctx
        .accounts
        .protocol_config
        .badge_collection
        .ok_or(NaturreError::MilestoneCollectionNotInitialized)?;

    require_keys_eq!(
        ctx.accounts.milestone_collection.key(),
        collection_pubkey,
        NaturreError::InvalidCollection
    );

    // Determine requirements, bitmask flag, and default metadata for the requested tier
    let (required_trees, flag, default_name, default_uri) = match tier {
        0 => (
            MILESTONE_FIRST_ROOT,
            MILESTONE_FLAG_FIRST_ROOT,
            "First Root Milestone",
            "https://devnet.naturre.org/metadata/milestones/first-root.json",
        ),
        1 => (
            MILESTONE_GROVE_BUILDER,
            MILESTONE_FLAG_GROVE_BUILDER,
            "Grove Builder Milestone",
            "https://devnet.naturre.org/metadata/milestones/grove-builder.json",
        ),
        2 => (
            MILESTONE_FOREST_GUARDIAN,
            MILESTONE_FLAG_FOREST_GUARDIAN,
            "Forest Guardian Milestone",
            "https://devnet.naturre.org/metadata/milestones/forest-guardian.json",
        ),
        _ => return Err(NaturreError::InvalidMilestoneTier.into()),
    };

    let user_stats = &mut ctx.accounts.user_stats;

    // Check verification threshold: MUST be based on verified trees, not planted trees
    require!(
        user_stats.trees_verified >= required_trees,
        NaturreError::MilestoneNotReached
    );

    // Anti-duplicate check: verify milestone has not already been claimed
    require!(
        (user_stats.claimed_milestones & flag) == 0,
        NaturreError::MilestoneAlreadyClaimed
    );

    let badge_name = name.unwrap_or_else(|| default_name.to_string());
    let badge_uri = uri.unwrap_or_else(|| default_uri.to_string());

    let config_bump = ctx.accounts.protocol_config.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[config_bump]]];

    // Mint the transferable Metaplex Core digital asset into the official Milestone Badge Collection
    mint_milestone_badge_cpi(
        &ctx.accounts.mpl_core_program,
        &ctx.accounts.badge_asset.to_account_info(),
        &ctx.accounts.milestone_collection,
        &ctx.accounts.protocol_config.to_account_info(),
        &ctx.accounts.user.to_account_info(),
        &ctx.accounts.user.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        badge_name,
        badge_uri,
        signer_seeds,
    )?;

    // Update claimed milestone bitmap only after successful mint CPI
    user_stats.claimed_milestones |= flag;

    let clock = Clock::get()?;
    emit!(MilestoneBadgeClaimed {
        user: ctx.accounts.user.key(),
        badge_asset: ctx.accounts.badge_asset.key(),
        tier,
        trees_verified: user_stats.trees_verified,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

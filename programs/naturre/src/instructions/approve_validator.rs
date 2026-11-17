use anchor_lang::prelude::*;
use crate::constants::{CONFIG_SEED, VALIDATOR_SEED};
use crate::errors::NaturreError;
use crate::events::ValidatorApproved;
use crate::metaplex::issue_nature_hero_badge;
use crate::state::{ProtocolConfig, ValidatorProfile};

#[derive(Accounts)]
pub struct ApproveValidator<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.admin_authority == admin.key() @ NaturreError::UnauthorizedAdmin
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// CHECK: Validator wallet being approved
    pub validator: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        space = ValidatorProfile::LEN,
        seeds = [VALIDATOR_SEED, validator.key().as_ref()],
        bump
    )]
    pub validator_profile: Account<'info, ValidatorProfile>,

    /// Optional Metaplex Core asset account for Nature Hero credential badge
    #[account(mut)]
    pub badge_asset: Option<Signer<'info>>,

    /// Optional Metaplex Core program account
    /// CHECK: Validated against mpl_core::ID if badge_asset is provided
    pub mpl_core_program: Option<AccountInfo<'info>>,

    pub system_program: Program<'info, System>,
}

pub fn handle_approve_validator(
    ctx: Context<ApproveValidator>,
    badge_name: Option<String>,
    badge_uri: Option<String>,
) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    let profile = &mut ctx.accounts.validator_profile;
    require!(!profile.is_active, NaturreError::ValidatorAlreadyActive);

    let clock = Clock::get()?;
    profile.validator = ctx.accounts.validator.key();
    profile.is_active = true;
    profile.approved_at = clock.unix_timestamp;
    profile.bump = ctx.bumps.validator_profile;

    // Handle optional Nature Hero badge issuance via Metaplex Core CPI
    let mut minted_badge: Option<Pubkey> = None;
    if let (Some(badge_asset_info), Some(mpl_program)) = (
        &ctx.accounts.badge_asset,
        &ctx.accounts.mpl_core_program,
    ) {
        require_keys_eq!(
            mpl_program.key(),
            mpl_core::ID,
            NaturreError::UnauthorizedAdmin
        );

        let name = badge_name.unwrap_or_else(|| "Nature Hero Credential".to_string());
        let uri = badge_uri.unwrap_or_default();

        issue_nature_hero_badge(
            mpl_program,
            &badge_asset_info.to_account_info(),
            &ctx.accounts.admin.to_account_info(),
            &ctx.accounts.validator.to_account_info(),
            &ctx.accounts.admin.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            ctx.accounts.protocol_config.key(),
            name,
            uri,
        )?;

        profile.badge_asset = Some(badge_asset_info.key());
        minted_badge = Some(badge_asset_info.key());
    }

    emit!(ValidatorApproved {
        admin: ctx.accounts.admin.key(),
        validator: ctx.accounts.validator.key(),
        badge_asset: minted_badge,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

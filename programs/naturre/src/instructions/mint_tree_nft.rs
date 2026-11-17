use anchor_lang::prelude::*;
use crate::constants::{CONFIG_SEED, TREE_SEED, USER_STATS_SEED};
use crate::errors::NaturreError;
use crate::events::TreeNftMinted;
use crate::metaplex::mint_tree_nft_cpi;
use crate::state::{ProtocolConfig, TreeRecord, TreeStatus, UserStats};

#[derive(Accounts)]
pub struct MintTreeNft<'info> {
    #[account(mut)]
    pub planter: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [TREE_SEED, planter.key().as_ref(), tree_record.tree_id_bytes.as_ref()],
        bump = tree_record.bump
    )]
    pub tree_record: Account<'info, TreeRecord>,

    /// CHECK: Metaplex Core Tree Collection asset
    #[account(mut)]
    pub collection: AccountInfo<'info>,

    /// New Metaplex Core digital asset keypair being minted
    #[account(mut)]
    pub nft_asset: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_STATS_SEED, planter.key().as_ref()],
        bump = user_stats.bump
    )]
    pub user_stats: Account<'info, UserStats>,

    /// CHECK: Metaplex Core program ID
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_mint_tree_nft(
    ctx: Context<MintTreeNft>,
    name: String,
    uri: String,
) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    let tree = &mut ctx.accounts.tree_record;

    // Caller must be the original planter
    require_keys_eq!(tree.planter, ctx.accounts.planter.key(), NaturreError::InvalidPlanter);

    // Tree must be in Verified status
    require!(tree.status == TreeStatus::Verified, NaturreError::TreeNotVerified);

    // Tree must not already have an NFT minted
    require!(tree.nft_asset.is_none(), NaturreError::TreeAlreadyMinted);

    // Verify official Naturre Tree Collection
    let config = &ctx.accounts.protocol_config;
    let expected_collection = config
        .tree_collection
        .ok_or(NaturreError::TreeCollectionNotInitialized)?;
    require_keys_eq!(
        ctx.accounts.collection.key(),
        expected_collection,
        NaturreError::InvalidCollection
    );

    // Verify Metaplex Core program ID
    require_keys_eq!(
        ctx.accounts.mpl_core_program.key(),
        mpl_core::ID,
        NaturreError::UnauthorizedAdmin
    );

    let clock = Clock::get()?;

    // Signer seeds for protocol_config PDA (which is the update authority of the collection)
    let bump = config.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[bump]]];

    // Mint the transferable Metaplex Core digital asset to the planter
    mint_tree_nft_cpi(
        &ctx.accounts.mpl_core_program,
        &ctx.accounts.nft_asset.to_account_info(),
        &ctx.accounts.collection.to_account_info(),
        &config.to_account_info(),
        &ctx.accounts.planter.to_account_info(),
        &ctx.accounts.planter.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        name,
        uri,
        signer_seeds,
    )?;

    // Update state
    tree.nft_asset = Some(ctx.accounts.nft_asset.key());
    tree.status = TreeStatus::Minted;

    let stats = &mut ctx.accounts.user_stats;
    stats.nfts_minted = stats.nfts_minted.saturating_add(1);

    emit!(TreeNftMinted {
        planter: tree.planter,
        tree_pda: tree.key(),
        asset: ctx.accounts.nft_asset.key(),
        tree_id_bytes: tree.tree_id_bytes,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

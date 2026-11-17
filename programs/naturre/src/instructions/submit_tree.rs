use anchor_lang::prelude::*;
use crate::constants::{
    CONFIG_SEED, MAX_LATITUDE, MAX_LONGITUDE, MAX_METADATA_CID_LEN, MIN_LATITUDE, MIN_LONGITUDE,
    TREE_SEED, USER_STATS_SEED,
};
use crate::errors::NaturreError;
use crate::events::TreeSubmitted;
use crate::state::{ProtocolConfig, TreeRecord, TreeStatus, UserStats};

#[derive(Accounts)]
#[instruction(tree_id_bytes: [u8; 32])]
pub struct SubmitTree<'info> {
    #[account(mut)]
    pub planter: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = planter,
        space = TreeRecord::LEN,
        seeds = [TREE_SEED, planter.key().as_ref(), tree_id_bytes.as_ref()],
        bump
    )]
    pub tree_record: Account<'info, TreeRecord>,

    #[account(
        init_if_needed,
        payer = planter,
        space = UserStats::LEN,
        seeds = [USER_STATS_SEED, planter.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,

    pub system_program: Program<'info, System>,
}

pub fn handle_submit_tree(
    ctx: Context<SubmitTree>,
    tree_id_bytes: [u8; 32],
    latitude: i64,
    longitude: i64,
    project_type: u8,
    metadata_cid: String,
) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    // Validate GPS coordinate bounds scaled by 10^7
    require!(
        latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE,
        NaturreError::InvalidGpsCoordinates
    );
    require!(
        longitude >= MIN_LONGITUDE && longitude <= MAX_LONGITUDE,
        NaturreError::InvalidGpsCoordinates
    );

    // Validate metadata CID
    require!(
        !metadata_cid.is_empty() && metadata_cid.len() <= MAX_METADATA_CID_LEN,
        NaturreError::InvalidMetadataCid
    );

    let clock = Clock::get()?;

    // Populate TreeRecord
    let tree = &mut ctx.accounts.tree_record;
    tree.planter = ctx.accounts.planter.key();
    tree.tree_id_bytes = tree_id_bytes;
    tree.metadata_cid = metadata_cid.clone();
    tree.latitude = latitude;
    tree.longitude = longitude;
    tree.project_type = project_type;
    tree.status = TreeStatus::Pending;
    tree.approvals_count = 0;
    tree.rejections_count = 0;
    tree.nft_asset = None;
    tree.submitted_at = clock.unix_timestamp;
    tree.verified_at = None;
    tree.bump = ctx.bumps.tree_record;
    tree.padding = [0u8; 64];

    // Update UserStats
    let stats = &mut ctx.accounts.user_stats;
    if stats.user == Pubkey::default() {
        stats.user = ctx.accounts.planter.key();
        stats.first_planted_at = clock.unix_timestamp;
        stats.bump = ctx.bumps.user_stats;
    }
    stats.trees_planted = stats.trees_planted.saturating_add(1);

    emit!(TreeSubmitted {
        planter: tree.planter,
        tree_pda: tree.key(),
        tree_id_bytes,
        latitude,
        longitude,
        project_type,
        metadata_cid,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

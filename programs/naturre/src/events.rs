use anchor_lang::prelude::*;
use crate::state::TreeStatus;

#[event]
pub struct ProtocolInitialized {
    pub admin: Pubkey,
    pub fee_treasury: Pubkey,
    pub required_approvals: u8,
    pub protocol_fee_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolPauseToggled {
    pub admin: Pubkey,
    pub is_paused: bool,
    pub timestamp: i64,
}

#[event]
pub struct ValidatorApproved {
    pub admin: Pubkey,
    pub validator: Pubkey,
    pub badge_asset: Option<Pubkey>,
    pub timestamp: i64,
}

#[event]
pub struct ValidatorRevoked {
    pub admin: Pubkey,
    pub validator: Pubkey,
    pub badge_burned: bool,
    pub timestamp: i64,
}

#[event]
pub struct TreeSubmitted {
    pub planter: Pubkey,
    pub tree_pda: Pubkey,
    pub tree_id_bytes: [u8; 32],
    pub latitude: i64,
    pub longitude: i64,
    pub project_type: u8,
    pub metadata_cid: String,
    pub timestamp: i64,
}

#[event]
pub struct TreeReviewed {
    pub tree_pda: Pubkey,
    pub validator: Pubkey,
    pub approved: bool,
    pub approvals_count: u8,
    pub rejections_count: u8,
    pub new_status: TreeStatus,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneReached {
    pub user: Pubkey,
    pub tier: u8, // 0 = First Root, 1 = Grove Builder, 2 = Forest Guardian
    pub total_verified_trees: u32,
    pub timestamp: i64,
}

#[event]
pub struct TreeCollectionInitialized {
    pub admin: Pubkey,
    pub collection: Pubkey,
    pub name: String,
    pub uri: String,
    pub timestamp: i64,
}

#[event]
pub struct TreeNftMinted {
    pub planter: Pubkey,
    pub tree_pda: Pubkey,
    pub asset: Pubkey,
    pub tree_id_bytes: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct MilestoneCollectionInitialized {
    pub admin: Pubkey,
    pub collection: Pubkey,
    pub name: String,
    pub uri: String,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneBadgeClaimed {
    pub user: Pubkey,
    pub badge_asset: Pubkey,
    pub tier: u8,
    pub trees_verified: u32,
    pub timestamp: i64,
}

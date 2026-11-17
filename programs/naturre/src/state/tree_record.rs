use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug)]
pub enum TreeStatus {
    #[default]
    Pending,     // Submitted, awaiting 2-of-N validator quorum
    Verified,    // Approved by required independent Nature Heroes
    Rejected,    // Rejected by required independent Nature Heroes
    Minted,      // Metaplex Core NFT minted to planter
}

#[account]
pub struct TreeRecord {
    /// Planter wallet address
    pub planter: Pubkey,
    /// Fixed 32-byte content identifier
    pub tree_id_bytes: [u8; 32],
    /// IPFS metadata CID (e.g. "bafy..." or "Qm...")
    pub metadata_cid: String,
    /// Latitude in degrees * 10^7 (range: [-900_000_000, 900_000_000])
    pub latitude: i64,
    /// Longitude in degrees * 10^7 (range: [-1_800_000_000, 1_800_000_000])
    pub longitude: i64,
    /// Project type identifier
    pub project_type: u8,
    /// Verification status
    pub status: TreeStatus,
    /// Total approvals recorded
    pub approvals_count: u8,
    /// Total rejections recorded
    pub rejections_count: u8,
    /// Metaplex Core NFT asset address (once minted)
    pub nft_asset: Option<Pubkey>,
    /// Submission timestamp
    pub submitted_at: i64,
    /// Verification timestamp (if verified)
    pub verified_at: Option<i64>,
    /// Canonical bump seed
    pub bump: u8,
    /// Reserved space for future extensions
    pub padding: [u8; 64],
}

impl TreeRecord {
    pub const LEN: usize = 8   // discriminator
        + 32                    // planter
        + 32                    // tree_id_bytes
        + (4 + 100)             // metadata_cid: String (max 100 chars)
        + 8                     // latitude
        + 8                     // longitude
        + 1                     // project_type
        + 1                     // status: TreeStatus
        + 1                     // approvals_count
        + 1                     // rejections_count
        + 33                    // nft_asset: Option<Pubkey> (1 + 32)
        + 8                     // submitted_at
        + 9                     // verified_at: Option<i64> (1 + 8)
        + 1                     // bump
        + 64                    // padding
        + 72;                   // headroom (total = 384 bytes)
}

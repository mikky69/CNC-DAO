use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserStats {
    /// Planter wallet address
    pub user: Pubkey,
    /// Total trees submitted
    pub trees_planted: u32,
    /// Total trees reaching Verified status
    pub trees_verified: u32,
    /// Total Metaplex Core Tree NFTs minted
    pub nfts_minted: u32,
    /// Bitmask of claimed milestone badges:
    /// Bit 0 (0x01): First Root (1 verified tree)
    /// Bit 1 (0x02): Grove Builder (10 verified trees)
    /// Bit 2 (0x04): Forest Guardian (50 verified trees)
    pub claimed_milestones: u8,
    /// Timestamp of first submission
    pub first_planted_at: i64,
    /// Canonical bump seed
    pub bump: u8,
    /// Reserved space for future extensions
    pub padding: [u8; 32],
}

impl UserStats {
    pub const LEN: usize = 8   // discriminator
        + 32                    // user
        + 4                     // trees_planted
        + 4                     // trees_verified
        + 4                     // nfts_minted
        + 1                     // claimed_milestones
        + 8                     // first_planted_at
        + 1                     // bump
        + 32                    // padding
        + 34;                   // safety headroom (total = 128 bytes)
}

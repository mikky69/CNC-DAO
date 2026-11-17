use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ValidatorProfile {
    /// Validator wallet address
    pub validator: Pubkey,
    /// Active status flag (revocation toggle)
    pub is_active: bool,
    /// Accreditation timestamp
    pub approved_at: i64,
    /// Total submissions reviewed
    pub total_reviewed: u32,
    /// Total submissions approved
    pub total_approved: u32,
    /// Total submissions rejected
    pub total_rejected: u32,
    /// Timestamp of latest review
    pub last_reviewed_at: i64,
    /// Metaplex Core credential badge asset address (if minted)
    pub badge_asset: Option<Pubkey>,
    /// Canonical bump seed
    pub bump: u8,
    /// Reserved space for future extensions
    pub padding: [u8; 32],
}

impl ValidatorProfile {
    pub const LEN: usize = 8   // discriminator
        + 32                    // validator
        + 1                     // is_active
        + 8                     // approved_at
        + 4                     // total_reviewed
        + 4                     // total_approved
        + 4                     // total_rejected
        + 8                     // last_reviewed_at
        + 33                    // badge_asset: Option<Pubkey> (1 + 32)
        + 1                     // bump
        + 32                    // padding
        + 33;                   // safety headroom (total = 168 bytes)
}

use anchor_lang::prelude::*;

#[account]
pub struct ProtocolConfig {
    /// Designated protocol admin master key
    pub admin_authority: Pubkey,
    /// Protocol treasury for fee sweeps and operations
    pub fee_treasury: Pubkey,
    /// Number of independent validator approvals required for verification (default: 2)
    pub required_approvals: u8,
    /// Emergency circuit breaker
    pub is_paused: bool,
    /// Protocol fee in lamports
    pub protocol_fee_lamports: u64,
    /// Metaplex Core Tree Collection asset
    pub tree_collection: Option<Pubkey>,
    /// Metaplex Core Nature Hero Badge Collection asset
    pub badge_collection: Option<Pubkey>,
    /// Initialization timestamp
    pub initialized_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Canonical bump seed
    pub bump: u8,
    /// Reserved space for future protocol upgrades
    pub padding: [u8; 64],
}

impl ProtocolConfig {
    pub const LEN: usize = 8   // discriminator
        + 32                    // admin_authority
        + 32                    // fee_treasury
        + 1                     // required_approvals
        + 1                     // is_paused
        + 8                     // protocol_fee_lamports
        + 33                    // tree_collection: Option<Pubkey> (1 + 32)
        + 33                    // badge_collection: Option<Pubkey> (1 + 32)
        + 8                     // initialized_at
        + 8                     // updated_at
        + 1                     // bump
        + 64                    // padding
        + 32;                   // additional safety padding (total = 293 bytes)
}

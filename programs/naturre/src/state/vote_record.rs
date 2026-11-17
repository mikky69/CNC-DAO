use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct VoteRecord {
    /// TreeRecord PDA being voted on
    pub tree: Pubkey,
    /// Validator wallet that cast the vote
    pub validator: Pubkey,
    /// True if approved, false if rejected
    pub approved: bool,
    /// Timestamp when vote was cast
    pub voted_at: i64,
    /// Canonical bump seed
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 8   // discriminator
        + 32                    // tree
        + 32                    // validator
        + 1                     // approved
        + 8                     // voted_at
        + 1                     // bump
        + 14;                   // safety headroom (total = 96 bytes)
}

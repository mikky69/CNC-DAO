use anchor_lang::prelude::*;
use crate::constants::{CONFIG_SEED, DEFAULT_REQUIRED_APPROVALS};
use crate::errors::NaturreError;
use crate::events::ProtocolInitialized;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = ProtocolConfig::LEN,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_protocol(
    ctx: Context<InitializeProtocol>,
    required_approvals: Option<u8>,
    protocol_fee_lamports: u64,
    fee_treasury: Option<Pubkey>,
) -> Result<()> {
    let approvals = required_approvals.unwrap_or(DEFAULT_REQUIRED_APPROVALS);
    require!(approvals > 0, NaturreError::InvalidRequiredApprovals);

    let config = &mut ctx.accounts.protocol_config;
    let clock = Clock::get()?;

    config.admin_authority = ctx.accounts.admin.key();
    config.fee_treasury = fee_treasury.unwrap_or(ctx.accounts.admin.key());
    config.required_approvals = approvals;
    config.is_paused = false;
    config.protocol_fee_lamports = protocol_fee_lamports;
    config.tree_collection = None;
    config.badge_collection = None;
    config.initialized_at = clock.unix_timestamp;
    config.updated_at = clock.unix_timestamp;
    config.bump = ctx.bumps.protocol_config;
    config.padding = [0u8; 64];

    emit!(ProtocolInitialized {
        admin: config.admin_authority,
        fee_treasury: config.fee_treasury,
        required_approvals: config.required_approvals,
        protocol_fee_lamports: config.protocol_fee_lamports,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

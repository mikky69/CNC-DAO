use anchor_lang::prelude::*;
use crate::constants::CONFIG_SEED;
use crate::errors::NaturreError;
use crate::events::ProtocolPauseToggled;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct UpdatePause<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.admin_authority == admin.key() @ NaturreError::UnauthorizedAdmin
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

pub fn handle_update_pause(ctx: Context<UpdatePause>, is_paused: bool) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;
    let clock = Clock::get()?;

    config.is_paused = is_paused;
    config.updated_at = clock.unix_timestamp;

    emit!(ProtocolPauseToggled {
        admin: ctx.accounts.admin.key(),
        is_paused,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

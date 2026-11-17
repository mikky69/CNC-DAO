use anchor_lang::prelude::*;
use crate::constants::{CONFIG_SEED, VALIDATOR_SEED};
use crate::errors::NaturreError;
use crate::events::ValidatorRevoked;
use crate::metaplex::burn_revoked_badge;
use crate::state::{ProtocolConfig, ValidatorProfile};

#[derive(Accounts)]
pub struct RevokeValidator<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.admin_authority == admin.key() @ NaturreError::UnauthorizedAdmin
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// CHECK: Validator wallet being revoked
    pub validator: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [VALIDATOR_SEED, validator.key().as_ref()],
        bump = validator_profile.bump
    )]
    pub validator_profile: Account<'info, ValidatorProfile>,

    /// Optional Metaplex Core badge asset account to burn upon revocation
    /// CHECK: Verified against validator_profile.badge_asset if present
    #[account(mut)]
    pub badge_asset: Option<AccountInfo<'info>>,

    /// Optional Metaplex Core program account
    /// CHECK: Validated against mpl_core::ID if badge_asset is provided
    pub mpl_core_program: Option<AccountInfo<'info>>,
}

pub fn handle_revoke_validator(ctx: Context<RevokeValidator>) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    let profile = &mut ctx.accounts.validator_profile;
    require!(profile.is_active, NaturreError::ValidatorNotActive);

    let clock = Clock::get()?;
    profile.is_active = false;

    let mut burned = false;
    if let (Some(badge_account), Some(mpl_program)) = (
        &ctx.accounts.badge_asset,
        &ctx.accounts.mpl_core_program,
    ) {
        if let Some(recorded_badge) = profile.badge_asset {
            if recorded_badge == badge_account.key() {
                require_keys_eq!(
                    mpl_program.key(),
                    mpl_core::ID,
                    NaturreError::UnauthorizedAdmin
                );

                burn_revoked_badge(
                    mpl_program,
                    badge_account,
                    &ctx.accounts.admin.to_account_info(),
                    &ctx.accounts.admin.to_account_info(),
                )?;

                profile.badge_asset = None;
                burned = true;
            }
        }
    }

    emit!(ValidatorRevoked {
        admin: ctx.accounts.admin.key(),
        validator: ctx.accounts.validator.key(),
        badge_burned: burned,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

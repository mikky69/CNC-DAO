use anchor_lang::prelude::*;
use crate::constants::CONFIG_SEED;
use crate::errors::NaturreError;
use crate::events::TreeCollectionInitialized;
use crate::metaplex::create_tree_collection_cpi;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct InitializeTreeCollection<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.admin_authority == admin.key() @ NaturreError::UnauthorizedAdmin
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// New collection asset keypair
    #[account(mut)]
    pub collection: Signer<'info>,

    /// CHECK: Metaplex Core program ID
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_tree_collection(
    ctx: Context<InitializeTreeCollection>,
    name: String,
    uri: String,
) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    let config = &mut ctx.accounts.protocol_config;
    require!(
        config.tree_collection.is_none(),
        NaturreError::TreeCollectionAlreadyInitialized
    );

    require_keys_eq!(
        ctx.accounts.mpl_core_program.key(),
        mpl_core::ID,
        NaturreError::UnauthorizedAdmin
    );

    let clock = Clock::get()?;

    // Create the Tree Collection on Metaplex Core with update authority set to protocol_config PDA
    create_tree_collection_cpi(
        &ctx.accounts.mpl_core_program,
        &ctx.accounts.collection.to_account_info(),
        &ctx.accounts.admin.to_account_info(),
        &config.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        name.clone(),
        uri.clone(),
    )?;

    config.tree_collection = Some(ctx.accounts.collection.key());
    config.updated_at = clock.unix_timestamp;

    emit!(TreeCollectionInitialized {
        admin: ctx.accounts.admin.key(),
        collection: ctx.accounts.collection.key(),
        name,
        uri,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

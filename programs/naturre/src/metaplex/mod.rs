use anchor_lang::prelude::*;
use mpl_core::instructions::{BurnV1CpiBuilder, CreateCollectionV1CpiBuilder, CreateV1CpiBuilder};
use mpl_core::types::{
    DataState, PermanentBurnDelegate, PermanentFreezeDelegate, Plugin, PluginAuthority,
    PluginAuthorityPair,
};

pub fn issue_nature_hero_badge<'a>(
    mpl_core_program: &AccountInfo<'a>,
    asset: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    owner: &AccountInfo<'a>,
    admin_authority: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    config_pda: Pubkey,
    badge_name: String,
    badge_uri: String,
) -> Result<()> {
    let plugins = vec![
        PluginAuthorityPair {
            plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate { frozen: true }),
            authority: Some(PluginAuthority::Address { address: config_pda }),
        },
        PluginAuthorityPair {
            plugin: Plugin::PermanentBurnDelegate(PermanentBurnDelegate {}),
            authority: Some(PluginAuthority::Address { address: admin_authority.key() }),
        },
    ];

    CreateV1CpiBuilder::new(mpl_core_program)
        .asset(asset)
        .payer(payer)
        .owner(Some(owner))
        .update_authority(Some(admin_authority))
        .system_program(system_program)
        .data_state(DataState::AccountState)
        .name(badge_name)
        .uri(badge_uri)
        .plugins(plugins)
        .invoke()?;

    Ok(())
}

pub fn burn_revoked_badge<'a>(
    mpl_core_program: &AccountInfo<'a>,
    asset: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    admin_authority: &AccountInfo<'a>,
) -> Result<()> {
    BurnV1CpiBuilder::new(mpl_core_program)
        .asset(asset)
        .payer(payer)
        .authority(Some(admin_authority))
        .invoke()?;

    Ok(())
}

pub fn create_tree_collection_cpi<'a>(
    mpl_core_program: &AccountInfo<'a>,
    collection: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    update_authority: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    name: String,
    uri: String,
) -> Result<()> {
    CreateCollectionV1CpiBuilder::new(mpl_core_program)
        .collection(collection)
        .payer(payer)
        .update_authority(Some(update_authority))
        .system_program(system_program)
        .name(name)
        .uri(uri)
        .invoke()?;

    Ok(())
}

pub fn mint_tree_nft_cpi<'a>(
    mpl_core_program: &AccountInfo<'a>,
    asset: &AccountInfo<'a>,
    collection: &AccountInfo<'a>,
    collection_authority: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    owner: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    name: String,
    uri: String,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    CreateV1CpiBuilder::new(mpl_core_program)
        .asset(asset)
        .collection(Some(collection))
        .authority(Some(collection_authority))
        .payer(payer)
        .owner(Some(owner))
        .system_program(system_program)
        .data_state(DataState::AccountState)
        .name(name)
        .uri(uri)
        .invoke_signed(signer_seeds)?;

    Ok(())
}

pub fn create_milestone_collection_cpi<'a>(
    mpl_core_program: &AccountInfo<'a>,
    collection: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    update_authority: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    name: String,
    uri: String,
) -> Result<()> {
    CreateCollectionV1CpiBuilder::new(mpl_core_program)
        .collection(collection)
        .payer(payer)
        .update_authority(Some(update_authority))
        .system_program(system_program)
        .name(name)
        .uri(uri)
        .invoke()?;

    Ok(())
}

pub fn mint_milestone_badge_cpi<'a>(
    mpl_core_program: &AccountInfo<'a>,
    asset: &AccountInfo<'a>,
    collection: &AccountInfo<'a>,
    collection_authority: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    owner: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    name: String,
    uri: String,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    CreateV1CpiBuilder::new(mpl_core_program)
        .asset(asset)
        .collection(Some(collection))
        .authority(Some(collection_authority))
        .payer(payer)
        .owner(Some(owner))
        .system_program(system_program)
        .data_state(DataState::AccountState)
        .name(name)
        .uri(uri)
        .invoke_signed(signer_seeds)?;

    Ok(())
}

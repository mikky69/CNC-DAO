use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod metaplex;
pub mod state;

use instructions::*;

declare_id!("E6wG3g53YnSuzgzrpJF9zFXFGh7dhraSGejKpRQETjUp");

#[program]
pub mod naturre {
    use super::*;

    /// Initialize the global protocol configuration and admin authority
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        required_approvals: Option<u8>,
        protocol_fee_lamports: u64,
        fee_treasury: Option<Pubkey>,
    ) -> Result<()> {
        instructions::handle_initialize_protocol(
            ctx,
            required_approvals,
            protocol_fee_lamports,
            fee_treasury,
        )
    }

    /// Emergency pause circuit breaker toggling
    pub fn update_pause(ctx: Context<UpdatePause>, is_paused: bool) -> Result<()> {
        instructions::handle_update_pause(ctx, is_paused)
    }

    /// Admin approves and activates a Nature Hero validator, optionally issuing soulbound badge
    pub fn approve_validator(
        ctx: Context<ApproveValidator>,
        badge_name: Option<String>,
        badge_uri: Option<String>,
    ) -> Result<()> {
        instructions::handle_approve_validator(ctx, badge_name, badge_uri)
    }

    /// Admin revokes a Nature Hero validator and burns their credential badge
    pub fn revoke_validator(ctx: Context<RevokeValidator>) -> Result<()> {
        instructions::handle_revoke_validator(ctx)
    }

    /// Planter registers a new tree submission
    pub fn submit_tree(
        ctx: Context<SubmitTree>,
        tree_id_bytes: [u8; 32],
        latitude: i64,
        longitude: i64,
        project_type: u8,
        metadata_cid: String,
    ) -> Result<()> {
        instructions::handle_submit_tree(
            ctx,
            tree_id_bytes,
            latitude,
            longitude,
            project_type,
            metadata_cid,
        )
    }

    /// Approved Nature Hero validator casts an approval or rejection review vote
    pub fn review_tree(ctx: Context<ReviewTree>, approve: bool) -> Result<()> {
        instructions::handle_review_tree(ctx, approve)
    }

    /// Admin initializes the official Naturre Tree Collection on Metaplex Core
    pub fn initialize_tree_collection(
        ctx: Context<InitializeTreeCollection>,
        name: String,
        uri: String,
    ) -> Result<()> {
        instructions::handle_initialize_tree_collection(ctx, name, uri)
    }

    /// Planter mints a transferable Metaplex Core digital asset for a verified tree
    pub fn mint_tree_nft(
        ctx: Context<MintTreeNft>,
        name: String,
        uri: String,
    ) -> Result<()> {
        instructions::handle_mint_tree_nft(ctx, name, uri)
    }
}

use anchor_lang::prelude::*;
use crate::constants::{
    CONFIG_SEED, MILESTONE_FIRST_ROOT, MILESTONE_FLAG_FIRST_ROOT, MILESTONE_FLAG_FOREST_GUARDIAN,
    MILESTONE_FLAG_GROVE_BUILDER, MILESTONE_FOREST_GUARDIAN, MILESTONE_GROVE_BUILDER, TREE_SEED,
    USER_STATS_SEED, VALIDATOR_SEED, VOTE_SEED,
};
use crate::errors::NaturreError;
use crate::events::{MilestoneReached, TreeReviewed};
use crate::state::{ProtocolConfig, TreeRecord, TreeStatus, UserStats, ValidatorProfile, VoteRecord};

#[derive(Accounts)]
pub struct ReviewTree<'info> {
    #[account(mut)]
    pub validator: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [VALIDATOR_SEED, validator.key().as_ref()],
        bump = validator_profile.bump
    )]
    pub validator_profile: Account<'info, ValidatorProfile>,

    /// CHECK: Planter account whose tree is being reviewed
    pub planter: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [TREE_SEED, planter.key().as_ref(), tree_record.tree_id_bytes.as_ref()],
        bump = tree_record.bump
    )]
    pub tree_record: Account<'info, TreeRecord>,

    #[account(
        init,
        payer = validator,
        space = VoteRecord::LEN,
        seeds = [VOTE_SEED, tree_record.key().as_ref(), validator.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        seeds = [USER_STATS_SEED, planter.key().as_ref()],
        bump = user_stats.bump
    )]
    pub user_stats: Account<'info, UserStats>,

    pub system_program: Program<'info, System>,
}

pub fn handle_review_tree(ctx: Context<ReviewTree>, approve: bool) -> Result<()> {
    require!(!ctx.accounts.protocol_config.is_paused, NaturreError::ProtocolPaused);

    // Only active approved validators can vote
    let profile = &mut ctx.accounts.validator_profile;
    require!(profile.is_active, NaturreError::ValidatorNotActive);

    let tree = &mut ctx.accounts.tree_record;

    // Tree must be in Pending review status
    require!(tree.status == TreeStatus::Pending, NaturreError::TreeNotPending);

    // Anti-self-validation: planter cannot validate their own tree
    require!(
        tree.planter != ctx.accounts.validator.key(),
        NaturreError::SelfValidationNotAllowed
    );

    // Planter pubkey must match
    require_keys_eq!(tree.planter, ctx.accounts.planter.key(), NaturreError::InvalidPlanter);

    let clock = Clock::get()?;

    // Record the vote in VoteRecord
    let vote = &mut ctx.accounts.vote_record;
    vote.tree = tree.key();
    vote.validator = ctx.accounts.validator.key();
    vote.approved = approve;
    vote.voted_at = clock.unix_timestamp;
    vote.bump = ctx.bumps.vote_record;

    // Update validator stats
    profile.total_reviewed = profile.total_reviewed.saturating_add(1);
    profile.last_reviewed_at = clock.unix_timestamp;

    if approve {
        tree.approvals_count = tree.approvals_count.saturating_add(1);
        profile.total_approved = profile.total_approved.saturating_add(1);
    } else {
        tree.rejections_count = tree.rejections_count.saturating_add(1);
        profile.total_rejected = profile.total_rejected.saturating_add(1);
    }

    // Evaluate 2-of-N consensus quorum
    let required = ctx.accounts.protocol_config.required_approvals;
    let stats = &mut ctx.accounts.user_stats;

    if tree.approvals_count >= required {
        tree.status = TreeStatus::Verified;
        tree.verified_at = Some(clock.unix_timestamp);

        // Update planter verified tree count
        stats.trees_verified = stats.trees_verified.saturating_add(1);

        // Check milestones: First Root (1), Grove Builder (10), Forest Guardian (50)
        if stats.trees_verified >= MILESTONE_FIRST_ROOT
            && (stats.claimed_milestones & MILESTONE_FLAG_FIRST_ROOT) == 0
        {
            stats.claimed_milestones |= MILESTONE_FLAG_FIRST_ROOT;
            emit!(MilestoneReached {
                user: tree.planter,
                tier: 0,
                total_verified_trees: stats.trees_verified,
                timestamp: clock.unix_timestamp,
            });
        }

        if stats.trees_verified >= MILESTONE_GROVE_BUILDER
            && (stats.claimed_milestones & MILESTONE_FLAG_GROVE_BUILDER) == 0
        {
            stats.claimed_milestones |= MILESTONE_FLAG_GROVE_BUILDER;
            emit!(MilestoneReached {
                user: tree.planter,
                tier: 1,
                total_verified_trees: stats.trees_verified,
                timestamp: clock.unix_timestamp,
            });
        }

        if stats.trees_verified >= MILESTONE_FOREST_GUARDIAN
            && (stats.claimed_milestones & MILESTONE_FLAG_FOREST_GUARDIAN) == 0
        {
            stats.claimed_milestones |= MILESTONE_FLAG_FOREST_GUARDIAN;
            emit!(MilestoneReached {
                user: tree.planter,
                tier: 2,
                total_verified_trees: stats.trees_verified,
                timestamp: clock.unix_timestamp,
            });
        }
    } else if tree.rejections_count >= required {
        tree.status = TreeStatus::Rejected;
    }
    // Note: If 1 approval and 1 rejection (or less than required), tree remains in Pending status!

    emit!(TreeReviewed {
        tree_pda: tree.key(),
        validator: ctx.accounts.validator.key(),
        approved: approve,
        approvals_count: tree.approvals_count,
        rejections_count: tree.rejections_count,
        new_status: tree.status,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

use anchor_lang::prelude::*;

#[error_code]
pub enum NaturreError {
    #[msg("Unauthorized: Signer is not the designated protocol admin.")]
    UnauthorizedAdmin,

    #[msg("Protocol is currently paused by emergency circuit breaker.")]
    ProtocolPaused,

    #[msg("Validator is not active or has been revoked.")]
    ValidatorNotActive,

    #[msg("Validator is already active.")]
    ValidatorAlreadyActive,

    #[msg("Anti-Self-Validation: Planters cannot review or validate their own trees.")]
    SelfValidationNotAllowed,

    #[msg("Validator has already submitted a review vote for this tree record.")]
    DuplicateVote,

    #[msg("Tree record is not in Pending status and cannot be reviewed.")]
    TreeNotPending,

    #[msg("Invalid GPS coordinates. Latitude must be in [-90, 90] and Longitude in [-180, 180] scaled by 10^7.")]
    InvalidGpsCoordinates,

    #[msg("Invalid metadata CID. URI must not be empty and must not exceed maximum length.")]
    InvalidMetadataCid,

    #[msg("Required approvals must be at least 1.")]
    InvalidRequiredApprovals,

    #[msg("Tree record has already been minted as an NFT.")]
    TreeAlreadyMinted,

    #[msg("Tree record has not reached Verified status.")]
    TreeNotVerified,

    #[msg("Invalid planter account for this tree record.")]
    InvalidPlanter,

    #[msg("Milestone threshold has not been reached for this tier.")]
    MilestoneNotReached,

    #[msg("Milestone badge has already been claimed for this tier.")]
    MilestoneAlreadyClaimed,

    #[msg("Tree collection has already been initialized.")]
    TreeCollectionAlreadyInitialized,

    #[msg("Tree collection has not been initialized yet.")]
    TreeCollectionNotInitialized,

    #[msg("Invalid collection account. Account does not match protocol tree collection.")]
    InvalidCollection,

    #[msg("Milestone collection has already been initialized.")]
    MilestoneCollectionAlreadyInitialized,

    #[msg("Milestone collection has not been initialized yet.")]
    MilestoneCollectionNotInitialized,

    #[msg("Invalid milestone tier. Must be 0 (First Root), 1 (Grove Builder), or 2 (Forest Guardian).")]
    InvalidMilestoneTier,
}

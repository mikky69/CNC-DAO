import { PublicKey } from "@solana/web3.js"

export interface ProtocolInitializedData {
  admin: PublicKey
  feeTreasury: PublicKey
  requiredApprovals: number
  protocolFeeLamports: anchorBNLike
  timestamp: anchorBNLike
}

export interface ProtocolPauseToggledData {
  admin: PublicKey
  isPaused: boolean
  timestamp: anchorBNLike
}

export interface ValidatorApprovedData {
  admin: PublicKey
  validator: PublicKey
  badgeAsset: PublicKey | null
  timestamp: anchorBNLike
}

export interface ValidatorRevokedData {
  admin: PublicKey
  validator: PublicKey
  badgeBurned: boolean
  timestamp: anchorBNLike
}

export interface TreeSubmittedData {
  planter: PublicKey
  treePda: PublicKey
  treeIdBytes: number[]
  latitude: anchorBNLike
  longitude: anchorBNLike
  projectType: number
  metadataCid: string
  timestamp: anchorBNLike
}

export interface TreeReviewedData {
  treePda: PublicKey
  validator: PublicKey
  approved: boolean
  approvalsCount: number
  rejectionsCount: number
  newStatus: { pending?: object; verified?: object; rejected?: object; minted?: object }
  timestamp: anchorBNLike
}

export interface MilestoneReachedData {
  user: PublicKey
  tier: number
  totalVerifiedTrees: number
  timestamp: anchorBNLike
}

export interface TreeCollectionInitializedData {
  admin: PublicKey
  collection: PublicKey
  name: string
  uri: string
  timestamp: anchorBNLike
}

export interface TreeNftMintedData {
  planter: PublicKey
  treePda: PublicKey
  asset: PublicKey
  treeIdBytes: number[]
  timestamp: anchorBNLike
}

export interface MilestoneCollectionInitializedData {
  admin: PublicKey
  collection: PublicKey
  name: string
  uri: string
  timestamp: anchorBNLike
}

export interface MilestoneBadgeClaimedData {
  user: PublicKey
  badgeAsset: PublicKey
  tier: number
  treesVerified: number
  timestamp: anchorBNLike
}

export type anchorBNLike = {
  toNumber(): number
  toString(): string
} | number | bigint

export type NaturreEventName =
  | "ProtocolInitialized"
  | "ProtocolPauseToggled"
  | "ValidatorApproved"
  | "ValidatorRevoked"
  | "TreeSubmitted"
  | "TreeReviewed"
  | "MilestoneReached"
  | "TreeCollectionInitialized"
  | "TreeNftMinted"
  | "MilestoneCollectionInitialized"
  | "MilestoneBadgeClaimed"

export interface NaturreEventPayload {
  name: NaturreEventName
  data: any
}

export interface IndexedEvent {
  signature: string
  slot: number
  blockTime: number
  event: NaturreEventPayload
}

export interface IndexerConfig {
  rpcUrl: string
  wsUrl?: string
  programId: PublicKey
  commitment: "confirmed" | "finalized"
  pollingIntervalMs?: number
  maxRetries?: number
  batchSize?: number
}

export type DiscrepancyType =
  | "MISSING_TREE"
  | "STATUS_MISMATCH"
  | "APPROVALS_MISMATCH"
  | "MISSING_NFT"
  | "VALIDATOR_STATUS_MISMATCH"
  | "MISSING_MILESTONE_CLAIM"
  | "CONFIG_MISMATCH"

export interface ReconciliationDiscrepancy {
  type: DiscrepancyType
  identifier: string
  onChainValue: any
  convexValue: any
  description: string
}

export interface ReconciliationReport {
  checkedAt: string
  totalTreesChecked: number
  totalValidatorsChecked: number
  totalMilestonesChecked: number
  discrepanciesCount: number
  discrepancies: ReconciliationDiscrepancy[]
}

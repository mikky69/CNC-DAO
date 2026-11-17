import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"

export interface SyncProtocolInitializedArgs {
  adminAuthority: string
  feeTreasury: string
  requiredApprovals: number
  protocolFeeLamports: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncProtocolPauseToggledArgs {
  adminAuthority: string
  isPaused: boolean
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncTreeCollectionInitializedArgs {
  collectionAddress: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncMilestoneCollectionInitializedArgs {
  collectionAddress: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncValidatorApprovedArgs {
  validatorWallet: string
  badgeAsset?: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncValidatorRevokedArgs {
  validatorWallet: string
  badgeBurned: boolean
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncTreeSubmittedArgs {
  planterWallet: string
  treePda: string
  treeIdBytesHex: string
  lat: number
  lng: number
  projectType: number
  metadataCid: string
  txSignature: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncTreeReviewedArgs {
  treePda: string
  validatorWallet: string
  approved: boolean
  approvalsCount: number
  rejectionsCount: number
  onChainStatus: string
  txSignature: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncTreeNftMintedArgs {
  treePda: string
  nftAssetAddress: string
  planterWallet: string
  txSignature: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface SyncMilestoneBadgeClaimedArgs {
  walletAddress: string
  badgeAsset: string
  tier: number
  treesVerified: number
  badgeName: string
  txSignature: string
  slot: number
  timestamp: string
  syncSecret?: string
}

export interface RecordIndexerCheckpointArgs {
  key: string
  lastSlot: number
  lastSignature?: string
  processedEventsCount: number
  timestamp: string
  syncSecret?: string
}

export interface RecordIndexerErrorArgs {
  signature: string
  slot?: number
  eventName: string
  errorMessage: string
  rawEvent: string
  timestamp: string
  syncSecret?: string
}

export interface IConvexSyncClient {
  syncProtocolInitialized(args: SyncProtocolInitializedArgs): Promise<any>
  syncProtocolPauseToggled(args: SyncProtocolPauseToggledArgs): Promise<any>
  syncTreeCollectionInitialized(args: SyncTreeCollectionInitializedArgs): Promise<any>
  syncMilestoneCollectionInitialized(args: SyncMilestoneCollectionInitializedArgs): Promise<any>
  syncValidatorApproved(args: SyncValidatorApprovedArgs): Promise<any>
  syncValidatorRevoked(args: SyncValidatorRevokedArgs): Promise<any>
  syncTreeSubmitted(args: SyncTreeSubmittedArgs): Promise<any>
  syncTreeReviewed(args: SyncTreeReviewedArgs): Promise<any>
  syncTreeNftMinted(args: SyncTreeNftMintedArgs): Promise<any>
  syncMilestoneBadgeClaimed(args: SyncMilestoneBadgeClaimedArgs): Promise<any>
  recordIndexerCheckpoint(args: RecordIndexerCheckpointArgs): Promise<any>
  recordIndexerError(args: RecordIndexerErrorArgs): Promise<any>
  getTreeByPda(onChainPda: string): Promise<any>
  getMilestoneClaimsByWallet(walletAddress: string): Promise<any[]>
  getIndexerState(key: string): Promise<any>
  getProtocolConfig(): Promise<any>
  getAllTreesForReconciliation(): Promise<any[]>
  getAllValidatorsForReconciliation(): Promise<any[]>
}

/**
 * Production Convex client communicating over HTTP with a deployed Convex instance.
 */
export class HttpConvexClient implements IConvexSyncClient {
  private client: ConvexHttpClient
  private syncSecret?: string

  constructor(convexUrl: string, syncSecret?: string) {
    this.client = new ConvexHttpClient(convexUrl)
    this.syncSecret = syncSecret
  }

  private withSecret<T extends object>(args: T): T & { syncSecret?: string } {
    return { ...args, syncSecret: this.syncSecret }
  }

  async syncProtocolInitialized(args: SyncProtocolInitializedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncProtocolInitialized, this.withSecret(args))
  }

  async syncProtocolPauseToggled(args: SyncProtocolPauseToggledArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncProtocolPauseToggled, this.withSecret(args))
  }

  async syncTreeCollectionInitialized(args: SyncTreeCollectionInitializedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncTreeCollectionInitialized, this.withSecret(args))
  }

  async syncMilestoneCollectionInitialized(args: SyncMilestoneCollectionInitializedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncMilestoneCollectionInitialized, this.withSecret(args))
  }

  async syncValidatorApproved(args: SyncValidatorApprovedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncValidatorApproved, this.withSecret(args))
  }

  async syncValidatorRevoked(args: SyncValidatorRevokedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncValidatorRevoked, this.withSecret(args))
  }

  async syncTreeSubmitted(args: SyncTreeSubmittedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncTreeSubmitted, this.withSecret(args))
  }

  async syncTreeReviewed(args: SyncTreeReviewedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncTreeReviewed, this.withSecret(args))
  }

  async syncTreeNftMinted(args: SyncTreeNftMintedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncTreeNftMinted, this.withSecret(args))
  }

  async syncMilestoneBadgeClaimed(args: SyncMilestoneBadgeClaimedArgs): Promise<any> {
    return await this.client.mutation(api.sync.syncMilestoneBadgeClaimed, this.withSecret(args))
  }

  async recordIndexerCheckpoint(args: RecordIndexerCheckpointArgs): Promise<any> {
    return await this.client.mutation(api.sync.recordIndexerCheckpoint, this.withSecret(args))
  }

  async recordIndexerError(args: RecordIndexerErrorArgs): Promise<any> {
    return await this.client.mutation(api.sync.recordIndexerError, this.withSecret(args))
  }

  async getTreeByPda(onChainPda: string): Promise<any> {
    return await this.client.query(api.sync.getTreeByPda, { onChainPda })
  }

  async getMilestoneClaimsByWallet(walletAddress: string): Promise<any[]> {
    return await this.client.query(api.sync.getMilestoneClaimsByWallet, { walletAddress })
  }

  async getIndexerState(key: string): Promise<any> {
    return await this.client.query(api.sync.getIndexerState, { key })
  }

  async getProtocolConfig(): Promise<any> {
    return await this.client.query(api.sync.getProtocolConfig, {})
  }

  async getAllTreesForReconciliation(): Promise<any[]> {
    return await this.client.query(api.sync.getAllTreesForReconciliation, {})
  }

  async getAllValidatorsForReconciliation(): Promise<any[]> {
    return await this.client.query(api.sync.getAllValidatorsForReconciliation, {})
  }
}

/**
 * In-memory client mirror for unit and integration testing without requiring a live cloud backend.
 * Provides identical semantics, constraints, and idempotency guarantees as convex/sync.ts.
 */
export class InMemoryConvexClient implements IConvexSyncClient {
  public trees: Map<string, any> = new Map()
  public users: Map<string, any> = new Map()
  public validations: any[] = []
  public milestoneClaims: any[] = []
  public protocolConfigs: Map<string, any> = new Map()
  public indexerState: Map<string, any> = new Map()
  public indexerErrors: any[] = []
  public stats: Map<string, number> = new Map()

  public expectedSyncSecret?: string

  constructor(expectedSyncSecret?: string) {
    this.expectedSyncSecret = expectedSyncSecret
  }

  private assertAuth(secret?: string) {
    if (this.expectedSyncSecret && this.expectedSyncSecret !== secret) {
      throw new Error("Unauthorized: Invalid or missing indexer sync secret")
    }
  }

  async syncProtocolInitialized(args: SyncProtocolInitializedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    const existingKey = Array.from(this.protocolConfigs.keys()).find(
      (k) => this.protocolConfigs.get(k)?.adminAuthority === args.adminAuthority
    )
    if (existingKey) {
      const existing = this.protocolConfigs.get(existingKey)
      existing.feeTreasury = args.feeTreasury
      existing.requiredApprovals = args.requiredApprovals
      existing.protocolFeeLamports = args.protocolFeeLamports
      existing.lastSyncedSlot = args.slot
      existing.updatedAt = args.timestamp
      return existingKey
    }

    const id = `proto_${Date.now()}_${Math.random()}`
    this.protocolConfigs.set(id, {
      _id: id,
      adminAuthority: args.adminAuthority,
      feeTreasury: args.feeTreasury,
      requiredApprovals: args.requiredApprovals,
      isPaused: false,
      protocolFeeLamports: args.protocolFeeLamports,
      lastSyncedSlot: args.slot,
      updatedAt: args.timestamp,
    })
    return id
  }

  async syncProtocolPauseToggled(args: SyncProtocolPauseToggledArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    for (const config of this.protocolConfigs.values()) {
      if (config.adminAuthority === args.adminAuthority) {
        config.isPaused = args.isPaused
        config.lastSyncedSlot = args.slot
        config.updatedAt = args.timestamp
      }
    }
  }

  async syncTreeCollectionInitialized(args: SyncTreeCollectionInitializedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    for (const config of this.protocolConfigs.values()) {
      config.treeCollection = args.collectionAddress
      config.lastSyncedSlot = args.slot
      config.updatedAt = args.timestamp
      return config._id
    }
    const id = `proto_${Date.now()}_${Math.random()}`
    this.protocolConfigs.set(id, {
      _id: id,
      adminAuthority: "pending_init",
      feeTreasury: "pending_init",
      requiredApprovals: 2,
      isPaused: false,
      treeCollection: args.collectionAddress,
      protocolFeeLamports: "0",
      lastSyncedSlot: args.slot,
      updatedAt: args.timestamp,
    })
    return id
  }

  async syncMilestoneCollectionInitialized(args: SyncMilestoneCollectionInitializedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    for (const config of this.protocolConfigs.values()) {
      config.badgeCollection = args.collectionAddress
      config.lastSyncedSlot = args.slot
      config.updatedAt = args.timestamp
      return config._id
    }
    const id = `proto_${Date.now()}_${Math.random()}`
    this.protocolConfigs.set(id, {
      _id: id,
      adminAuthority: "pending_init",
      feeTreasury: "pending_init",
      requiredApprovals: 2,
      isPaused: false,
      badgeCollection: args.collectionAddress,
      protocolFeeLamports: "0",
      lastSyncedSlot: args.slot,
      updatedAt: args.timestamp,
    })
    return id
  }

  async syncValidatorApproved(args: SyncValidatorApprovedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    let existingUserKey = Array.from(this.users.keys()).find(
      (k) => this.users.get(k)?.walletAddress === args.validatorWallet
    )

    if (existingUserKey) {
      const user = this.users.get(existingUserKey)
      user.role = "nature_hero"
      user.isValidatorActive = true
      user.validatorApprovedAt = args.timestamp
      user.badgeAsset = args.badgeAsset
      return existingUserKey
    }

    const id = `user_${Date.now()}_${Math.random()}`
    this.users.set(id, {
      _id: id,
      walletAddress: args.validatorWallet,
      name: `Nature Hero (${args.validatorWallet.slice(0, 4)}...${args.validatorWallet.slice(-4)})`,
      role: "nature_hero",
      isValidatorActive: true,
      validatorApprovedAt: args.timestamp,
      badgeAsset: args.badgeAsset,
      joinedAt: args.timestamp,
    })
    return id
  }

  async syncValidatorRevoked(args: SyncValidatorRevokedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    for (const user of this.users.values()) {
      if (user.walletAddress === args.validatorWallet) {
        user.role = "user"
        user.isValidatorActive = false
        user.badgeAsset = undefined
        return user._id
      }
    }
    return null
  }

  async syncTreeSubmitted(args: SyncTreeSubmittedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    // 1. Check idempotency by onChainPda
    for (const tree of this.trees.values()) {
      if (tree.onChainPda === args.treePda || tree.treeIdBytesHex === args.treeIdBytesHex) {
        tree.walletAddress = args.planterWallet
        tree.treeIdBytesHex = args.treeIdBytesHex
        tree.onChainPda = args.treePda
        tree.submissionTx = args.txSignature
        tree.submissionSlot = args.slot
        tree.lat = args.lat
        tree.lng = args.lng
        tree.onChainStatus = tree.onChainStatus || "pending"
        tree.lastSyncedSlot = args.slot
        tree.lastSyncedAt = args.timestamp
        return tree._id
      }
    }

    const id = `tree_${Date.now()}_${Math.random()}`
    this.trees.set(id, {
      _id: id,
      walletAddress: args.planterWallet,
      name: `Tree #${args.treeIdBytesHex.slice(0, 8)}`,
      species: "Verified Planting",
      location: `Coordinates: ${args.lat.toFixed(4)}, ${args.lng.toFixed(4)}`,
      lat: args.lat,
      lng: args.lng,
      status: "pending",
      onChainStatus: "pending",
      treeIdBytesHex: args.treeIdBytesHex,
      onChainPda: args.treePda,
      submissionTx: args.txSignature,
      submissionSlot: args.slot,
      lastSyncedSlot: args.slot,
      lastSyncedAt: args.timestamp,
      createdAt: args.timestamp,
    })

    const count = (this.stats.get("trees_planted") || 0) + 1
    this.stats.set("trees_planted", count)
    return id
  }

  async syncTreeReviewed(args: SyncTreeReviewedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    let tree: any = null
    for (const t of this.trees.values()) {
      if (t.onChainPda === args.treePda) {
        tree = t
        break
      }
    }

    // Resilient out-of-order handling
    if (!tree) {
      const id = `tree_${Date.now()}_${Math.random()}`
      tree = {
        _id: id,
        walletAddress: "pending_submission",
        name: `Tree (${args.treePda.slice(0, 8)}...)`,
        species: "Pending Submission",
        location: "On-Chain Synchronized",
        lat: 0,
        lng: 0,
        status: args.onChainStatus === "verified" ? "verified" : "pending",
        onChainStatus: args.onChainStatus,
        onChainPda: args.treePda,
        approvalsCount: args.approvalsCount,
        rejectionsCount: args.rejectionsCount,
        lastSyncedSlot: args.slot,
        lastSyncedAt: args.timestamp,
        createdAt: args.timestamp,
      }
      this.trees.set(id, tree)
    } else {
      let newAppStatus = tree.status
      if (args.onChainStatus === "verified" && tree.status !== "minted") {
        newAppStatus = "verified"
      }

      tree.approvalsCount = args.approvalsCount
      tree.rejectionsCount = args.rejectionsCount
      tree.onChainStatus = args.onChainStatus
      tree.status = newAppStatus
      tree.lastSyncedSlot = args.slot
      tree.lastSyncedAt = args.timestamp
      if (args.onChainStatus === "verified" && !tree.verifiedAt) {
        tree.verifiedAt = args.timestamp
      }
    }

    const existingVal = this.validations.find((v) => v.txSignature === args.txSignature)
    if (!existingVal) {
      this.validations.push({
        _id: `val_${Date.now()}_${Math.random()}`,
        treeId: tree._id,
        validatorWallet: args.validatorWallet,
        approved: args.approved,
        decision: args.approved ? "approved" : "rejected",
        status: args.onChainStatus,
        txSignature: args.txSignature,
        slot: args.slot,
        onChainPda: args.treePda,
        createdAt: args.timestamp,
      })
    }

    if (args.onChainStatus === "verified") {
      const verified = (this.stats.get("trees_verified") || 0) + 1
      this.stats.set("trees_verified", verified)
    }

    return tree._id
  }

  async syncTreeNftMinted(args: SyncTreeNftMintedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    let tree: any = null
    for (const t of this.trees.values()) {
      if (t.onChainPda === args.treePda) {
        tree = t
        break
      }
    }
    if (!tree) {
      // Resilient out-of-order handling
      const id = `tree_${Date.now()}_${Math.random()}`
      this.trees.set(id, {
        _id: id,
        walletAddress: args.planterWallet,
        name: "Tree (Minted)",
        species: "Verified Planting",
        location: "On-Chain Synchronized",
        lat: 0,
        lng: 0,
        status: "minted",
        onChainStatus: "minted",
        onChainPda: args.treePda,
        nftAssetAddress: args.nftAssetAddress,
        mintTx: args.txSignature,
        mintSlot: args.slot,
        lastSyncedSlot: args.slot,
        lastSyncedAt: args.timestamp,
        createdAt: args.timestamp,
      })
      const minted = (this.stats.get("nfts_minted") || 0) + 1
      this.stats.set("nfts_minted", minted)
      return id
    }

    tree.nftAssetAddress = args.nftAssetAddress
    tree.mintTx = args.txSignature
    tree.mintSlot = args.slot
    tree.status = "minted"
    tree.onChainStatus = "minted"
    tree.lastSyncedSlot = args.slot
    tree.lastSyncedAt = args.timestamp

    const minted = (this.stats.get("nfts_minted") || 0) + 1
    this.stats.set("nfts_minted", minted)

    return tree._id
  }

  async syncMilestoneBadgeClaimed(args: SyncMilestoneBadgeClaimedArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    const existing = this.milestoneClaims.find((c) => c.badgeAsset === args.badgeAsset)
    if (existing) return existing._id

    const id = `claim_${Date.now()}_${Math.random()}`
    this.milestoneClaims.push({
      _id: id,
      walletAddress: args.walletAddress,
      tier: args.tier,
      badgeName: args.badgeName,
      badgeAsset: args.badgeAsset,
      treesVerified: args.treesVerified,
      txSignature: args.txSignature,
      slot: args.slot,
      claimedAt: args.timestamp,
    })
    return id
  }

  async recordIndexerCheckpoint(args: RecordIndexerCheckpointArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    this.indexerState.set(args.key, {
      key: args.key,
      lastSlot: args.lastSlot,
      lastSignature: args.lastSignature,
      processedEventsCount: args.processedEventsCount,
      updatedAt: args.timestamp,
    })
    return args.key
  }

  async recordIndexerError(args: RecordIndexerErrorArgs): Promise<any> {
    this.assertAuth(args.syncSecret)
    const id = `err_${Date.now()}_${Math.random()}`
    this.indexerErrors.push({
      _id: id,
      signature: args.signature,
      slot: args.slot,
      eventName: args.eventName,
      errorMessage: args.errorMessage,
      rawEvent: args.rawEvent,
      resolved: false,
      timestamp: args.timestamp,
    })
    return id
  }

  async getTreeByPda(onChainPda: string): Promise<any> {
    for (const t of this.trees.values()) {
      if (t.onChainPda === onChainPda) return t
    }
    return null
  }

  async getMilestoneClaimsByWallet(walletAddress: string): Promise<any[]> {
    return this.milestoneClaims.filter((c) => c.walletAddress === walletAddress)
  }

  async getIndexerState(key: string): Promise<any> {
    return this.indexerState.get(key) || null
  }

  async getProtocolConfig(): Promise<any> {
    const values = Array.from(this.protocolConfigs.values())
    return values.length > 0 ? values[0] : null
  }

  async getAllTreesForReconciliation(): Promise<any[]> {
    return Array.from(this.trees.values())
  }

  async getAllValidatorsForReconciliation(): Promise<any[]> {
    return Array.from(this.users.values()).filter((u) => u.role === "nature_hero")
  }
}

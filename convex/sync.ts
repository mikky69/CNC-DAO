import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

// ─── Authorization Helper ───────────────────────────────────────────────────

/**
 * Validates that the mutation is invoked by an authorized indexer daemon.
 * If INDEXER_SYNC_SECRET is set in the Convex environment, callers must provide
 * a matching syncSecret argument.
 */
function assertAuthorizedSync(syncSecret?: string) {
  const configuredSecret = process.env.INDEXER_SYNC_SECRET
  if (configuredSecret && configuredSecret !== syncSecret) {
    throw new Error("Unauthorized: Invalid or missing indexer sync secret")
  }
}

// ─── Protocol Configuration Sync ─────────────────────────────────────────────

export const syncProtocolInitialized = mutation({
  args: {
    adminAuthority: v.string(),
    feeTreasury: v.string(),
    requiredApprovals: v.number(),
    protocolFeeLamports: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const existing = await ctx.db
      .query("protocolConfigs")
      .withIndex("by_adminAuthority", (q) => q.eq("adminAuthority", args.adminAuthority))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        feeTreasury: args.feeTreasury,
        requiredApprovals: args.requiredApprovals,
        protocolFeeLamports: args.protocolFeeLamports,
        lastSyncedSlot: args.slot,
        updatedAt: args.timestamp,
      })
      return existing._id
    }

    return await ctx.db.insert("protocolConfigs", {
      adminAuthority: args.adminAuthority,
      feeTreasury: args.feeTreasury,
      requiredApprovals: args.requiredApprovals,
      isPaused: false,
      protocolFeeLamports: args.protocolFeeLamports,
      lastSyncedSlot: args.slot,
      updatedAt: args.timestamp,
    })
  },
})

export const syncProtocolPauseToggled = mutation({
  args: {
    adminAuthority: v.string(),
    isPaused: v.boolean(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const config = await ctx.db
      .query("protocolConfigs")
      .withIndex("by_adminAuthority", (q) => q.eq("adminAuthority", args.adminAuthority))
      .first()

    if (config) {
      await ctx.db.patch(config._id, {
        isPaused: args.isPaused,
        lastSyncedSlot: args.slot,
        updatedAt: args.timestamp,
      })
    }
  },
})

export const syncTreeCollectionInitialized = mutation({
  args: {
    collectionAddress: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const config = await ctx.db.query("protocolConfigs").first()
    if (config) {
      await ctx.db.patch(config._id, {
        treeCollection: args.collectionAddress,
        lastSyncedSlot: args.slot,
        updatedAt: args.timestamp,
      })
      return config._id
    }
    return await ctx.db.insert("protocolConfigs", {
      adminAuthority: "pending_init",
      feeTreasury: "pending_init",
      requiredApprovals: 2,
      isPaused: false,
      treeCollection: args.collectionAddress,
      protocolFeeLamports: "0",
      lastSyncedSlot: args.slot,
      updatedAt: args.timestamp,
    })
  },
})

export const syncMilestoneCollectionInitialized = mutation({
  args: {
    collectionAddress: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const config = await ctx.db.query("protocolConfigs").first()
    if (config) {
      await ctx.db.patch(config._id, {
        badgeCollection: args.collectionAddress,
        lastSyncedSlot: args.slot,
        updatedAt: args.timestamp,
      })
      return config._id
    }
    return await ctx.db.insert("protocolConfigs", {
      adminAuthority: "pending_init",
      feeTreasury: "pending_init",
      requiredApprovals: 2,
      isPaused: false,
      badgeCollection: args.collectionAddress,
      protocolFeeLamports: "0",
      lastSyncedSlot: args.slot,
      updatedAt: args.timestamp,
    })
  },
})

// ─── Validator / Nature Hero Sync ────────────────────────────────────────────

export const syncValidatorApproved = mutation({
  args: {
    validatorWallet: v.string(),
    badgeAsset: v.optional(v.string()),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const user = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.validatorWallet))
      .first()

    if (user) {
      await ctx.db.patch(user._id, {
        role: "nature_hero",
        isValidatorActive: true,
        validatorApprovedAt: args.timestamp,
        badgeAsset: args.badgeAsset,
      })

      // Resolve any pending Nature Hero applications for this user
      const app = await ctx.db
        .query("natureHeroApplications")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first()

      if (app) {
        await ctx.db.patch(app._id, {
          status: "approved",
          reviewedBy: "on_chain_validator",
        })
      }
      return user._id
    }

    // Auto-create user record for on-chain approved validator
    return await ctx.db.insert("users", {
      walletAddress: args.validatorWallet,
      name: `Nature Hero (${args.validatorWallet.slice(0, 4)}...${args.validatorWallet.slice(-4)})`,
      role: "nature_hero",
      isValidatorActive: true,
      validatorApprovedAt: args.timestamp,
      badgeAsset: args.badgeAsset,
      joinedAt: args.timestamp,
    })
  },
})

export const syncValidatorRevoked = mutation({
  args: {
    validatorWallet: v.string(),
    badgeBurned: v.boolean(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const user = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.validatorWallet))
      .first()

    if (user) {
      await ctx.db.patch(user._id, {
        role: "user",
        isValidatorActive: false,
        badgeAsset: undefined,
      })
      return user._id
    }
    return null
  },
})

// ─── Tree Submission & Review Sync ───────────────────────────────────────────

export const syncTreeSubmitted = mutation({
  args: {
    planterWallet: v.string(),
    treePda: v.string(),
    treeIdBytesHex: v.string(),
    lat: v.number(),
    lng: v.number(),
    projectType: v.number(),
    metadataCid: v.string(),
    txSignature: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    // 1. Check idempotency by onChainPda
    let existing = await ctx.db
      .query("trees")
      .withIndex("by_onChainPda", (q) => q.eq("onChainPda", args.treePda))
      .first()

    // 2. Fallback check by treeIdBytesHex
    if (!existing) {
      existing = await ctx.db
        .query("trees")
        .withIndex("by_treeIdBytesHex", (q) => q.eq("treeIdBytesHex", args.treeIdBytesHex))
        .first()
    }

    if (existing) {
      // Out-of-order recovery / update existing stub or previous record
      await ctx.db.patch(existing._id, {
        walletAddress: args.planterWallet,
        name: existing.name.startsWith("Tree (") ? `Tree #${args.treeIdBytesHex.slice(0, 8)}` : existing.name,
        species: existing.species === "Pending Submission" ? "Verified Planting" : existing.species,
        location: existing.location === "On-Chain Synchronized" ? `Coordinates: ${args.lat.toFixed(4)}, ${args.lng.toFixed(4)}` : existing.location,
        lat: args.lat,
        lng: args.lng,
        onChainPda: args.treePda,
        treeIdBytesHex: args.treeIdBytesHex,
        submissionTx: args.txSignature,
        submissionSlot: args.slot,
        onChainStatus: existing.onChainStatus || "pending",
        lastSyncedSlot: args.slot,
        lastSyncedAt: args.timestamp,
      })
      return existing._id
    }

    // 3. Insert new tree record from on-chain event
    const newId = await ctx.db.insert("trees", {
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

    // Update global planted stats
    const plantedStat = await ctx.db
      .query("stats")
      .withIndex("by_key", (q) => q.eq("key", "trees_planted"))
      .first()
    if (plantedStat) {
      await ctx.db.patch(plantedStat._id, {
        value: plantedStat.value + 1,
        updatedAt: args.timestamp,
      })
    } else {
      await ctx.db.insert("stats", {
        key: "trees_planted",
        value: 1,
        updatedAt: args.timestamp,
      })
    }

    return newId
  },
})

export const syncTreeReviewed = mutation({
  args: {
    treePda: v.string(),
    validatorWallet: v.string(),
    approved: v.boolean(),
    approvalsCount: v.number(),
    rejectionsCount: v.number(),
    onChainStatus: v.string(), // "pending" | "verified" | "rejected"
    txSignature: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    let tree = await ctx.db
      .query("trees")
      .withIndex("by_onChainPda", (q) => q.eq("onChainPda", args.treePda))
      .first()

    // Resilient out-of-order handling: if review arrives before submission
    let treeId = tree?._id
    if (!tree) {
      treeId = await ctx.db.insert("trees", {
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
      })
      tree = await ctx.db.get(treeId)
    } else {
      // Determine application status: "minted" preserves itself, otherwise maps "verified" or "pending"
      let newAppStatus: "pending" | "verified" | "minted" = tree.status
      if (args.onChainStatus === "verified" && tree.status !== "minted") {
        newAppStatus = "verified"
      }

      const patchData: any = {
        approvalsCount: args.approvalsCount,
        rejectionsCount: args.rejectionsCount,
        onChainStatus: args.onChainStatus,
        status: newAppStatus,
        lastSyncedSlot: args.slot,
        lastSyncedAt: args.timestamp,
      }

      if (args.onChainStatus === "verified" && !tree.verifiedAt) {
        patchData.verifiedAt = args.timestamp
      }

      await ctx.db.patch(tree._id, patchData)
    }

    // Idempotently record validation in validations table
    const existingVal = await ctx.db
      .query("validations")
      .withIndex("by_txSignature", (q) => q.eq("txSignature", args.txSignature))
      .first()

    if (!existingVal && treeId) {
      let validator = await ctx.db
        .query("users")
        .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.validatorWallet))
        .first()

      if (!validator) {
        const valId = await ctx.db.insert("users", {
          walletAddress: args.validatorWallet,
          name: `Nature Hero (${args.validatorWallet.slice(0, 4)}...)`,
          role: "nature_hero",
          joinedAt: args.timestamp,
        })
        validator = await ctx.db.get(valId)
      }

      if (validator) {
        await ctx.db.insert("validations", {
          treeId,
          validatorId: validator._id,
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
    }

    // Update verified stats if transitioning to verified
    if (args.onChainStatus === "verified" && tree && tree.status !== "verified" && tree.status !== "minted") {
      const verifiedStat = await ctx.db
        .query("stats")
        .withIndex("by_key", (q) => q.eq("key", "trees_verified"))
        .first()
      if (verifiedStat) {
        await ctx.db.patch(verifiedStat._id, {
          value: verifiedStat.value + 1,
          updatedAt: args.timestamp,
        })
      } else {
        await ctx.db.insert("stats", {
          key: "trees_verified",
          value: 1,
          updatedAt: args.timestamp,
        })
      }
    }

    return treeId
  },
})

export const syncTreeNftMinted = mutation({
  args: {
    treePda: v.string(),
    nftAssetAddress: v.string(),
    planterWallet: v.string(),
    txSignature: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const tree = await ctx.db
      .query("trees")
      .withIndex("by_onChainPda", (q) => q.eq("onChainPda", args.treePda))
      .first()

    if (!tree) {
      // Resilient out-of-order handling: insert record if NFT mint event arrives before submission
      return await ctx.db.insert("trees", {
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
    }

    await ctx.db.patch(tree._id, {
      nftAssetAddress: args.nftAssetAddress,
      mintTx: args.txSignature,
      mintSlot: args.slot,
      status: "minted",
      onChainStatus: "minted",
      lastSyncedSlot: args.slot,
      lastSyncedAt: args.timestamp,
    })

    // Update NFT stats
    const nftStat = await ctx.db
      .query("stats")
      .withIndex("by_key", (q) => q.eq("key", "nfts_minted"))
      .first()
    if (nftStat) {
      await ctx.db.patch(nftStat._id, {
        value: nftStat.value + 1,
        updatedAt: args.timestamp,
      })
    } else {
      await ctx.db.insert("stats", {
        key: "nfts_minted",
        value: 1,
        updatedAt: args.timestamp,
      })
    }

    return tree._id
  },
})

// ─── Milestone Claim Sync ────────────────────────────────────────────────────

export const syncMilestoneBadgeClaimed = mutation({
  args: {
    walletAddress: v.string(),
    badgeAsset: v.string(),
    tier: v.number(),
    treesVerified: v.number(),
    badgeName: v.string(),
    txSignature: v.string(),
    slot: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    // Idempotency: check if claim already recorded
    const existing = await ctx.db
      .query("milestoneClaims")
      .withIndex("by_badgeAsset", (q) => q.eq("badgeAsset", args.badgeAsset))
      .first()

    if (existing) return existing._id

    return await ctx.db.insert("milestoneClaims", {
      walletAddress: args.walletAddress,
      tier: args.tier,
      badgeName: args.badgeName,
      badgeAsset: args.badgeAsset,
      treesVerified: args.treesVerified,
      txSignature: args.txSignature,
      slot: args.slot,
      claimedAt: args.timestamp,
    })
  },
})

// ─── Indexer State & Error Recording ─────────────────────────────────────────

export const recordIndexerCheckpoint = mutation({
  args: {
    key: v.string(),
    lastSlot: v.number(),
    lastSignature: v.optional(v.string()),
    processedEventsCount: v.number(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    const existing = await ctx.db
      .query("indexerState")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSlot: args.lastSlot,
        lastSignature: args.lastSignature,
        processedEventsCount: args.processedEventsCount,
        updatedAt: args.timestamp,
      })
      return existing._id
    }

    return await ctx.db.insert("indexerState", {
      key: args.key,
      lastSlot: args.lastSlot,
      lastSignature: args.lastSignature,
      processedEventsCount: args.processedEventsCount,
      updatedAt: args.timestamp,
    })
  },
})

export const recordIndexerError = mutation({
  args: {
    signature: v.string(),
    slot: v.optional(v.number()),
    eventName: v.string(),
    errorMessage: v.string(),
    rawEvent: v.string(),
    timestamp: v.string(),
    syncSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAuthorizedSync(args.syncSecret)

    return await ctx.db.insert("indexerErrors", {
      signature: args.signature,
      slot: args.slot,
      eventName: args.eventName,
      errorMessage: args.errorMessage,
      rawEvent: args.rawEvent,
      resolved: false,
      timestamp: args.timestamp,
    })
  },
})

// ─── Queries for Verification & Reconciliation ───────────────────────────────

export const getTreeByPda = query({
  args: { onChainPda: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trees")
      .withIndex("by_onChainPda", (q) => q.eq("onChainPda", args.onChainPda))
      .first()
  },
})

export const getMilestoneClaimsByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestoneClaims")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .collect()
  },
})

export const getIndexerState = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("indexerState")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first()
  },
})

export const getProtocolConfig = query({
  handler: async (ctx) => {
    return await ctx.db.query("protocolConfigs").first()
  },
})

export const getAllTreesForReconciliation = query({
  handler: async (ctx) => {
    return await ctx.db.query("trees").collect()
  },
})

export const getAllValidatorsForReconciliation = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "nature_hero"))
      .collect()
  },
})

import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export const userRoles = v.union(
  v.literal("user"),
  v.literal("nature_hero_pending"),
  v.literal("nature_hero"),
  v.literal("admin"),
)

export const treeStatuses = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("minted"),
)

export const applicationStatuses = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
)

export const messageStatuses = v.union(
  v.literal("unread"),
  v.literal("read"),
  v.literal("resolved"),
)

export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    name: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    role: userRoles,
    joinedAt: v.string(),
    // Blockchain validator synchronization fields
    validatorPda: v.optional(v.string()),
    isValidatorActive: v.optional(v.boolean()),
    validatorApprovedAt: v.optional(v.string()),
    badgeAsset: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_walletAddress", ["walletAddress"]),

  trees: defineTable({
    walletAddress: v.string(),
    name: v.string(),
    species: v.string(),
    location: v.string(),
    lat: v.number(),
    lng: v.number(),
    imageUrl: v.optional(v.string()),
    status: treeStatuses,
    createdAt: v.string(),
    // On-chain Solana tracking fields
    onChainStatus: v.optional(v.string()),
    treeIdBytesHex: v.optional(v.string()),
    onChainPda: v.optional(v.string()),
    submissionTx: v.optional(v.string()),
    submissionSlot: v.optional(v.number()),
    approvalsCount: v.optional(v.number()),
    rejectionsCount: v.optional(v.number()),
    verifiedAt: v.optional(v.string()),
    nftAssetAddress: v.optional(v.string()),
    mintTx: v.optional(v.string()),
    mintSlot: v.optional(v.number()),
    lastSyncedSlot: v.optional(v.number()),
    lastSyncedAt: v.optional(v.string()),
  })
    .index("by_walletAddress", ["walletAddress"])
    .index("by_status", ["status"])
    .index("by_onChainPda", ["onChainPda"])
    .index("by_treeIdBytesHex", ["treeIdBytesHex"]),

  natureHeroApplications: defineTable({
    userId: v.id("users"),
    walletAddress: v.string(),
    fullName: v.string(),
    email: v.string(),
    cityRegion: v.string(),
    country: v.string(),
    motivation: v.string(),
    experience: v.optional(v.string()),
    status: applicationStatuses,
    reviewedBy: v.optional(v.string()),
    reason: v.optional(v.string()),
    submittedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),

  campaigns: defineTable({
    name: v.string(),
    region: v.string(),
    participantLimit: v.number(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    createdBy: v.string(),
    createdByWallet: v.string(),
    joined: v.number(),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.string(),
    createdAt: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  validations: defineTable({
    treeId: v.id("trees"),
    validatorId: v.id("users"),
    validatorWallet: v.string(),
    approved: v.boolean(),
    decision: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    // On-chain Solana tracking fields
    txSignature: v.optional(v.string()),
    slot: v.optional(v.number()),
    onChainPda: v.optional(v.string()),
  })
    .index("by_treeId", ["treeId"])
    .index("by_validatorId", ["validatorId"])
    .index("by_treeId_validatorId", ["treeId", "validatorId"])
    .index("by_txSignature", ["txSignature"]),

  stats: defineTable({
    key: v.string(),
    value: v.number(),
    updatedAt: v.optional(v.string()),
  }).index("by_key", ["key"]),

  milestoneClaims: defineTable({
    walletAddress: v.string(),
    tier: v.number(), // 0 = First Root, 1 = Grove Builder, 2 = Forest Guardian
    badgeName: v.string(),
    badgeAsset: v.string(),
    treesVerified: v.number(),
    txSignature: v.string(),
    slot: v.number(),
    claimedAt: v.string(),
  })
    .index("by_walletAddress", ["walletAddress"])
    .index("by_badgeAsset", ["badgeAsset"])
    .index("by_wallet_tier", ["walletAddress", "tier"])
    .index("by_txSignature", ["txSignature"]),

  protocolConfigs: defineTable({
    adminAuthority: v.string(),
    feeTreasury: v.string(),
    requiredApprovals: v.number(),
    isPaused: v.boolean(),
    protocolFeeLamports: v.string(),
    treeCollection: v.optional(v.string()),
    badgeCollection: v.optional(v.string()),
    lastSyncedSlot: v.number(),
    updatedAt: v.string(),
  }).index("by_adminAuthority", ["adminAuthority"]),

  indexerState: defineTable({
    key: v.string(),
    lastSlot: v.number(),
    lastSignature: v.optional(v.string()),
    processedEventsCount: v.number(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  indexerErrors: defineTable({
    signature: v.string(),
    slot: v.optional(v.number()),
    eventName: v.string(),
    errorMessage: v.string(),
    rawEvent: v.string(),
    resolved: v.boolean(),
    timestamp: v.string(),
  })
    .index("by_signature", ["signature"])
    .index("by_resolved", ["resolved"]),

  adminActions: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_adminId", ["adminId"]),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    status: messageStatuses,
    createdAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
})

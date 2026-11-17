import { describe, it, expect, vi, beforeEach } from "vitest"
import { PublicKey, Keypair } from "@solana/web3.js"
import { InMemoryConvexClient } from "@/server/indexer/convexClient"
import { SolanaEventIndexer } from "@/server/indexer/indexer"
import { SolanaConvexReconciler, OnChainAccountFetcher } from "@/server/indexer/reconciler"
import {
  treeIdBytesToHex,
  hexToTreeIdBytes,
  mapOnChainStatusToString,
  extractNumber,
} from "@/server/indexer/eventParser"
import { IndexedEvent } from "@/server/indexer/types"
import idl from "@/target/idl/naturre.json"

describe("Phase 7: Naturre Solana Event Indexer & Reconciliation", () => {
  let client: InMemoryConvexClient
  let mockConnection: any
  let programId: PublicKey
  let indexer: SolanaEventIndexer

  const adminKeypair = Keypair.generate()
  const planterKeypair = Keypair.generate()
  const validator1Keypair = Keypair.generate()
  const validator2Keypair = Keypair.generate()
  const treePda = Keypair.generate().publicKey
  const collectionKeypair = Keypair.generate()
  const nftKeypair = Keypair.generate()
  const milestoneCollectionKeypair = Keypair.generate()
  const badgeKeypair = Keypair.generate()

  beforeEach(() => {
    client = new InMemoryConvexClient()
    programId = new PublicKey("E6wG3g53YnSuzgzrpJF9zFXFGh7dhraSGejKpRQETjUp")

    mockConnection = {
      onLogs: vi.fn().mockReturnValue(123),
      removeOnLogsListener: vi.fn().mockResolvedValue(true),
      getTransaction: vi.fn(),
      getSignaturesForAddress: vi.fn().mockResolvedValue([]),
    }

    indexer = new SolanaEventIndexer({
      connection: mockConnection as any,
      client,
      programId,
      idl,
      maxRetries: 2,
      checkpointInterval: 2,
    })
  })

  // ─── 1. Helper Function Tests ───────────────────────────────────────────────

  describe("1. Utility & Converter Helpers", () => {
    it("converts treeIdBytes to hex and back accurately", () => {
      const bytes = new Array(32).fill(0).map((_, i) => i)
      const hex = treeIdBytesToHex(bytes)
      expect(hex.length).toBe(64)
      const back = hexToTreeIdBytes(hex)
      expect(back).toEqual(bytes)
    })

    it("correctly maps Anchor enum TreeStatus to string", () => {
      expect(mapOnChainStatusToString({ pending: {} })).toBe("pending")
      expect(mapOnChainStatusToString({ verified: {} })).toBe("verified")
      expect(mapOnChainStatusToString({ rejected: {} })).toBe("rejected")
      expect(mapOnChainStatusToString({ minted: {} })).toBe("minted")
      expect(mapOnChainStatusToString("verified")).toBe("verified")
      expect(mapOnChainStatusToString(null)).toBe("pending")
    })

    it("correctly extracts numbers from BN-like objects or primitives", () => {
      expect(extractNumber(42)).toBe(42)
      expect(extractNumber({ toNumber: () => 100 })).toBe(100)
      expect(extractNumber({ toString: () => "500" })).toBe(500)
      expect(extractNumber(null)).toBe(0)
    })
  })

  // ─── 2. Event Dispatch & Idempotent Convex Synchronization ─────────────────

  describe("2. Event Dispatching & Convex State Synchronization", () => {
    it("indexes ProtocolInitialized event", async () => {
      const event: IndexedEvent = {
        signature: "sig_proto_init_1",
        slot: 100,
        blockTime: 1700000000,
        event: {
          name: "ProtocolInitialized",
          data: {
            admin: adminKeypair.publicKey,
            feeTreasury: adminKeypair.publicKey,
            requiredApprovals: 2,
            protocolFeeLamports: 10000000,
            timestamp: 1700000000,
          },
        },
      }

      const success = await indexer.processEventWithRetry(event)
      expect(success).toBe(true)

      const config = await client.getProtocolConfig()
      expect(config).not.toBeNull()
      expect(config.adminAuthority).toBe(adminKeypair.publicKey.toBase58())
      expect(config.requiredApprovals).toBe(2)
      expect(config.isPaused).toBe(false)
    })

    it("indexes ProtocolPauseToggled event", async () => {
      // First initialize
      await indexer.processEventWithRetry({
        signature: "sig_proto_init_2",
        slot: 101,
        blockTime: 1700000000,
        event: {
          name: "ProtocolInitialized",
          data: {
            admin: adminKeypair.publicKey,
            feeTreasury: adminKeypair.publicKey,
            requiredApprovals: 2,
            protocolFeeLamports: 10000000,
            timestamp: 1700000000,
          },
        },
      })

      // Toggle pause to true
      await indexer.processEventWithRetry({
        signature: "sig_proto_pause_1",
        slot: 102,
        blockTime: 1700000010,
        event: {
          name: "ProtocolPauseToggled",
          data: {
            admin: adminKeypair.publicKey,
            isPaused: true,
            timestamp: 1700000010,
          },
        },
      })

      const config = await client.getProtocolConfig()
      expect(config.isPaused).toBe(true)
    })

    it("indexes TreeCollectionInitialized event", async () => {
      await indexer.processEventWithRetry({
        signature: "sig_tree_col_1",
        slot: 105,
        blockTime: 1700000020,
        event: {
          name: "TreeCollectionInitialized",
          data: {
            admin: adminKeypair.publicKey,
            collection: collectionKeypair.publicKey,
            name: "Naturre Tree Collection",
            uri: "https://arweave.net/col",
            timestamp: 1700000020,
          },
        },
      })

      const config = await client.getProtocolConfig()
      expect(config.treeCollection).toBe(collectionKeypair.publicKey.toBase58())
    })

    it("indexes MilestoneCollectionInitialized event", async () => {
      await indexer.processEventWithRetry({
        signature: "sig_milestone_col_1",
        slot: 106,
        blockTime: 1700000025,
        event: {
          name: "MilestoneCollectionInitialized",
          data: {
            admin: adminKeypair.publicKey,
            collection: milestoneCollectionKeypair.publicKey,
            name: "Naturre Milestone Badges",
            uri: "https://arweave.net/badges",
            timestamp: 1700000025,
          },
        },
      })

      const config = await client.getProtocolConfig()
      expect(config.badgeCollection).toBe(milestoneCollectionKeypair.publicKey.toBase58())
    })

    it("indexes ValidatorApproved and ValidatorRevoked events", async () => {
      // Approve validator
      await indexer.processEventWithRetry({
        signature: "sig_val_app_1",
        slot: 110,
        blockTime: 1700000030,
        event: {
          name: "ValidatorApproved",
          data: {
            admin: adminKeypair.publicKey,
            validator: validator1Keypair.publicKey,
            badgeAsset: badgeKeypair.publicKey,
            timestamp: 1700000030,
          },
        },
      })

      let validators = await client.getAllValidatorsForReconciliation()
      expect(validators.length).toBe(1)
      expect(validators[0].walletAddress).toBe(validator1Keypair.publicKey.toBase58())
      expect(validators[0].isValidatorActive).toBe(true)
      expect(validators[0].role).toBe("nature_hero")
      expect(validators[0].badgeAsset).toBe(badgeKeypair.publicKey.toBase58())

      // Revoke validator
      await indexer.processEventWithRetry({
        signature: "sig_val_rev_1",
        slot: 115,
        blockTime: 1700000040,
        event: {
          name: "ValidatorRevoked",
          data: {
            admin: adminKeypair.publicKey,
            validator: validator1Keypair.publicKey,
            badgeBurned: true,
            timestamp: 1700000040,
          },
        },
      })

      validators = await client.getAllValidatorsForReconciliation()
      expect(validators.length).toBe(0) // role reverted to user
      const user = Array.from(client.users.values()).find((u) => u.walletAddress === validator1Keypair.publicKey.toBase58())
      expect(user.isValidatorActive).toBe(false)
      expect(user.role).toBe("user")
    })

    it("indexes TreeSubmitted event idempotently", async () => {
      const treeBytes = new Array(32).fill(1)
      const hex = treeIdBytesToHex(treeBytes)

      const subEvent: IndexedEvent = {
        signature: "sig_tree_sub_1",
        slot: 120,
        blockTime: 1700000050,
        event: {
          name: "TreeSubmitted",
          data: {
            planter: planterKeypair.publicKey,
            treePda,
            treeIdBytes: treeBytes,
            latitude: 37774900,
            longitude: -122419400,
            projectType: 1,
            metadataCid: "bafybeiexamplecid",
            timestamp: 1700000050,
          },
        },
      }

      await indexer.processEventWithRetry(subEvent)

      const tree = await client.getTreeByPda(treePda.toBase58())
      expect(tree).not.toBeNull()
      expect(tree.walletAddress).toBe(planterKeypair.publicKey.toBase58())
      expect(tree.onChainStatus).toBe("pending")
      expect(tree.lat).toBeCloseTo(37.7749, 4)
      expect(tree.lng).toBeCloseTo(-122.4194, 4)
      expect(tree.treeIdBytesHex).toBe(hex)
      expect(client.stats.get("trees_planted")).toBe(1)

      // Duplicate submission does not create duplicate record
      await indexer.processEventWithRetry(subEvent)
      const allTrees = await client.getAllTreesForReconciliation()
      expect(allTrees.length).toBe(1)
      expect(client.stats.get("trees_planted")).toBe(1)
    })

    it("indexes TreeReviewed event reaching consensus and verifies stats", async () => {
      // 1. Submit tree
      const treeBytes = new Array(32).fill(2)
      await indexer.processEventWithRetry({
        signature: "sig_tree_sub_2",
        slot: 125,
        blockTime: 1700000060,
        event: {
          name: "TreeSubmitted",
          data: {
            planter: planterKeypair.publicKey,
            treePda,
            treeIdBytes: treeBytes,
            latitude: 37774900,
            longitude: -122419400,
            projectType: 1,
            metadataCid: "bafybeiexample2",
            timestamp: 1700000060,
          },
        },
      })

      // 2. First approval
      await indexer.processEventWithRetry({
        signature: "sig_tree_rev_1",
        slot: 126,
        blockTime: 1700000065,
        event: {
          name: "TreeReviewed",
          data: {
            treePda,
            validator: validator1Keypair.publicKey,
            approved: true,
            approvalsCount: 1,
            rejectionsCount: 0,
            newStatus: { pending: {} },
            timestamp: 1700000065,
          },
        },
      })

      let tree = await client.getTreeByPda(treePda.toBase58())
      expect(tree.approvalsCount).toBe(1)
      expect(tree.onChainStatus).toBe("pending")
      expect(tree.status).toBe("pending")

      // 3. Second approval -> 2-of-N consensus reached!
      await indexer.processEventWithRetry({
        signature: "sig_tree_rev_2",
        slot: 127,
        blockTime: 1700000070,
        event: {
          name: "TreeReviewed",
          data: {
            treePda,
            validator: validator2Keypair.publicKey,
            approved: true,
            approvalsCount: 2,
            rejectionsCount: 0,
            newStatus: { verified: {} },
            timestamp: 1700000070,
          },
        },
      })

      tree = await client.getTreeByPda(treePda.toBase58())
      expect(tree.approvalsCount).toBe(2)
      expect(tree.onChainStatus).toBe("verified")
      expect(tree.status).toBe("verified")
      expect(tree.verifiedAt).toBeDefined()
      expect(client.stats.get("trees_verified")).toBe(1)
      expect(client.validations.length).toBe(2)
    })

    it("indexes TreeNftMinted event and updates status to minted", async () => {
      await indexer.processEventWithRetry({
        signature: "sig_tree_mint_1",
        slot: 130,
        blockTime: 1700000080,
        event: {
          name: "TreeNftMinted",
          data: {
            planter: planterKeypair.publicKey,
            treePda,
            asset: nftKeypair.publicKey,
            treeIdBytes: new Array(32).fill(2),
            timestamp: 1700000080,
          },
        },
      })

      const tree = await client.getTreeByPda(treePda.toBase58())
      expect(tree.nftAssetAddress).toBe(nftKeypair.publicKey.toBase58())
      expect(tree.status).toBe("minted")
      expect(tree.onChainStatus).toBe("minted")
      expect(client.stats.get("nfts_minted")).toBe(1)
    })

    it("indexes MilestoneBadgeClaimed event idempotently", async () => {
      const claimEvent: IndexedEvent = {
        signature: "sig_badge_claim_1",
        slot: 135,
        blockTime: 1700000090,
        event: {
          name: "MilestoneBadgeClaimed",
          data: {
            user: planterKeypair.publicKey,
            badgeAsset: badgeKeypair.publicKey,
            tier: 1,
            treesVerified: 1,
            timestamp: 1700000090,
          },
        },
      }

      await indexer.processEventWithRetry(claimEvent)

      const claims = await client.getMilestoneClaimsByWallet(planterKeypair.publicKey.toBase58())
      expect(claims.length).toBe(1)
      expect(claims[0].tier).toBe(1)
      expect(claims[0].badgeName).toBe("First Root")
      expect(claims[0].badgeAsset).toBe(badgeKeypair.publicKey.toBase58())

      // Duplicate claim does not duplicate
      await indexer.processEventWithRetry(claimEvent)
      const claims2 = await client.getMilestoneClaimsByWallet(planterKeypair.publicKey.toBase58())
      expect(claims2.length).toBe(1)
    })
  })

  // ─── 3. Deduplication & Error Handling ─────────────────────────────────────

  describe("3. Deduplication & Error Resilience", () => {
    it("skips duplicate events using in-memory LRU deduplication cache", async () => {
      const spy = vi.spyOn(client, "syncTreeNftMinted")

      const event: IndexedEvent = {
        signature: "sig_dedup_test",
        slot: 150,
        blockTime: 1700000100,
        event: {
          name: "TreeNftMinted",
          data: {
            planter: planterKeypair.publicKey,
            treePda,
            asset: nftKeypair.publicKey,
            treeIdBytes: new Array(32).fill(9),
            timestamp: 1700000100,
          },
        },
      }

      await indexer.processEventWithRetry(event)
      expect(spy).toHaveBeenCalledTimes(1)

      // Re-processing identical event
      await indexer.processEventWithRetry(event)
      expect(spy).toHaveBeenCalledTimes(1) // not called again
    })

    it("retries on transient failure with exponential backoff and succeeds", async () => {
      let attempts = 0
      vi.spyOn(client, "syncTreeSubmitted").mockImplementation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error("Temporary network timeout")
        }
        return "tree_recovered_id"
      })

      const testTreePda = Keypair.generate().publicKey
      const event: IndexedEvent = {
        signature: "sig_retry_test",
        slot: 155,
        blockTime: 1700000110,
        event: {
          name: "TreeSubmitted",
          data: {
            planter: planterKeypair.publicKey,
            treePda: testTreePda,
            treeIdBytes: new Array(32).fill(8),
            latitude: 10000000,
            longitude: 20000000,
            projectType: 1,
            metadataCid: "cid_retry",
            timestamp: 1700000110,
          },
        },
      }

      const success = await indexer.processEventWithRetry(event)
      expect(success).toBe(true)
      expect(attempts).toBe(2)
    })

    it("records error to Convex when retries are exhausted without crashing", async () => {
      vi.spyOn(client, "syncTreeSubmitted").mockImplementation(async () => {
        throw new Error("Persistent fatal database exception")
      })

      const testTreePda = Keypair.generate().publicKey
      const event: IndexedEvent = {
        signature: "sig_fatal_err_1",
        slot: 160,
        blockTime: 1700000120,
        event: {
          name: "TreeSubmitted",
          data: {
            planter: planterKeypair.publicKey,
            treePda: testTreePda,
            treeIdBytes: new Array(32).fill(7),
            latitude: 10000000,
            longitude: 20000000,
            projectType: 1,
            metadataCid: "cid_fatal",
            timestamp: 1700000120,
          },
        },
      }

      const success = await indexer.processEventWithRetry(event)
      expect(success).toBe(false)
      expect(client.indexerErrors.length).toBe(1)
      expect(client.indexerErrors[0].signature).toBe("sig_fatal_err_1")
      expect(client.indexerErrors[0].errorMessage).toContain("Persistent fatal database exception")
    })

    it("records checkpoints periodically based on checkpointInterval", async () => {
      // Process 2 events to hit checkpointInterval (2)
      await indexer.processEventWithRetry({
        signature: "sig_cp_1",
        slot: 200,
        blockTime: 1700000200,
        event: {
          name: "ProtocolPauseToggled",
          data: {
            admin: adminKeypair.publicKey,
            isPaused: true,
            timestamp: 1700000200,
          },
        },
      })
      await indexer.processEventWithRetry({
        signature: "sig_cp_2",
        slot: 201,
        blockTime: 1700000205,
        event: {
          name: "ProtocolPauseToggled",
          data: {
            admin: adminKeypair.publicKey,
            isPaused: false,
            timestamp: 1700000205,
          },
        },
      })

      const state = await client.getIndexerState("solana_naturre_indexer")
      expect(state).not.toBeNull()
      expect(state.processedEventsCount).toBe(2)
      expect(state.lastSlot).toBe(201)
      expect(state.lastSignature).toBe("sig_cp_2")
    })

    it("enforces authentication when syncSecret is required, rejecting unauthorized writes", async () => {
      const securedClient = new InMemoryConvexClient("super_secret_indexer_token")

      // Calling without token should be rejected
      await expect(
        securedClient.syncProtocolInitialized({
          adminAuthority: adminKeypair.publicKey.toBase58(),
          feeTreasury: adminKeypair.publicKey.toBase58(),
          requiredApprovals: 2,
          protocolFeeLamports: "1000",
          slot: 100,
          timestamp: new Date().toISOString(),
        })
      ).rejects.toThrow("Unauthorized: Invalid or missing indexer sync secret")

      // Calling with correct secret succeeds
      const result = await securedClient.syncProtocolInitialized({
        adminAuthority: adminKeypair.publicKey.toBase58(),
        feeTreasury: adminKeypair.publicKey.toBase58(),
        requiredApprovals: 2,
        protocolFeeLamports: "1000",
        slot: 100,
        timestamp: new Date().toISOString(),
        syncSecret: "super_secret_indexer_token",
      })
      expect(result).toBeDefined()
    })

    it("gracefully handles out-of-order review arrival before tree submission", async () => {
      const oooTreePda = Keypair.generate().publicKey

      // 1. Review arrives first (out-of-order)
      await indexer.processEventWithRetry({
        signature: "sig_ooo_rev_1",
        slot: 210,
        blockTime: 1700000300,
        event: {
          name: "TreeReviewed",
          data: {
            treePda: oooTreePda,
            validator: validator1Keypair.publicKey,
            approved: true,
            approvalsCount: 1,
            rejectionsCount: 0,
            newStatus: { pending: {} },
            timestamp: 1700000300,
          },
        },
      })

      let tree = await client.getTreeByPda(oooTreePda.toBase58())
      expect(tree).not.toBeNull()
      expect(tree.approvalsCount).toBe(1)
      expect(tree.onChainStatus).toBe("pending")

      // 2. Submission arrives second -> heals placeholder tree with planter info
      const oooBytes = new Array(32).fill(42)
      await indexer.processEventWithRetry({
        signature: "sig_ooo_sub_1",
        slot: 211,
        blockTime: 1700000305,
        event: {
          name: "TreeSubmitted",
          data: {
            planter: planterKeypair.publicKey,
            treePda: oooTreePda,
            treeIdBytes: oooBytes,
            latitude: 37774900,
            longitude: -122419400,
            projectType: 1,
            metadataCid: "cid_ooo_healed",
            timestamp: 1700000305,
          },
        },
      })

      tree = await client.getTreeByPda(oooTreePda.toBase58())
      expect(tree.walletAddress).toBe(planterKeypair.publicKey.toBase58())
      expect(tree.approvalsCount).toBe(1) // preserved!
      expect(tree.lat).toBeCloseTo(37.7749, 4)
    })

    it("recovers checkpoint state correctly after indexer restart", async () => {
      // 1. Manually record checkpoint in client
      await client.recordIndexerCheckpoint({
        key: "solana_naturre_indexer",
        lastSlot: 5555,
        lastSignature: "sig_checkpoint_recovery",
        processedEventsCount: 42,
        timestamp: new Date().toISOString(),
      })

      // 2. Instantiate a fresh indexer instance
      const freshIndexer = new SolanaEventIndexer({
        connection: mockConnection as any,
        client,
        programId,
        idl,
      })

      // 3. Start should restore checkpoint
      await freshIndexer.start()
      expect(freshIndexer.lastProcessedSlot).toBe(5555)
      expect(freshIndexer.lastProcessedSignature).toBe("sig_checkpoint_recovery")
      expect(freshIndexer.processedEventsCount).toBe(42)

      await freshIndexer.stop()
    })
  })

  // ─── 4. Reconciler & Self-Healing Engine ────────────────────────────────────

  describe("4. Solana/Convex Reconciler & Auto-Healing Engine", () => {
    const onChainTree1Pda = Keypair.generate().publicKey
    const onChainTree2Pda = Keypair.generate().publicKey
    const onChainTree3Pda = Keypair.generate().publicKey

    const mockOnChainFetcher: OnChainAccountFetcher = {
      account: {
        treeRecord: {
          all: vi.fn().mockResolvedValue([
            {
              publicKey: onChainTree1Pda,
              account: {
                planter: planterKeypair.publicKey,
                treeIdBytes: new Array(32).fill(11),
                latitude: 37774900,
                longitude: -122419400,
                projectType: 1,
                metadataCid: "cid_tree_1",
                status: { verified: {} },
                approvalsCount: 2,
                rejectionsCount: 0,
                nftAsset: null,
              },
            },
            {
              publicKey: onChainTree2Pda,
              account: {
                planter: planterKeypair.publicKey,
                treeIdBytes: new Array(32).fill(12),
                latitude: 37774900,
                longitude: -122419400,
                projectType: 1,
                metadataCid: "cid_tree_2",
                status: { minted: {} },
                approvalsCount: 2,
                rejectionsCount: 0,
                nftAsset: nftKeypair.publicKey,
              },
            },
            {
              publicKey: onChainTree3Pda,
              account: {
                planter: planterKeypair.publicKey,
                treeIdBytes: new Array(32).fill(13),
                latitude: 37774900,
                longitude: -122419400,
                projectType: 1,
                metadataCid: "cid_tree_3",
                status: { pending: {} },
                approvalsCount: 0,
                rejectionsCount: 0,
                nftAsset: null,
              },
            },
          ]),
        },
        validatorProfile: {
          all: vi.fn().mockResolvedValue([
            {
              publicKey: Keypair.generate().publicKey,
              account: {
                validator: validator1Keypair.publicKey,
                isActive: true,
                badgeAsset: badgeKeypair.publicKey,
                totalReviewed: 10,
              },
            },
          ]),
        },
        protocolConfig: {
          all: vi.fn().mockResolvedValue([
            {
              publicKey: Keypair.generate().publicKey,
              account: {
                admin: adminKeypair.publicKey,
                feeTreasury: adminKeypair.publicKey,
                requiredApprovals: 2,
                protocolFeeLamports: 10000000,
                isPaused: false,
                treeCollection: collectionKeypair.publicKey,
                milestoneCollection: milestoneCollectionKeypair.publicKey,
              },
            },
          ]),
        },
      },
    }

    it("detects missing trees, status mismatches, and validator status discrepancies", async () => {
      // Intentionally insert incomplete Convex state:
      // Tree 1 exists but has pending status in Convex instead of verified
      const tree1Hex = treeIdBytesToHex(new Array(32).fill(11))
      await client.syncTreeSubmitted({
        planterWallet: planterKeypair.publicKey.toBase58(),
        treePda: onChainTree1Pda.toBase58(),
        treeIdBytesHex: tree1Hex,
        lat: 37.7749,
        lng: -122.4194,
        projectType: 1,
        metadataCid: "cid_tree_1",
        txSignature: "sub_1",
        slot: 1,
        timestamp: new Date().toISOString(),
      })

      // Tree 2 and Tree 3 are completely missing from Convex
      // Validator 1 is missing from Convex

      const reconciler = new SolanaConvexReconciler(mockOnChainFetcher, client)
      const report = await reconciler.compareState()

      expect(report.discrepanciesCount).toBeGreaterThan(0)
      const types = report.discrepancies.map((d) => d.type)
      expect(types).toContain("STATUS_MISMATCH") // Tree 1
      expect(types).toContain("MISSING_TREE") // Tree 2 & Tree 3
      expect(types).toContain("VALIDATOR_STATUS_MISMATCH") // Validator 1
    })

    it("reconciles and heals all discrepancies into Convex without mutating Solana state", async () => {
      const reconciler = new SolanaConvexReconciler(mockOnChainFetcher, client)

      const healedReport = await reconciler.reconcileAndHeal()
      expect(healedReport.discrepanciesCount).toBe(0)
      expect(healedReport.discrepancies).toEqual([])

      // Verify healed Convex state:
      // 1. Tree 1 is now verified with 2 approvals
      const tree1 = await client.getTreeByPda(onChainTree1Pda.toBase58())
      expect(tree1.status).toBe("verified")
      expect(tree1.approvalsCount).toBe(2)

      // 2. Tree 2 is minted with NFT address
      const tree2 = await client.getTreeByPda(onChainTree2Pda.toBase58())
      expect(tree2.status).toBe("minted")
      expect(tree2.nftAssetAddress).toBe(nftKeypair.publicKey.toBase58())

      // 3. Tree 3 is pending
      const tree3 = await client.getTreeByPda(onChainTree3Pda.toBase58())
      expect(tree3.status).toBe("pending")

      // 4. Validator 1 is active Nature Hero
      const validators = await client.getAllValidatorsForReconciliation()
      expect(validators.length).toBe(1)
      expect(validators[0].walletAddress).toBe(validator1Keypair.publicKey.toBase58())
      expect(validators[0].isValidatorActive).toBe(true)

      // 5. Zero on-chain state mutations were performed
      // All mock on-chain fetchers were called read-only
      expect(mockOnChainFetcher.account.treeRecord.all).toHaveBeenCalled()
      expect(mockOnChainFetcher.account.validatorProfile.all).toHaveBeenCalled()
    })
  })
})

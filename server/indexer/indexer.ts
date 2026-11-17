import { Connection, PublicKey, Commitment, LogsFilter } from "@solana/web3.js"
import { NaturreEventParser, mapOnChainStatusToString, extractNumber, treeIdBytesToHex } from "./eventParser"
import { IConvexSyncClient } from "./convexClient"
import {
  IndexedEvent,
  NaturreEventPayload,
  ProtocolInitializedData,
  ProtocolPauseToggledData,
  ValidatorApprovedData,
  ValidatorRevokedData,
  TreeSubmittedData,
  TreeReviewedData,
  TreeNftMintedData,
  MilestoneBadgeClaimedData,
  MilestoneReachedData,
  TreeCollectionInitializedData,
  MilestoneCollectionInitializedData,
} from "./types"

export interface IndexerOptions {
  connection: Connection
  client: IConvexSyncClient
  programId: PublicKey
  idl?: any
  commitment?: "confirmed" | "finalized"
  maxRetries?: number
  checkpointInterval?: number
  checkpointKey?: string
}

export class SolanaEventIndexer {
  private connection: Connection
  private client: IConvexSyncClient
  private programId: PublicKey
  private parser: NaturreEventParser
  private commitment: "confirmed" | "finalized"
  private maxRetries: number
  private checkpointInterval: number
  private checkpointKey: string

  private isRunning: boolean = false
  private subscriptionId: number | null = null
  private processedDeduplicationKeys: Set<string> = new Set()
  private processedKeyQueue: string[] = []
  private maxDeduplicationCacheSize: number = 10000

  public processedEventsCount: number = 0
  public lastProcessedSlot: number = 0
  public lastProcessedSignature: string | null = null

  constructor(options: IndexerOptions) {
    this.connection = options.connection
    this.client = options.client
    this.programId = options.programId
    this.parser = new NaturreEventParser(options.programId, options.idl)
    this.commitment = options.commitment || "confirmed"
    this.maxRetries = options.maxRetries ?? 3
    this.checkpointInterval = options.checkpointInterval ?? 5
    this.checkpointKey = options.checkpointKey || "solana_naturre_indexer"
  }

  /**
   * Start the indexer: loads state checkpoint and subscribes to program log emissions.
   */
  async start(): Promise<void> {
    if (this.isRunning) return

    // 1. Restore previous checkpoint if available
    try {
      const state = await this.client.getIndexerState(this.checkpointKey)
      if (state) {
        this.lastProcessedSlot = state.lastSlot || 0
        this.lastProcessedSignature = state.lastSignature || null
        this.processedEventsCount = state.processedEventsCount || 0
      }
    } catch (err) {
      console.warn(`[SolanaEventIndexer] Failed to load checkpoint state:`, err)
    }

    this.isRunning = true

    // 2. Subscribe to program log notifications via WebSocket
    try {
      const filter: LogsFilter = this.programId
      this.subscriptionId = this.connection.onLogs(
        filter,
        async (logsInfo, ctx) => {
          if (!this.isRunning) return
          if (logsInfo.err) return

          await this.processTransactionLogs(
            logsInfo.signature,
            ctx.slot,
            logsInfo.logs,
            Date.now() / 1000
          )
        },
        this.commitment
      )
    } catch (err) {
      console.warn(`[SolanaEventIndexer] WebSocket log subscription unavailable, will rely on polling/manual:`, err)
    }
  }

  /**
   * Stop the indexer and flush final checkpoint.
   */
  async stop(): Promise<void> {
    this.isRunning = false

    if (this.subscriptionId !== null) {
      try {
        await this.connection.removeOnLogsListener(this.subscriptionId)
      } catch (e) {
        // ignore on cleanup
      }
      this.subscriptionId = null
    }

    await this.flushCheckpoint()
  }

  /**
   * Process an array of logs from a transaction.
   */
  async processTransactionLogs(
    signature: string,
    slot: number,
    logs: string[],
    blockTime?: number
  ): Promise<IndexedEvent[]> {
    const events = this.parser.parseLogs(logs, signature, slot, blockTime)
    for (const indexedEvent of events) {
      await this.processEventWithRetry(indexedEvent)
    }
    return events
  }

  /**
   * Fetches and processes an individual transaction by signature.
   */
  async processSignature(signature: string): Promise<IndexedEvent[]> {
    const tx = await this.connection.getTransaction(signature, {
      commitment: this.commitment,
      maxSupportedTransactionVersion: 0,
    })

    if (!tx || !tx.meta || tx.meta.err || !tx.meta.logMessages) {
      return []
    }

    return await this.processTransactionLogs(
      signature,
      tx.slot,
      tx.meta.logMessages,
      tx.blockTime ?? Date.now() / 1000
    )
  }

  /**
   * Backfill recent signatures for the program address with pagination and checkpoint awareness.
   */
  async backfill(options?: { limit?: number; until?: string; before?: string }): Promise<number> {
    const limit = options?.limit ?? 50
    const until = options?.until || this.lastProcessedSignature || undefined
    const before = options?.before

    const sigInfos = await this.connection.getSignaturesForAddress(this.programId, {
      limit,
      until,
      before,
    })

    let processed = 0
    // Process in chronological order (oldest first)
    const reversed = [...sigInfos].reverse()
    for (const info of reversed) {
      if (info.err) continue
      const events = await this.processSignature(info.signature)
      processed += events.length
    }
    return processed
  }

  /**
   * Process a single event with deduplication, retries, and checkpointing.
   */
  async processEventWithRetry(indexedEvent: IndexedEvent): Promise<boolean> {
    const dedupKey = this.buildDedupKey(indexedEvent)

    if (this.processedDeduplicationKeys.has(dedupKey)) {
      return true // already processed, idempotent skip
    }

    let attempt = 0
    let lastError: any = null

    while (attempt <= this.maxRetries) {
      try {
        await this.dispatchEvent(indexedEvent)

        // Mark as processed
        this.markDedupKey(dedupKey)
        this.processedEventsCount++
        this.lastProcessedSlot = Math.max(this.lastProcessedSlot, indexedEvent.slot)
        this.lastProcessedSignature = indexedEvent.signature

        if (this.processedEventsCount % this.checkpointInterval === 0) {
          await this.flushCheckpoint()
        }

        return true
      } catch (err: any) {
        attempt++
        lastError = err
        if (attempt <= this.maxRetries) {
          const backoffMs = Math.min(100 * Math.pow(2, attempt), 2000)
          await new Promise((r) => setTimeout(r, backoffMs))
        }
      }
    }

    // Retries exhausted: record error to Convex without crashing indexer
    try {
      await this.client.recordIndexerError({
        signature: indexedEvent.signature,
        slot: indexedEvent.slot,
        eventName: indexedEvent.event.name,
        errorMessage: lastError?.message || String(lastError),
        rawEvent: JSON.stringify(indexedEvent.event.data),
        timestamp: new Date().toISOString(),
      })
    } catch (recordErr) {
      console.error(`[SolanaEventIndexer] Critical: Failed to record indexer error:`, recordErr)
    }

    return false
  }

  /**
   * Dispatch parsed event to corresponding Convex synchronization mutation.
   */
  private async dispatchEvent(indexedEvent: IndexedEvent): Promise<void> {
    const { signature, slot, blockTime, event } = indexedEvent
    const timestamp = new Date(blockTime * 1000).toISOString()

    switch (event.name) {
      case "ProtocolInitialized": {
        const d = event.data as ProtocolInitializedData
        await this.client.syncProtocolInitialized({
          adminAuthority: d.admin.toBase58(),
          feeTreasury: d.feeTreasury.toBase58(),
          requiredApprovals: d.requiredApprovals,
          protocolFeeLamports: extractNumber(d.protocolFeeLamports).toString(),
          slot,
          timestamp,
        })
        break
      }

      case "ProtocolPauseToggled": {
        const d = event.data as ProtocolPauseToggledData
        await this.client.syncProtocolPauseToggled({
          adminAuthority: d.admin.toBase58(),
          isPaused: d.isPaused,
          slot,
          timestamp,
        })
        break
      }

      case "TreeCollectionInitialized": {
        const d = event.data as TreeCollectionInitializedData
        await this.client.syncTreeCollectionInitialized({
          collectionAddress: d.collection.toBase58(),
          slot,
          timestamp,
        })
        break
      }

      case "MilestoneCollectionInitialized": {
        const d = event.data as MilestoneCollectionInitializedData
        await this.client.syncMilestoneCollectionInitialized({
          collectionAddress: d.collection.toBase58(),
          slot,
          timestamp,
        })
        break
      }

      case "ValidatorApproved": {
        const d = event.data as ValidatorApprovedData
        await this.client.syncValidatorApproved({
          validatorWallet: d.validator.toBase58(),
          badgeAsset: d.badgeAsset ? d.badgeAsset.toBase58() : undefined,
          slot,
          timestamp,
        })
        break
      }

      case "ValidatorRevoked": {
        const d = event.data as ValidatorRevokedData
        await this.client.syncValidatorRevoked({
          validatorWallet: d.validator.toBase58(),
          badgeBurned: d.badgeBurned,
          slot,
          timestamp,
        })
        break
      }

      case "TreeSubmitted": {
        const d = event.data as TreeSubmittedData
        const lat = extractNumber(d.latitude) / 1e6
        const lng = extractNumber(d.longitude) / 1e6
        const treeIdBytesHex = treeIdBytesToHex(d.treeIdBytes)

        await this.client.syncTreeSubmitted({
          planterWallet: d.planter.toBase58(),
          treePda: d.treePda.toBase58(),
          treeIdBytesHex,
          lat,
          lng,
          projectType: d.projectType,
          metadataCid: d.metadataCid,
          txSignature: signature,
          slot,
          timestamp,
        })
        break
      }

      case "TreeReviewed": {
        const d = event.data as TreeReviewedData
        const onChainStatus = mapOnChainStatusToString(d.newStatus)

        await this.client.syncTreeReviewed({
          treePda: d.treePda.toBase58(),
          validatorWallet: d.validator.toBase58(),
          approved: d.approved,
          approvalsCount: d.approvalsCount,
          rejectionsCount: d.rejectionsCount,
          onChainStatus,
          txSignature: signature,
          slot,
          timestamp,
        })
        break
      }

      case "TreeNftMinted": {
        const d = event.data as TreeNftMintedData
        await this.client.syncTreeNftMinted({
          treePda: d.treePda.toBase58(),
          nftAssetAddress: d.asset.toBase58(),
          planterWallet: d.planter.toBase58(),
          txSignature: signature,
          slot,
          timestamp,
        })
        break
      }

      case "MilestoneBadgeClaimed": {
        const d = event.data as MilestoneBadgeClaimedData
        const badgeName = this.getBadgeNameForTier(d.tier)

        await this.client.syncMilestoneBadgeClaimed({
          walletAddress: d.user.toBase58(),
          badgeAsset: d.badgeAsset.toBase58(),
          tier: d.tier,
          treesVerified: d.treesVerified,
          badgeName,
          txSignature: signature,
          slot,
          timestamp,
        })
        break
      }

      case "MilestoneReached": {
        // Informational on-chain event, logged or used for real-time notifications
        break
      }

      default:
        console.warn(`[SolanaEventIndexer] Unhandled event name: ${(event as any).name}`)
    }
  }

  private getBadgeNameForTier(tier: number): string {
    switch (tier) {
      case 1:
        return "First Root"
      case 2:
        return "Grove Builder"
      case 3:
        return "Forest Guardian"
      default:
        return `Milestone Tier ${tier}`
    }
  }

  private buildDedupKey(indexedEvent: IndexedEvent): string {
    const { signature, event } = indexedEvent
    let suffix = ""

    if (event.name === "TreeSubmitted") {
      suffix = (event.data as TreeSubmittedData).treePda.toBase58()
    } else if (event.name === "TreeReviewed") {
      suffix = `${(event.data as TreeReviewedData).treePda.toBase58()}_${(event.data as TreeReviewedData).validator.toBase58()}`
    } else if (event.name === "TreeNftMinted") {
      suffix = (event.data as TreeNftMintedData).asset.toBase58()
    } else if (event.name === "MilestoneBadgeClaimed") {
      suffix = (event.data as MilestoneBadgeClaimedData).badgeAsset.toBase58()
    } else if (event.name === "ValidatorApproved") {
      suffix = (event.data as ValidatorApprovedData).validator.toBase58()
    } else if (event.name === "ValidatorRevoked") {
      suffix = (event.data as ValidatorRevokedData).validator.toBase58()
    }

    return `${signature}:${event.name}:${suffix}`
  }

  private markDedupKey(key: string): void {
    this.processedDeduplicationKeys.add(key)
    this.processedKeyQueue.push(key)

    // Bound memory size using FIFO queue
    if (this.processedKeyQueue.length > this.maxDeduplicationCacheSize) {
      const oldest = this.processedKeyQueue.shift()
      if (oldest) this.processedDeduplicationKeys.delete(oldest)
    }
  }

  private async flushCheckpoint(): Promise<void> {
    try {
      await this.client.recordIndexerCheckpoint({
        key: this.checkpointKey,
        lastSlot: this.lastProcessedSlot,
        lastSignature: this.lastProcessedSignature || undefined,
        processedEventsCount: this.processedEventsCount,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.warn(`[SolanaEventIndexer] Failed to flush checkpoint:`, err)
    }
  }
}

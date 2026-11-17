import { Connection, PublicKey } from "@solana/web3.js"
import { HttpConvexClient } from "./convexClient"
import { SolanaEventIndexer } from "./indexer"
import { SolanaConvexReconciler } from "./reconciler"
import { Program, AnchorProvider } from "@coral-xyz/anchor"
import idl from "../../target/idl/naturre.json"

export interface ServiceConfig {
  rpcUrl: string
  programId: string
  convexUrl: string
  syncSecret?: string
  commitment?: "confirmed" | "finalized"
  pollIntervalMs?: number
  reconcileIntervalMs?: number
  enableReconciler?: boolean
}

export function loadConfigFromEnv(): ServiceConfig {
  const rpcUrl = process.env.SOLANA_RPC_URL || "http://127.0.0.1:8899"
  const programId = process.env.SOLANA_PROGRAM_ID || "E6wG3g53YnSuzgzrpJF9zFXFGh7dhraSGejKpRQETjUp"
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL

  if (!convexUrl) {
    throw new Error(
      "[Naturre Indexer Service] Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable."
    )
  }

  return {
    rpcUrl,
    programId,
    convexUrl,
    syncSecret: process.env.INDEXER_SYNC_SECRET,
    commitment: (process.env.INDEXER_COMMITMENT as any) || "confirmed",
    pollIntervalMs: Number(process.env.INDEXER_POLL_INTERVAL_MS || 10000),
    reconcileIntervalMs: Number(process.env.INDEXER_RECONCILE_INTERVAL_MS || 300000),
    enableReconciler: process.env.ENABLE_RECONCILER !== "false",
  }
}

export async function runIndexerService(config?: ServiceConfig) {
  const cfg = config || loadConfigFromEnv()
  console.log("==================================================")
  console.log("🌱 Naturre Blockchain Event Indexer & Reconciler")
  console.log("==================================================")
  console.log(`RPC Endpoint:        ${cfg.rpcUrl}`)
  console.log(`Program ID:          ${cfg.programId}`)
  console.log(`Convex URL:          ${cfg.convexUrl}`)
  console.log(`Commitment:          ${cfg.commitment}`)
  console.log(`Sync Secret Enabled: ${cfg.syncSecret ? "Yes" : "No (Open)"}`)
  console.log(`Reconciler Enabled:  ${cfg.enableReconciler ? "Yes" : "No"}`)
  console.log("==================================================")

  const connection = new Connection(cfg.rpcUrl, cfg.commitment)
  const programPubkey = new PublicKey(cfg.programId)
  const convexClient = new HttpConvexClient(cfg.convexUrl, cfg.syncSecret)

  const indexer = new SolanaEventIndexer({
    connection,
    client: convexClient,
    programId: programPubkey,
    idl,
    commitment: cfg.commitment,
  })

  // 1. Start the event indexer (restores checkpoint & subscribes to live logs)
  await indexer.start()
  console.log("[Naturre Indexer] Listening to on-chain program logs via WebSocket...")

  // 2. Run initial backfill to catch up on any historical events while offline
  console.log("[Naturre Indexer] Running historical backfill...")
  try {
    const backfilled = await indexer.backfill({ limit: 50 })
    console.log(`[Naturre Indexer] Backfill complete. Indexed ${backfilled} historical events.`)
  } catch (err) {
    console.warn(`[Naturre Indexer] Initial backfill encountered warning:`, err)
  }

  // 3. Periodic Reconciler (optional background health check & auto-healing)
  let reconcilerTimer: NodeJS.Timeout | null = null
  if (cfg.enableReconciler) {
    // Setup read-only Anchor program account fetcher
    const dummyWallet: any = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    }
    const provider = new AnchorProvider(connection, dummyWallet, { commitment: cfg.commitment })
    const program = new Program(idl as any, provider)
    const reconciler = new SolanaConvexReconciler(program as any, convexClient)

    const runReconciliation = async () => {
      try {
        console.log("[Naturre Reconciler] Starting scheduled state audit...")
        const report = await reconciler.reconcileAndHeal()
        if (report.discrepanciesCount === 0) {
          console.log(`[Naturre Reconciler] State audit clean: 0 discrepancies across ${report.totalTreesChecked} trees and ${report.totalValidatorsChecked} validators.`)
        } else {
          console.log(`[Naturre Reconciler] Detected and healed ${report.discrepanciesCount} discrepancies into Convex.`)
        }
      } catch (err) {
        console.error(`[Naturre Reconciler] Audit encountered error:`, err)
      }
    }

    // Run first audit after 10 seconds, then periodically
    setTimeout(runReconciliation, 10000)
    reconcilerTimer = setInterval(runReconciliation, cfg.reconcileIntervalMs)
  }

  // 4. Graceful Shutdown
  const shutdown = async () => {
    console.log("\n[Naturre Indexer] Shutting down service...")
    if (reconcilerTimer) clearInterval(reconcilerTimer)
    await indexer.stop()
    console.log("[Naturre Indexer] Service stopped cleanly. Checkpoint saved.")
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  return { indexer, connection, convexClient }
}

// Direct execution guard
if (require.main === module) {
  runIndexerService().catch((err) => {
    console.error("[Naturre Indexer Service] Fatal startup error:", err)
    process.exit(1)
  })
}

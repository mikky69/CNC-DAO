import { PublicKey } from "@solana/web3.js"
import { IConvexSyncClient } from "./convexClient"
import {
  ReconciliationDiscrepancy,
  ReconciliationReport,
  DiscrepancyType,
} from "./types"
import { mapOnChainStatusToString, treeIdBytesToHex, extractNumber } from "./eventParser"

export interface OnChainAccountFetcher {
  account: {
    treeRecord: {
      all(): Promise<Array<{ publicKey: PublicKey; account: any }>>
    }
    validatorProfile: {
      all(): Promise<Array<{ publicKey: PublicKey; account: any }>>
    }
    protocolConfig: {
      all(): Promise<Array<{ publicKey: PublicKey; account: any }>>
    }
  }
}

export class SolanaConvexReconciler {
  private program: OnChainAccountFetcher
  private client: IConvexSyncClient

  constructor(program: OnChainAccountFetcher, client: IConvexSyncClient) {
    this.program = program
    this.client = client
  }

  /**
   * Compare on-chain ground truth with Convex backend state.
   * Returns a detailed ReconciliationReport without modifying either database.
   */
  async compareState(): Promise<ReconciliationReport> {
    const discrepancies: ReconciliationDiscrepancy[] = []

    // 1. Fetch on-chain accounts
    const onChainTrees = await this.program.account.treeRecord.all()
    const onChainValidators = await this.program.account.validatorProfile.all()
    const onChainConfigs = await this.program.account.protocolConfig.all()

    // 2. Fetch Convex state
    const convexTrees = await this.client.getAllTreesForReconciliation()
    const convexValidators = await this.client.getAllValidatorsForReconciliation()
    const convexConfig = await this.client.getProtocolConfig()

    // Build lookup maps for Convex records
    const convexTreesByPda = new Map<string, any>()
    const convexTreesByHex = new Map<string, any>()
    for (const tree of convexTrees) {
      if (tree.onChainPda) convexTreesByPda.set(tree.onChainPda, tree)
      if (tree.treeIdBytesHex) convexTreesByHex.set(tree.treeIdBytesHex, tree)
    }

    const convexValidatorsByWallet = new Map<string, any>()
    for (const val of convexValidators) {
      if (val.walletAddress) convexValidatorsByWallet.set(val.walletAddress, val)
    }

    // ─── 3. Reconcile Trees ──────────────────────────────────────────────────
    for (const item of onChainTrees) {
      const pdaStr = item.publicKey.toBase58()
      const treeAcc = item.account
      const hex = treeIdBytesToHex(treeAcc.treeIdBytes)
      const onChainStatus = mapOnChainStatusToString(treeAcc.status)
      const onChainApprovals = extractNumber(treeAcc.approvalsCount)
      const onChainRejections = extractNumber(treeAcc.rejectionsCount)
      const onChainNft = treeAcc.nftAsset ? treeAcc.nftAsset.toBase58() : null

      const matchingConvexTree = convexTreesByPda.get(pdaStr) || convexTreesByHex.get(hex)

      if (!matchingConvexTree) {
        discrepancies.push({
          type: "MISSING_TREE",
          identifier: pdaStr,
          onChainValue: {
            planter: treeAcc.planter.toBase58(),
            treeIdBytesHex: hex,
            status: onChainStatus,
            approvals: onChainApprovals,
            nftAsset: onChainNft,
          },
          convexValue: null,
          description: `On-chain tree ${pdaStr} (ID: ${hex.slice(0, 8)}) is completely missing from Convex database`,
        })
        continue
      }

      // Check status alignment
      const convexStatus = matchingConvexTree.onChainStatus || matchingConvexTree.status
      if (convexStatus !== onChainStatus) {
        discrepancies.push({
          type: "STATUS_MISMATCH",
          identifier: pdaStr,
          onChainValue: onChainStatus,
          convexValue: convexStatus,
          description: `Tree ${pdaStr} status mismatch: on-chain is '${onChainStatus}', Convex is '${convexStatus}'`,
        })
      }

      // Check approvals count alignment
      const convexApprovals = matchingConvexTree.approvalsCount ?? 0
      if (convexApprovals !== onChainApprovals) {
        discrepancies.push({
          type: "APPROVALS_MISMATCH",
          identifier: pdaStr,
          onChainValue: onChainApprovals,
          convexValue: convexApprovals,
          description: `Tree ${pdaStr} approvals mismatch: on-chain has ${onChainApprovals}, Convex has ${convexApprovals}`,
        })
      }

      // Check NFT address alignment
      if (onChainNft && (!matchingConvexTree.nftAssetAddress || matchingConvexTree.nftAssetAddress !== onChainNft)) {
        discrepancies.push({
          type: "MISSING_NFT",
          identifier: pdaStr,
          onChainValue: onChainNft,
          convexValue: matchingConvexTree.nftAssetAddress || null,
          description: `Tree ${pdaStr} NFT mismatch: on-chain NFT is ${onChainNft}, Convex has ${matchingConvexTree.nftAssetAddress || "none"}`,
        })
      }
    }

    // ─── 4. Reconcile Validators ─────────────────────────────────────────────
    for (const item of onChainValidators) {
      const valAcc = item.account
      const valWallet = valAcc.validator.toBase58()
      const isActive = valAcc.isActive
      const badgeAsset = valAcc.badgeAsset ? valAcc.badgeAsset.toBase58() : undefined

      const convexVal = convexValidatorsByWallet.get(valWallet)

      if (!convexVal && isActive) {
        discrepancies.push({
          type: "VALIDATOR_STATUS_MISMATCH",
          identifier: valWallet,
          onChainValue: { isActive, badgeAsset },
          convexValue: null,
          description: `Active on-chain Nature Hero validator ${valWallet} is not registered as active in Convex`,
        })
      } else if (convexVal && convexVal.isValidatorActive !== isActive) {
        discrepancies.push({
          type: "VALIDATOR_STATUS_MISMATCH",
          identifier: valWallet,
          onChainValue: { isActive },
          convexValue: { isValidatorActive: convexVal.isValidatorActive },
          description: `Validator ${valWallet} active status mismatch: on-chain is ${isActive}, Convex is ${convexVal.isValidatorActive}`,
        })
      }
    }

    // ─── 5. Reconcile Protocol Config ────────────────────────────────────────
    if (onChainConfigs.length > 0) {
      const onChainCfg = onChainConfigs[0].account
      if (convexConfig) {
        if (convexConfig.isPaused !== onChainCfg.isPaused) {
          discrepancies.push({
            type: "CONFIG_MISMATCH",
            identifier: "isPaused",
            onChainValue: onChainCfg.isPaused,
            convexValue: convexConfig.isPaused,
            description: `ProtocolConfig paused state mismatch: on-chain is ${onChainCfg.isPaused}, Convex is ${convexConfig.isPaused}`,
          })
        }
      } else {
        discrepancies.push({
          type: "CONFIG_MISMATCH",
          identifier: "protocolConfigs",
          onChainValue: { admin: onChainCfg.admin.toBase58(), isPaused: onChainCfg.isPaused },
          convexValue: null,
          description: `ProtocolConfig is present on-chain but absent from Convex`,
        })
      }
    }

    return {
      checkedAt: new Date().toISOString(),
      totalTreesChecked: onChainTrees.length,
      totalValidatorsChecked: onChainValidators.length,
      totalMilestonesChecked: 0,
      discrepanciesCount: discrepancies.length,
      discrepancies,
    }
  }

  /**
   * Reconcile and heal all discrepancies by synchronizing the on-chain ground truth into Convex.
   * NEVER mutates on-chain Solana state.
   */
  async reconcileAndHeal(): Promise<ReconciliationReport> {
    const report = await this.compareState()

    if (report.discrepanciesCount === 0) {
      return report
    }

    const timestamp = new Date().toISOString()
    const syntheticSlot = 1 // reconciliation marker slot

    // Fetch on-chain raw accounts to heal from
    const onChainTrees = await this.program.account.treeRecord.all()
    const onChainValidators = await this.program.account.validatorProfile.all()
    const onChainConfigs = await this.program.account.protocolConfig.all()

    const onChainTreesMap = new Map<string, any>()
    for (const item of onChainTrees) {
      onChainTreesMap.set(item.publicKey.toBase58(), item.account)
    }

    const onChainValidatorsMap = new Map<string, any>()
    for (const item of onChainValidators) {
      onChainValidatorsMap.set(item.account.validator.toBase58(), item.account)
    }

    // Heal discrepancies
    for (const discrepancy of report.discrepancies) {
      switch (discrepancy.type) {
        case "MISSING_TREE": {
          const treeAcc = onChainTreesMap.get(discrepancy.identifier)
          if (!treeAcc) continue

          const hex = treeIdBytesToHex(treeAcc.treeIdBytes)
          const lat = extractNumber(treeAcc.latitude) / 1e6
          const lng = extractNumber(treeAcc.longitude) / 1e6
          const onChainStatus = mapOnChainStatusToString(treeAcc.status)

          // 1. Sync submission
          await this.client.syncTreeSubmitted({
            planterWallet: treeAcc.planter.toBase58(),
            treePda: discrepancy.identifier,
            treeIdBytesHex: hex,
            lat,
            lng,
            projectType: treeAcc.projectType,
            metadataCid: treeAcc.metadataCid,
            txSignature: `reconcile_sub_${discrepancy.identifier.slice(0, 8)}`,
            slot: syntheticSlot,
            timestamp,
          })

          // 2. If reviewed/verified, sync review
          if (onChainStatus === "verified" || onChainStatus === "minted" || onChainStatus === "rejected") {
            await this.client.syncTreeReviewed({
              treePda: discrepancy.identifier,
              validatorWallet: "reconciliation_sync",
              approved: onChainStatus !== "rejected",
              approvalsCount: extractNumber(treeAcc.approvalsCount),
              rejectionsCount: extractNumber(treeAcc.rejectionsCount),
              onChainStatus,
              txSignature: `reconcile_rev_${discrepancy.identifier.slice(0, 8)}`,
              slot: syntheticSlot,
              timestamp,
            })
          }

          // 3. If minted, sync NFT
          if (onChainStatus === "minted" && treeAcc.nftAsset) {
            await this.client.syncTreeNftMinted({
              treePda: discrepancy.identifier,
              nftAssetAddress: treeAcc.nftAsset.toBase58(),
              planterWallet: treeAcc.planter.toBase58(),
              txSignature: `reconcile_mint_${discrepancy.identifier.slice(0, 8)}`,
              slot: syntheticSlot,
              timestamp,
            })
          }
          break
        }

        case "STATUS_MISMATCH":
        case "APPROVALS_MISMATCH": {
          const treeAcc = onChainTreesMap.get(discrepancy.identifier)
          if (!treeAcc) continue
          const onChainStatus = mapOnChainStatusToString(treeAcc.status)

          await this.client.syncTreeReviewed({
            treePda: discrepancy.identifier,
            validatorWallet: "reconciliation_sync",
            approved: onChainStatus !== "rejected",
            approvalsCount: extractNumber(treeAcc.approvalsCount),
            rejectionsCount: extractNumber(treeAcc.rejectionsCount),
            onChainStatus,
            txSignature: `reconcile_status_${discrepancy.identifier.slice(0, 8)}`,
            slot: syntheticSlot,
            timestamp,
          })
          break
        }

        case "MISSING_NFT": {
          const treeAcc = onChainTreesMap.get(discrepancy.identifier)
          if (!treeAcc || !treeAcc.nftAsset) continue

          await this.client.syncTreeNftMinted({
            treePda: discrepancy.identifier,
            nftAssetAddress: treeAcc.nftAsset.toBase58(),
            planterWallet: treeAcc.planter.toBase58(),
            txSignature: `reconcile_nft_${discrepancy.identifier.slice(0, 8)}`,
            slot: syntheticSlot,
            timestamp,
          })
          break
        }

        case "VALIDATOR_STATUS_MISMATCH": {
          const valAcc = onChainValidatorsMap.get(discrepancy.identifier)
          if (!valAcc) continue

          if (valAcc.isActive) {
            await this.client.syncValidatorApproved({
              validatorWallet: discrepancy.identifier,
              badgeAsset: valAcc.badgeAsset ? valAcc.badgeAsset.toBase58() : undefined,
              slot: syntheticSlot,
              timestamp,
            })
          } else {
            await this.client.syncValidatorRevoked({
              validatorWallet: discrepancy.identifier,
              badgeBurned: false,
              slot: syntheticSlot,
              timestamp,
            })
          }
          break
        }

        case "CONFIG_MISMATCH": {
          if (onChainConfigs.length > 0) {
            const cfg = onChainConfigs[0].account
            await this.client.syncProtocolInitialized({
              adminAuthority: cfg.admin.toBase58(),
              feeTreasury: cfg.feeTreasury.toBase58(),
              requiredApprovals: cfg.requiredApprovals,
              protocolFeeLamports: extractNumber(cfg.protocolFeeLamports).toString(),
              slot: syntheticSlot,
              timestamp,
            })
            await this.client.syncProtocolPauseToggled({
              adminAuthority: cfg.admin.toBase58(),
              isPaused: cfg.isPaused,
              slot: syntheticSlot,
              timestamp,
            })
            if (cfg.treeCollection) {
              await this.client.syncTreeCollectionInitialized({
                collectionAddress: cfg.treeCollection.toBase58(),
                slot: syntheticSlot,
                timestamp,
              })
            }
            if (cfg.milestoneCollection) {
              await this.client.syncMilestoneCollectionInitialized({
                collectionAddress: cfg.milestoneCollection.toBase58(),
                slot: syntheticSlot,
                timestamp,
              })
            }
          }
          break
        }
      }
    }

    // Verify all discrepancies resolved by comparing again
    return await this.compareState()
  }
}

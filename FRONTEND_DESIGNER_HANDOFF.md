# Naturre Protocol — Frontend Developer & UI/UX Designer Handoff Specification

**Document Version:** 1.0.0  
**Target Program ID:** `E6wG3g53YnSuzgzrpJF9zFXFGh7dhraSGejKpRQETjUp`  
**Framework:** Anchor 0.30.1 & Metaplex Core (`mpl-core` 0.7.0 / `@metaplex-foundation/mpl-core` 1.10.0)  
**Authoritative Technical Specification:** [`docs/smartcontract.md`](file:///home/japhet/Desktop/CNC-DAO/docs/smartcontract.md)  
**Target Repository Branch:** `feature/naturre-smart-contract`

---

## Document Purpose

This document serves two vital operational purposes:
1. **Practical Handoff for Human Engineers & Designers:** Details every Metaplex Core NFT asset specification, expected image dimensions, metadata schema, frontend page/component integration target, and Mainnet blocker.
2. **Complete Context & Prompt Injection for AI Coding Agents:** Provides any incoming AI coding agent (e.g., Antigravity, Claude, Cursor) with full project context, architectural guarantees, boundaries, and explicit guardrails so it can immediately continue Phase 8 frontend integration without asking repetitive questions or making incorrect architectural assumptions.

---

## 1. AI Agent Project Context & Onboarding Guide

> [!IMPORTANT]
> **MANDATORY INSTRUCTIONS FOR THE NEXT AI CODING AGENT:**
> 1. **Read this document (`FRONTEND_DESIGNER_HANDOFF.md`) first.** It specifies the exact state of the project, what has been completed, what is pending, and where files are located.
> 2. **Consult [`docs/smartcontract.md`](file:///home/japhet/Desktop/CNC-DAO/docs/smartcontract.md) as the authoritative master specification.** Never contradict, alter, or replace the PRD rules or architectural specifications established in that document.
> 3. **Audit the existing codebase before touching any file.** All Anchor smart contract instructions, account state structs, Metaplex Core CPI invocations, Convex schemas, Convex synchronization mutations, and autonomous event indexers are 100% complete, passing 51 Anchor tests and 62 integration tests.
> 4. **Do NOT rebuild or refactor completed backend or on-chain code.** Your work in Phase 8 is strictly frontend integration.
> 5. **Reuse existing frontend pages and UI components.** Do not redesign pages, invent new design languages, or build extraneous components. Connect the existing UI to the Solana smart contract and Convex backend.
> 6. **Do NOT change agreed business rules, PDA seeds, or milestone criteria.**
> 7. **Do NOT deploy to Devnet or Mainnet without explicit authorization from the user.**
> 8. **Report genuine missing assets or requirements honestly.** Never generate placeholder artwork or claim that missing designer assets exist.

### 1.1 Naturre Purpose & Product Architecture
Naturre (CNC DAO) is a regenerative finance (ReFi) decentralized protocol connecting real-world community tree planting with verifiable on-chain proofs and Metaplex Core digital assets on Solana.
- **Planters:** Submit real-world planting records (species, GPS coordinates, IPFS photo CID).
- **Nature Heroes:** Accredited independent ecological validators who review pending submissions. Verification requires **2-of-N independent consensus** (2 approvals = Verified; 2 rejections = Rejected).
- **Proof-of-Stewardship Tree NFTs:** Each verified tree entitles the original planter to mint exactly one freely transferable Metaplex Core digital asset.
- **Nature Hero Badges:** Soulbound (non-transferable) accreditation badges issued to approved validators via Metaplex Core `PermanentFreezeDelegate` (`frozen = true`) and `PermanentBurnDelegate` (revocable by protocol admin).
- **Milestone Badges:** Transferable milestone badges claimed at 1 verified tree (**First Root**), 10 verified trees (**Grove Builder**), and 50 verified trees (**Forest Guardian**).
- **Dual-State Model:** The **Solana blockchain is the authoritative source of truth** for all permissions, balances, consensus voting, and digital asset ownership. **Convex** serves as a reactive database mirror powering high-speed map queries, explorer views, search, and dashboard filtering. An autonomous indexer daemon synchronizes events from Solana into Convex.

### 1.2 Technology Stack
- **Smart Contract:** Solana, Rust, Anchor Framework 0.30.1, Metaplex Core (`mpl-core` 0.7.0, program ID: `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`).
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, `next-themes`, Lucide React, Leaflet & OpenStreetMap GIS.
- **Backend & Realtime Database:** [Convex](https://convex.dev) (`convex` 1.45.0).
- **Solana Web3 SDKs:** `@solana/web3.js` 1.98.4, `@coral-xyz/anchor` 0.30.1, `@metaplex-foundation/mpl-core` 1.10.0, `@metaplex-foundation/umi` 0.9.2, `@solana/wallet-adapter-react` 0.15.39.
- **Indexer Daemon:** Node.js service using Anchor `BorshCoder`, `EventParser`, and WebSocket `onLogs` log subscriptions with historical backfill catch-up.

### 1.3 What Was Completed in Phases 1–7
- **Phases 1–3:** Toolchain verification, Arch Linux development environment setup, workspace scaffolding, and TypeScript dependency alignment.
- **Phase 4 (Core Smart Contract):** Canonical PDA state accounts, protocol initialization, validator accreditation/revocation, tree submission with GPS boundary validation (`latitude` in $[-90 \times 10^6 .. 90 \times 10^6]$, `longitude` in $[-180 \times 10^6 .. 180 \times 10^6]$), 2-of-N consensus review mechanism, anti-self-validation, anti-duplicate voting, and emergency pause circuit breaker.
- **Phase 5 (Tree NFT Minting):** Metaplex Core Tree Collection initialization, single-asset Tree NFT minting to verified planters, transferability verification, and Soulbound Nature Hero credential badge issuing with administrative burn delegate revocation.
- **Phase 6 (Milestone Badges):** Official Milestone Badge Collection initialization, milestone qualification tracking on `UserStats`, and multi-tier badge claiming (First Root at 1, Grove Builder at 10, Forest Guardian at 50).
- **Phase 7 (Convex Backend & Event Indexer):**
  - Extended Convex schema ([`convex/schema.ts`](file:///home/japhet/Desktop/CNC-DAO/convex/schema.ts)) with on-chain tracking fields and new tables: `milestoneClaims`, `protocolConfigs`, `indexerState`, `indexerErrors`.
  - Implemented 12 idempotent synchronization mutations and 6 verification queries in [`convex/sync.ts`](file:///home/japhet/Desktop/CNC-DAO/convex/sync.ts) with `INDEXER_SYNC_SECRET` authorization.
  - Built autonomous event indexer engine ([`server/indexer/indexer.ts`](file:///home/japhet/Desktop/CNC-DAO/server/indexer/indexer.ts)) with WebSocket subscriptions, checkpointing, LRU deduplication, exponential backoff retries, and paginated historical backfill.
  - Built read-only state reconciler ([`server/indexer/reconciler.ts`](file:///home/japhet/Desktop/CNC-DAO/server/indexer/reconciler.ts)) comparing on-chain accounts against Convex across 7 discrepancy dimensions and auto-healing Convex without mutating Solana state.
  - Built deployment runtime entrypoint ([`server/indexer/service.ts`](file:///home/japhet/Desktop/CNC-DAO/server/indexer/service.ts)).
  - All 51 Anchor tests and 62 integration/indexer tests passing with 0 failures and 0 TypeScript compilation errors.

### 1.4 Smart Contract Architecture & Canonical PDA Seeds
All accounts are derived deterministically using canonical PDA seeds defined in the PRD:

| Account Struct | PDA Seeds | Bump | Space | Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **`ProtocolConfig`** | `[b"config"]` | Canonical | 160 B | Core admin authority, fee treasury, required approvals (2), pause state, collection pubkeys. |
| **`ValidatorProfile`** | `[b"validator", validator_pubkey.as_ref()]` | Canonical | 80 B | Nature Hero accreditation status, approval timestamp, badge asset pubkey. |
| **`TreeRecord`** | `[b"tree", planter_pubkey.as_ref(), tree_id_bytes.as_ref()]` | Canonical | 336 B | Submitted planting record: GPS coordinates, project type, IPFS CID, 2-of-N consensus vote tracking, status enum, NFT asset pubkey. |
| **`UserStats`** | `[b"user_stats", user_pubkey.as_ref()]` | Canonical | 56 B | User planting counters: `trees_planted`, `trees_verified`, `nfts_minted`. |
| **`MilestoneClaim`** | `[b"milestone", user_pubkey.as_ref(), &[tier]]` | Canonical | 80 B | Replay protection ensuring a user can claim each milestone tier ($0, 1, 2$) exactly once. |

### 1.5 Smart Contract Instruction Interfaces
The generated IDL is located at [`target/idl/naturre.json`](file:///home/japhet/Desktop/CNC-DAO/target/idl/naturre.json).
1. `initialize_protocol(fee_treasury: Pubkey, required_approvals: u8, protocol_fee_lamports: u64)`
2. `toggle_emergency_pause()` (Admin only)
3. `approve_validator(badge_name: Option<String>, badge_uri: Option<String>)` (Admin only)
4. `revoke_validator()` (Admin only, burns soulbound badge)
5. `submit_tree_record(tree_id_bytes: [u8; 32], latitude: i64, longitude: i64, project_type: u8, metadata_cid: String)`
6. `review_tree_submission(tree_id_bytes: [u8; 32], approved: bool)` (Nature Hero only; planter is passed via `remaining_accounts` or accounts context)
7. `initialize_tree_collection(name: String, uri: String)` (Admin only)
8. `mint_tree_nft(name: String, uri: String)` (Planter only, requires verified tree)
9. `initialize_milestone_collection(name: String, uri: String)` (Admin only)
10. `claim_milestone_badge(tier: u8, name: String, uri: String)` (User only, requires meeting verified trees threshold)

---

## 2. Metaplex Core NFT Artwork & Metadata Requirements

### 2.1 Asset Matrix

| Asset Name | Target Format & Dimensions | Transferability | Metadata Standard | Current Status |
| :--- | :---: | :---: | :---: | :---: |
| **Naturre Tree Collection** | 3000x1000px (Banner)<br/>1000x1000px (Logo) PNG/WebP | Authority Controlled | Metaplex Core Collection | ⚠️ **MISSING** (Needs Designer) |
| **Naturre Milestone Collection** | 3000x1000px (Banner)<br/>1000x1000px (Logo) PNG/WebP | Authority Controlled | Metaplex Core Collection | ⚠️ **MISSING** (Needs Designer) |
| **Proof-of-Stewardship Tree NFT** | 1000x1000px PNG/JPG (1:1 Square) | **Freely Transferable** | Metaplex Token Metadata v1 | ⚠️ **MISSING** (Template/Photo frame required) |
| **First Root Milestone Badge** | 1000x1000px Transparent PNG/SVG | **Freely Transferable** | Metaplex Token Metadata v1 | ⚠️ **MISSING** (Using temporary Devnet test URI) |
| **Grove Builder Milestone Badge** | 1000x1000px Transparent PNG/SVG | **Freely Transferable** | Metaplex Token Metadata v1 | ⚠️ **MISSING** (Using temporary Devnet test URI) |
| **Forest Guardian Milestone Badge**| 1000x1000px Transparent PNG/SVG | **Freely Transferable** | Metaplex Token Metadata v1 | ⚠️ **MISSING** (Using temporary Devnet test URI) |
| **Nature Hero Credential Badge** | 1000x1000px Transparent PNG/SVG | **NON-TRANSFERABLE (Soulbound)** | Metaplex Token Metadata v1 | ⚠️ **MISSING** (Using temporary Devnet test URI) |

### 2.2 Metadata JSON Schemas

#### Proof-of-Stewardship Tree NFT
```json
{
  "name": "Naturre Tree #{tree_id_hex}",
  "symbol": "TREE",
  "description": "Verified Proof-of-Stewardship Tree NFT authenticated by Nature Heroes on the Solana blockchain.",
  "image": "ipfs://{IMAGE_CID}",
  "external_url": "https://naturre.xyz/dashboard/nft/{asset_pubkey}",
  "attributes": [
    { "trait_type": "Species", "value": "Acacia senegal" },
    { "trait_type": "Latitude", "value": 37.7749 },
    { "trait_type": "Longitude", "value": -122.4194 },
    { "trait_type": "Planter", "value": "{PLANTER_WALLET_ADDRESS}" },
    { "trait_type": "Planting Date", "value": "2026-11-17T20:00:00Z" },
    { "trait_type": "Project Type", "value": "Reforestation" },
    { "trait_type": "Verification Standard", "value": "2-of-N Nature Hero Consensus" }
  ],
  "properties": {
    "category": "image",
    "files": [{ "uri": "ipfs://{IMAGE_CID}", "type": "image/png" }]
  }
}
```

#### Milestone Badges (First Root / Grove Builder / Forest Guardian)
```json
{
  "name": "First Root",
  "symbol": "ROOT",
  "description": "Awarded to ecological stewards who have planted and verified their first tree on the Naturre protocol.",
  "image": "ipfs://{BADGE_IMAGE_CID}",
  "attributes": [
    { "trait_type": "Milestone Tier", "value": "Tier 0 (First Root)" },
    { "trait_type": "Required Trees", "value": 1 },
    { "trait_type": "Category", "value": "Stewardship Milestone" }
  ]
}
```

#### Nature Hero Credential Badge (Soulbound)
```json
{
  "name": "Nature Hero Credential",
  "symbol": "HERO",
  "description": "Non-transferable official accreditation issued to vetted Nature Hero ecological validators.",
  "image": "ipfs://{NATURE_HERO_IMAGE_CID}",
  "attributes": [
    { "trait_type": "Role", "value": "Ecological Validator" },
    { "trait_type": "Accreditation", "value": "Nature Hero" },
    { "trait_type": "Soulbound", "value": "True" }
  ]
}
```

---

## 3. Frontend Integration Requirements (Phase 8 Scope)

The frontend developer will connect the existing Next.js 14 user interface to the Naturre Solana smart contract using `@coral-xyz/anchor` and the Solana Wallet Adapter.

### 3.1 Wallet Provider Mounting
- Mount in [`providers/SolanaProvider.tsx`](file:///home/japhet/Desktop/CNC-DAO/providers/SolanaProvider.tsx).
- Include standard adapters: Phantom, Solflare, Backpack.
- Mount dynamically in layout with `{ ssr: false }` to suppress SSR hydration errors.
- On wallet connect, invoke Convex mutation `api.users.connectWallet` with `walletAddress: publicKey.toBase58()` to link the session.

### 3.2 UI Page & Component Mappings

| Existing Frontend Page | Smart Contract Target | User Action | Implementation Detail |
| :--- | :--- | :--- | :--- |
| **`app/tree-reg/page.tsx`** | `submit_tree_record` | Submitting planting form | Derive 32-byte `tree_id_bytes`. Prompt wallet signature for `submitTreeRecord(treeIdBytes, latBn, lngBn, projectType, cid)`. |
| **`app/dashboard/verification/page.tsx`** | `review_tree_submission` | Nature Hero reviewing queue | Read pending submissions from Convex (`onChainStatus == 'pending'`). Clicking "Approve" dispatches `reviewTreeSubmission(treeIdBytes, true)`. |
| **`app/dashboard/nft/page.tsx`** & **`/dashboard/map`** | `mint_tree_nft` | Planter minting NFT | For verified trees owned by connected wallet, clicking "Mint NFT" generates asset keypair and dispatches `mintTreeNft(name, uri)`. |
| **`app/dashboard/profile/page.tsx`** & **`/dashboard/nft`** | `claim_milestone_badge` | User claiming badge | When user verified tree count meets 1, 10, or 50, enable claim button to dispatch `claimMilestoneBadge(tier, name, uri)`. |
| **`components/TreeMap.tsx`** & **`components/OSMTreeMap.tsx`** | Read Convex `trees` | Interactive map exploration | Read `onChainPda`, `onChainStatus`, and `nftAssetAddress`. For minted trees, display real Solscan Devnet links (`https://solscan.io/account/{nftAssetAddress}?cluster=devnet`). |

---

## 4. Designer Deliverables

All visual resources must be supplied in vector SVG or high-resolution PNG (minimum 1000x1000px, 300 DPI, sRGB color space).

- [ ] **1. Naturre Tree Collection Imagery:** Logo (1000x1000px) & Banner (3000x1000px).
- [ ] **2. Naturre Milestone Badge Collection Imagery:** Logo (1000x1000px) & Banner (3000x1000px).
- [ ] **3. First Root Milestone Badge Asset (Tier 0):** Sprouting seed / initial root motif (1000x1000px transparent PNG/SVG).
- [ ] **4. Grove Builder Milestone Badge Asset (Tier 1):** Interwoven grove / sunlit cluster motif (1000x1000px transparent PNG/SVG).
- [ ] **5. Forest Guardian Milestone Badge Asset (Tier 2):** Elite forest canopy / ancient tree guardian crest (1000x1000px transparent PNG/SVG).
- [ ] **6. Nature Hero Credential Badge Asset:** Official ecological inspector shield / accreditation crest (1000x1000px transparent PNG/SVG).
- [ ] **7. Stewardship NFT Certificate Frame:** Consistent presentation container to display uploaded user tree photos in the gallery.

---

## 5. Mainnet Readiness Checklist & Blockers

| Item | Responsible Role | Status | Description / Resolution |
| :--- | :--- | :---: | :--- |
| **On-Chain Anchor Smart Contract** | Smart Contract Lead | **COMPLETED** | All 51 Anchor integration tests passing (100% test pass rate). |
| **Convex Database & Event Indexer** | Backend Lead | **COMPLETED** | Idempotent sync, event decoding, deduplication, and reconciler verified across 62 tests. |
| **NFT & Badge Artwork** | UI/UX Designer | **PENDING DESIGN** | ⚠️ **BLOCKER:** Milestone badges, Nature Hero badge, and collection banners must be provided. |
| **IPFS / Arweave Metadata Pinning** | Infrastructure Lead | **PENDING INFRASTRUCTURE** | Production Pinata/Irys account required to upload final JSON schemas and pin assets permanently. |
| **Frontend Wallet & On-Chain Transactions** | Frontend Developer | **PENDING FRONTEND** | Phase 8 scope: Connect wallet adapter and transaction dispatchers to existing pages. |
| **Smart Contract Security Audit** | External Auditor | **PENDING SECURITY REVIEW** | Formal security audit of Anchor instructions and account validation before Mainnet deployment. |
| **Mainnet Program Deployment** | DevOps / Admin | **REQUIRED BEFORE MAINNET** | Requires Mainnet SOL for program buffer deployment and collection rent. |

---

## 6. How to Run & Verify the Codebase

```bash
# 1. Build smart contract
anchor build

# 2. Run smart contract test suite (51 tests)
anchor test

# 3. Run frontend & indexer test suite (62 tests)
npm test

# 4. Run TypeScript compiler check
npx tsc --noEmit

# 5. Start the blockchain event indexer daemon
npx ts-node server/indexer/service.ts
```

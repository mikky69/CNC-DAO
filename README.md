# Naturre Protocol — Frontend Developer & Designer Handoff Specification

Welcome to the **Naturre (CNC DAO)** smart contract integration handoff.

This document is the **single authoritative reference** for the frontend developer and UI/UX designer. It details all Metaplex Core NFT artwork requirements, on-chain smart contract integration interfaces, page-by-page component mappings, Mainnet deployment readiness criteria, and project blockers.

---

## 1. Metaplex Core NFT Artwork & Metadata Requirements

The Naturre Solana smart contract is built on Anchor 0.30.1 and **Metaplex Core** (`mpl-core`). The protocol defines **two official collections** and **five distinct digital assets**.

### 1.1 Summary Matrix

| Asset Name | Type / Standard | Transferability | Target Dimensions & Format | Required Status | Current Implementation Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Naturre Tree Collection** | Metaplex Core Collection | Protocol Authority Controlled | 3000x1000px (Banner)<br/>1000x1000px (Avatar) PNG/WebP | Required Before Mainnet | ⚠️ **MISSING** (Needs Designer) |
| **Naturre Milestone Collection**| Metaplex Core Collection | Protocol Authority Controlled | 3000x1000px (Banner)<br/>1000x1000px (Avatar) PNG/WebP | Required Before Mainnet | ⚠️ **MISSING** (Needs Designer) |
| **Proof-of-Stewardship Tree NFT** | Metaplex Core Single Asset | **Freely Transferable** | 1000x1000px PNG/JPG/WebP (1:1 Square) | Required Before Mainnet | ⚠️ **MISSING** (Template/Photo frame required) |
| **First Root Milestone Badge** | Metaplex Core Single Asset | **Freely Transferable** | 1000x1000px PNG/SVG (Transparent Background) | Required Before Mainnet | ⚠️ **MISSING** (Using temporary Devnet test URI) |
| **Grove Builder Milestone Badge** | Metaplex Core Single Asset | **Freely Transferable** | 1000x1000px PNG/SVG (Transparent Background) | Required Before Mainnet | ⚠️ **MISSING** (Using temporary Devnet test URI) |
| **Forest Guardian Milestone Badge**| Metaplex Core Single Asset | **Freely Transferable** | 1000x1000px PNG/SVG (Transparent Background) | Required Before Mainnet | ⚠️ **MISSING** (Using temporary Devnet test URI) |
| **Nature Hero Credential Badge** | Metaplex Core Single Asset | **NON-TRANSFERABLE (Soulbound)**<br/>• `PermanentFreezeDelegate`<br/>• `PermanentBurnDelegate` | 1000x1000px PNG/SVG (Transparent Background) | Required Before Mainnet | ⚠️ **MISSING** (Using temporary Devnet test URI) |

---

### 1.2 Asset Specifications

#### 1. Proof-of-Stewardship Tree NFT
- **Purpose:** Minted to the original tree planter once their submission receives 2-of-N independent Nature Hero approvals.
- **Transferability:** Freely transferable.
- **Image Requirements:** High-resolution 1000x1000px square image. In production, this can incorporate the planter's uploaded tree photo inside a standardized Naturre certificate frame. Max file size: 5 MB.
- **Metadata JSON Schema (Permanent IPFS URI):**
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

#### 2. First Root Milestone Badge (Tier 0)
- **Eligibility:** Exactly **1 verified tree**.
- **Transferability:** Freely transferable.
- **Artwork Concept:** A solitary sprouting seed with early roots grasping nutrient soil.
- **Image Requirements:** 1000x1000px, 300 DPI, PNG with transparent background.
- **Metadata JSON Schema:**
```json
{
  "name": "First Root",
  "symbol": "ROOT",
  "description": "Awarded to ecological stewards who have planted and verified their first tree on the Naturre protocol.",
  "image": "ipfs://{FIRST_ROOT_IMAGE_CID}",
  "attributes": [
    { "trait_type": "Milestone Tier", "value": "Tier 0 (First Root)" },
    { "trait_type": "Required Trees", "value": 1 },
    { "trait_type": "Category", "value": "Stewardship Milestone" }
  ]
}
```

#### 3. Grove Builder Milestone Badge (Tier 1)
- **Eligibility:** Exactly **10 verified trees**.
- **Transferability:** Freely transferable.
- **Artwork Concept:** A vibrant grove of young trees with interwoven roots and sunlight.
- **Image Requirements:** 1000x1000px, 300 DPI, PNG with transparent background.
- **Metadata JSON Schema:**
```json
{
  "name": "Grove Builder",
  "symbol": "GROVE",
  "description": "Awarded to committed conservationists who have cultivated and verified 10 trees on the Naturre protocol.",
  "image": "ipfs://{GROVE_BUILDER_IMAGE_CID}",
  "attributes": [
    { "trait_type": "Milestone Tier", "value": "Tier 1 (Grove Builder)" },
    { "trait_type": "Required Trees", "value": 10 },
    { "trait_type": "Category", "value": "Stewardship Milestone" }
  ]
}
```

#### 4. Forest Guardian Milestone Badge (Tier 2)
- **Eligibility:** Exactly **50 verified trees**.
- **Transferability:** Freely transferable.
- **Artwork Concept:** A majestic canopy with ancient roots, a guardian shield motif, and golden highlights.
- **Image Requirements:** 1000x1000px, 300 DPI, PNG with transparent background.
- **Metadata JSON Schema:**
```json
{
  "name": "Forest Guardian",
  "symbol": "GUARD",
  "description": "The highest honor for environmental champions who have restored and verified 50 trees on the Naturre protocol.",
  "image": "ipfs://{FOREST_GUARDIAN_IMAGE_CID}",
  "attributes": [
    { "trait_type": "Milestone Tier", "value": "Tier 2 (Forest Guardian)" },
    { "trait_type": "Required Trees", "value": 50 },
    { "trait_type": "Category", "value": "Stewardship Milestone" }
  ]
}
```

#### 5. Nature Hero Credential Badge
- **Eligibility:** Core-team approved validators.
- **Transferability:** **NON-TRANSFERABLE (Soulbound)**.
  - Locked on-chain via Metaplex Core `PermanentFreezeDelegate` (delegate = `protocol_config_pda`, `frozen = true`).
  - Revocable on-chain via Metaplex Core `PermanentBurnDelegate` (delegate = protocol admin authority).
- **Artwork Concept:** An official ecological inspector shield/crest symbolizing verification authority and integrity.
- **Image Requirements:** 1000x1000px, 300 DPI, PNG/SVG with transparent background.
- **Metadata JSON Schema:**
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

## 2. Frontend Integration Requirements (Phase 8)

The frontend developer will connect the existing Next.js 14 user interface to the Naturre Solana smart contract using `@coral-xyz/anchor` and the Solana Wallet Adapter.

### 2.1 Solana Wallet Provider Setup
- Mount the wallet provider in `providers/SolanaProvider.tsx`.
- Include auto-connecting adapters for:
  - **Phantom** (`@solana/wallet-adapter-phantom`)
  - **Solflare** (`@solana/wallet-adapter-solflare`)
  - **Backpack** (Standard wallet adapter)
  - Generic browser wallet discovery.
- **SSR Suppression:** `SolanaProvider.tsx` must be mounted dynamically with `{ ssr: false }` to avoid Next.js hydration mismatches.
- **Authentication Alignment:** When a user connects their Solana wallet, invoke the existing Convex mutation `users.connectWallet` with `walletAddress: publicKey.toBase58()` so the session is unified.

### 2.2 On-Chain Program Instructions & UI Mappings

| Frontend Page / Component | Smart Contract Instruction | Arguments | Required Accounts | Action Description |
| :--- | :--- | :--- | :--- | :--- |
| **`app/tree-reg/page.tsx`**<br/>(Register Tree Form) | `submit_tree_record` | `tree_id_bytes: [u8; 32]`<br/>`latitude: i64`<br/>`longitude: i64`<br/>`project_type: u8`<br/>`metadata_cid: String` | `planter: signer`<br/>`protocol_config: PDA`<br/>`tree_record: PDA`<br/>`user_stats: PDA`<br/>`system_program` | Submits new tree to verification queue. GPS lat/lng scaled by $10^6$. Tree PDA derived from `[b"tree", planter, tree_id_bytes]`. |
| **`app/dashboard/verification/page.tsx`**<br/>(Verification Table) | `review_tree_submission` | `tree_id_bytes: [u8; 32]`<br/>`approved: bool` | `validator: signer`<br/>`planter: AccountInfo`<br/>`protocol_config: PDA`<br/>`validator_profile: PDA`<br/>`tree_record: PDA`<br/>`planter_stats: PDA`<br/>`system_program` | Nature Hero casts an approval (`true`) or rejection (`false`). 2 approvals transition status to `Verified`. |
| **`app/dashboard/nft/page.tsx`** & **`/dashboard/map`** | `mint_tree_nft` | `name: String`<br/>`uri: String` | `planter: signer`<br/>`protocol_config: PDA`<br/>`tree_record: PDA`<br/>`collection: Keypair/Pubkey`<br/>`nft_asset: Keypair (signer)`<br/>`user_stats: PDA`<br/>`mpl_core_program`<br/>`system_program` | Planter mints official Metaplex Core NFT for their verified tree. |
| **`app/dashboard/profile/page.tsx`** & **`/dashboard/nft`** | `claim_milestone_badge` | `tier: u8` (0, 1, or 2)<br/>`name: String`<br/>`uri: String` | `user: signer`<br/>`protocol_config: PDA`<br/>`user_stats: PDA`<br/>`collection: Keypair/Pubkey`<br/>`badge_asset: Keypair (signer)`<br/>`milestone_claim: PDA`<br/>`mpl_core_program`<br/>`system_program` | User claims earned milestone badge (Tier 0: 1 tree, Tier 1: 10 trees, Tier 2: 50 trees). Milestone claim PDA derived from `[b"milestone", user, [tier]]`. |

### 2.3 Existing UI Components to Reuse (Do NOT Redesign)
1. **Tree Map Display (`components/TreeMap.tsx` & `components/OSMTreeMap.tsx`):**
   - Connect map pins directly to Convex query `api.trees.list`.
   - Read `onChainStatus` ("pending", "verified", "minted") and `nftAssetAddress` directly from the database.
   - For minted trees, display real Solscan links (`https://solscan.io/account/{nftAssetAddress}?cluster=devnet`).
2. **Verification Table (`app/dashboard/verification/page.tsx`):**
   - Filter queue for Nature Heroes to inspect trees awaiting review.
   - Replace placeholder confirmation with live wallet signing.
   - Show live approval counters (`approvalsCount: 0/2`, `1/2`, `2/2`).
3. **NFT Gallery (`app/dashboard/nft/page.tsx`):**
   - Display real Metaplex Core assets fetched from the user's connected wallet address via Umi (`@metaplex-foundation/mpl-core` `fetchAssetsByOwner`).
   - Display badge assets claimed by the user.

---

## 3. Designer Deliverables

All visual resources must be supplied in vector SVG or high-resolution PNG (minimum 1000x1000px, 300 DPI, sRGB color space).

### 3.1 Design Deliverables Checklist

- [ ] **1. Naturre Tree Collection Imagery:**
  - Collection Avatar / Logo (1000x1000px, 1:1 square).
  - Collection Hero Banner (3000x1000px, 3:1 landscape).
- [ ] **2. Naturre Milestone Badge Collection Imagery:**
  - Collection Avatar / Logo (1000x1000px, 1:1 square).
  - Collection Hero Banner (3000x1000px, 3:1 landscape).
- [ ] **3. First Root Milestone Badge Asset (Tier 0):**
  - High-res badge asset (1000x1000px PNG/SVG with transparency).
- [ ] **4. Grove Builder Milestone Badge Asset (Tier 1):**
  - High-res badge asset (1000x1000px PNG/SVG with transparency).
- [ ] **5. Forest Guardian Milestone Badge Asset (Tier 2):**
  - High-res badge asset (1000x1000px PNG/SVG with transparency).
- [ ] **6. Nature Hero Credential Badge Asset:**
  - Official validator seal/badge asset (1000x1000px PNG/SVG with transparency).
- [ ] **7. Stewardship NFT Certificate Frame / Card Template:**
  - Clean container graphic to present user tree photos consistently in the NFT gallery.

---

## 4. Mainnet Readiness Checklist

Before Naturre can be launched on Solana Mainnet-Beta, all items below must be fulfilled:

### 1. Smart Contract & Toolchain
- [x] Canonical PDA derivation rules implemented and verified ([docs/smartcontract.md](file:///home/japhet/Desktop/CNC-DAO/docs/smartcontract.md)).
- [x] 2-of-N independent Nature Hero consensus mechanism tested.
- [x] Anti-self-validation and anti-duplicate review protections active.
- [x] Metaplex Core CPI minting and transferability rules verified.
- [x] Non-transferable Nature Hero badge with `PermanentFreezeDelegate` and `PermanentBurnDelegate` tested.
- [x] PRD milestone tiers (1, 10, 50 trees) claims tested.
- [ ] Deploy program binary to Solana Mainnet (`solana program deploy target/deploy/naturre.so`).
- [ ] Initialize on-chain `ProtocolConfig` with production admin keypair and multi-sig treasury.

### 2. Assets & Permanent Metadata Hosting
- [ ] Final designer assets delivered and approved.
- [ ] Metadata JSON and images pinned to **IPFS** via dedicated Pinata gateway or **Arweave** via Irys/Bundlr.
- [ ] Remove all temporary Devnet test URLs (`https://arweave.net/temp-...`).
- [ ] Initialize official on-chain `TreeCollection` and `MilestoneCollection` pointing to permanent metadata URIs.

### 3. Backend & Event Indexer
- [x] Convex schema extended with on-chain indexes and tracking tables.
- [x] Idempotent synchronization mutations implemented ([convex/sync.ts](file:///home/japhet/Desktop/CNC-DAO/convex/sync.ts)).
- [x] Autonomous Solana event indexer implemented ([server/indexer/indexer.ts](file:///home/japhet/Desktop/CNC-DAO/server/indexer/indexer.ts)).
- [x] Ground-truth state reconciler implemented ([server/indexer/reconciler.ts](file:///home/japhet/Desktop/CNC-DAO/server/indexer/reconciler.ts)).
- [x] Indexer runtime service entrypoint ready ([server/indexer/service.ts](file:///home/japhet/Desktop/CNC-DAO/server/indexer/service.ts)).
- [ ] Deploy indexer daemon to production worker (Fly.io, Railway, or AWS ECS).
- [ ] Configure production Solana RPC WebSocket endpoint (Helius, Triton, or QuickNode).
- [ ] Set `INDEXER_SYNC_SECRET` in Convex production environment.

### 4. Frontend Integration
- [ ] Restore multi-wallet adapter in `providers/SolanaProvider.tsx`.
- [ ] Connect tree registration submission form to wallet signing.
- [ ] Connect Nature Hero approval/rejection actions to wallet signing.
- [ ] Connect Tree NFT minting flow to wallet signing.
- [ ] Connect Milestone badge claiming flow to wallet signing.
- [ ] Replace mock/simulated blockchain links with live Solscan Mainnet URLs.

---

## 5. Outstanding Decisions and Project Blockers

| Item | Responsible Role | Status | Description / Blocker Resolution |
| :--- | :--- | :---: | :--- |
| **On-Chain Anchor Smart Contract** | Smart Contract Lead | **COMPLETED** | All 51 Anchor integration tests passing (100% test pass rate). |
| **Convex Database & Event Indexer** | Backend Lead | **COMPLETED** | Idempotent sync, event decoding, deduplication, and reconciler verified across 62 tests. |
| **NFT & Badge Artwork** | UI/UX Designer | **PENDING DESIGN** | ⚠️ **BLOCKER:** Milestone badges, Nature Hero badge, and collection banners must be designed and rendered. |
| **IPFS / Arweave Metadata Pinning** | Infrastructure Lead | **PENDING INFRASTRUCTURE** | Production Pinata/Irys account required to upload final JSON schemas and pin assets permanently. |
| **Frontend Wallet & On-Chain Transactions** | Frontend Developer | **PENDING FRONTEND** | Phase 8 scope: Connect wallet adapter and transaction dispatchers to existing pages. |
| **Smart Contract Security Audit** | External Auditor | **PENDING SECURITY REVIEW** | Formal security audit of Anchor instructions and account validation before Mainnet deployment. |
| **Mainnet Program Deployment** | DevOps / Admin | **REQUIRED BEFORE MAINNET** | Requires Mainnet SOL for program buffer deployment and collection rent. |

---

## 6. How to Run & Verify the Codebase

### 1. Build the Smart Contract
```bash
anchor build
```

### 2. Run Smart Contract Test Suite (51 Tests)
```bash
anchor test
```

### 3. Run Frontend & Indexer Test Suite (62 Tests)
```bash
npm test
```

### 4. Run TypeScript Compilation Check
```bash
npx tsc --noEmit
```

### 5. Run the Blockchain Event Indexer Daemon
```bash
# Set environment variables
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export CONVEX_URL="https://your-convex-deployment.convex.cloud"
export SOLANA_PROGRAM_ID="E6wG3g53YnSuzgzrpJF9zFXFGh7dhraSGejKpRQETjUp"
export INDEXER_SYNC_SECRET="your-production-secret"

# Start indexer service
npx ts-node server/indexer/service.ts
```

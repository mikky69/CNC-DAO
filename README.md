# CNC DAO

A regenerative-finance app on Solana that turns real, human-verified tree planting into a permanent on-chain record. Every submission is confirmed by two independent Nature Heroes before it's written on-chain and minted as a proof-of-stewardship NFT.

**Live:** https://naturre.xyz
**Frontend reference (design source):** https://cncdao.framer.website

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Chain:** Solana (integration pending — see "Where backend/contract work plugs in")

## Project structure

```
app/
  layout.tsx              Root layout, font loading
  page.tsx                 Homepage — all sections
  globals.css              Tailwind entrypoint + custom keyframes
  map/page.tsx              Global Map page (2D registry browser + real OSM map + globe)
  tree-reg/page.tsx         Tree registration form (multi-step, geolocation)
  nature-heroes/page.tsx    Nature Heroes info + application CTA
  nature-heroes/apply/page.tsx  Nature Hero application form
  campaigns/page.tsx        Browse/join planting campaigns
  campaigns/new/page.tsx    Create a campaign (Nature Hero role required)
  connect-wallet/page.tsx   Wallet connect screen
  profile/page.tsx          User profile, role, application status
  contact/page.tsx          Contact form
  privacy-policy/page.tsx

components/
  Header.tsx / Footer.tsx    Shared across every page
  WalletButton.tsx           Header's connect/connected-state button
  MobileNav.tsx               Hamburger menu (mobile)
  TreeMap.tsx                 Interactive 2D tree registry map (filters, search, pan/zoom)
  OSMTreeMap.tsx               Real OpenStreetMap + Leaflet, actual tree coordinates,
                               click-to-view satellite close-up (free Esri imagery)
  DotGlobe.tsx                 Rotating 3D dot-matrix globe (real coastline data,
                               highlights pulled from OSMTreeMap's registeredTrees)
  land-points.json             Precomputed globe coastline points (see scripts/)
  ParticleSphere.jsx           Cursor-reactive particle sphere (hero visual)
  FlipCard.tsx                 3D flip-card interaction (NFT gallery)
  Visuals.tsx                  Logo marquee ticker
  Icons.tsx                    Inline SVG icon set
  Reveal.tsx                   Scroll-triggered fade/slide-in wrapper

lib/
  mockAuth.ts    Frontend-only mock wallet/role state (localStorage). NOT
                 real auth — see "Mock state" section below.

scripts/
  gen-land-points.mjs   Regenerates components/land-points.json from real
                        world-atlas coastline data. Run with
                        `node scripts/gen-land-points.mjs` if you need to
                        change the globe's resolution — do NOT compute this
                        at runtime in the browser, it's expensive (this was
                        previously a real performance bug on the live site).
```

## Mock state — read this before wiring up real auth/backend

Several features are built as real, working UI, but backed by
**localStorage mock state** (`lib/mockAuth.ts`) instead of real
authentication, since there's no backend yet. Specifically:

- **"Connect Wallet"** (`/connect-wallet`) doesn't call any real wallet
  adapter — clicking any option just generates a fake address and stores it
  locally.
- **User roles** (`user`, `nature_hero_pending`, `nature_hero`, `admin`) are
  stored client-side and can be changed by anyone by editing localStorage.
  There's no server-side verification of who actually holds which role.
- **Nature Hero applications** (`/nature-heroes/apply`) "submit" by just
  flipping the local role to `nature_hero_pending` — nothing is sent
  anywhere, and there's no admin approval flow (no admin panel exists).
- **Campaigns** (`/campaigns`, `/campaigns/new`) use a hardcoded array in
  `app/campaigns/page.tsx`. The "Nature Hero only" gate on campaign creation
  checks the same local mock role.

None of this is a security boundary — it's there so the UI has real states
to react to (pending/approved/role-gated pages) while the frontend and
contract/backend work happen in parallel. Replacing it means:

1. Real wallet connection (`@solana/wallet-adapter-react` + a signed message
   to prove wallet ownership)
2. A real backend/database storing role + application status per wallet
3. An admin-only panel/endpoint to approve or reject Nature Hero applications
4. Campaign CRUD backed by the database, with server-side enforcement that
   only approved Nature Heroes can create one

## Where backend/contract work plugs in

Nothing on-chain is wired up yet — every "Connect Wallet," form submission,
and stat on the site is currently either disabled, a placeholder, or static
mock data. Specifically:

| Area | Current state | Needs |
|---|---|---|
| `Header.tsx` / `connect-wallet/page.tsx` — Connect Wallet | Mock only (`lib/mockAuth.ts`), fake address on click | Wallet adapter integration (`@solana/wallet-adapter-react` recommended) |
| `app/tree-reg/page.tsx` — submission form | Local React state only, no submission | API route or direct program call to submit a tree registration |
| `components/OSMTreeMap.tsx` / `TreeMap.tsx` — `registeredTrees` | Hardcoded 2 placeholder trees | Fetch from a real data source (DB or on-chain program accounts) |
| `app/page.tsx` — `registryStats` | Hardcoded numbers | Live counts from chain/DB |
| User roles (`lib/mockAuth.ts`) | localStorage, unverified, client-editable | Real backend-enforced roles tied to wallet address |
| `nature-heroes/apply` — applications | Sets local mock role, nothing persisted | Real submission + storage + notification |
| Admin approval of Nature Heroes | Doesn't exist | Admin-only panel/endpoint |
| `campaigns/page.tsx` — campaign list | Hardcoded array | Database-backed CRUD |
| `campaigns/new/page.tsx` — creation gate | Checks local mock role only | Server-side role check before allowing creation |
| NFT minting | Not implemented — "Mint NFT" button is inert | Mint flow once verification logic exists |
| Nature Hero verification (2-of-2 approval) | Described in copy only | Actual program logic + a Hero-facing review UI (doesn't exist yet) |

Suggested approach: add an `app/api/` directory for route handlers, or a
separate `programs/` directory if using an Anchor workspace in this same
repo (neither exists yet — this is a pure frontend repo today).

## Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build — matches what Vercel runs
```

Before pushing, it's worth running `npx tsc --noEmit` locally — `next build`
runs a strict TypeScript check that a plain syntax check won't catch.

## Deployment

Connected to Vercel, deploys automatically on push to `main`. Domain
(`naturre.xyz`) is configured via Namecheap DNS pointing at Vercel.

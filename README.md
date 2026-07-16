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
  map/page.tsx              Global Map page
  tree-reg/page.tsx         Tree registration/verification form
  nature-heroes/page.tsx    Nature Heroes info + application CTA
  contact/page.tsx          Contact form
  privacy-policy/page.tsx

components/
  Header.tsx / Footer.tsx    Shared across every page
  MobileNav.tsx              Hamburger menu (mobile)
  TreeMap.tsx                Interactive 2D tree registry map (filters, search, pan/zoom)
  DotGlobe.tsx               Rotating 3D dot-matrix globe (real coastline data)
  land-points.json           Precomputed globe coastline points (see scripts/)
  ParticleSphere.jsx         Cursor-reactive particle sphere (hero visual)
  Visuals.tsx                Logo marquee ticker
  Icons.tsx                  Inline SVG icon set
  Reveal.tsx                 Scroll-triggered fade/slide-in wrapper

scripts/
  gen-land-points.mjs   Regenerates components/land-points.json from real
                        world-atlas coastline data. Run with
                        `node scripts/gen-land-points.mjs` if you need to
                        change the globe's resolution — do NOT compute this
                        at runtime in the browser, it's expensive (this was
                        previously a real performance bug on the live site).
```

## Where backend/contract work plugs in

Nothing on-chain is wired up yet — every "Connect Wallet," form submission,
and stat on the site is currently either disabled, a placeholder, or static
mock data. Specifically:

| Area | Current state | Needs |
|---|---|---|
| `Header.tsx` — Connect Wallet button | Static button, no handler | Wallet adapter integration (`@solana/wallet-adapter-react` recommended) |
| `app/tree-reg/page.tsx` — submission form | Local React state only, no submission | API route or direct program call to submit a tree registration |
| `components/TreeMap.tsx` — `trees` array | Hardcoded 2 placeholder trees | Fetch from a real data source (DB or on-chain program accounts) |
| `app/page.tsx` — `registryStats` | Hardcoded numbers | Live counts from chain/DB |
| `components/DotGlobe.tsx` — `highlights` array | Hardcoded coordinates | Real verified-region coordinates |
| NFT minting | Not implemented — "See an Example NFT" button is inert | Mint flow once verification logic exists |
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

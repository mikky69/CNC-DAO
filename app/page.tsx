import Link from "next/link"
import TreeMap from "@/components/TreeMap"
import Navbar from "@/components/Navbar"
import FeaturesGrid from "@/components/FeaturesGrid"
import LiveStats from "@/components/LiveStats"
import SeedToCertificate from "@/components/SeedToCertificate"
import Footer from "@/components/Footer"
import { IconGPS, IconRealtime, IconOnChain, IconCheck, IconArrow, StepIcon, SocialIcon } from "@/components/Icons"
import { RotatingLogos } from "@/components/Visuals"
import ParticleSphere from "@/components/ParticleSphere"

const steps = [
  {
    n: "01",
    title: "Upload tree data",
    body: "Photo, GPS coordinates, species, and planting date. Quick form, works from your phone.",
  },
  {
    n: "02",
    title: "Enters validation queue",
    body: "Your submission is queued for review by two independent Nature Heroes in your region.",
  },
  {
    n: "03",
    title: "Two Heroes verify",
    body: "Nature Heroes review photos, coordinates, and species match. Both must approve before it counts.",
  },
  {
    n: "04",
    title: "Data goes on-chain",
    body: "Verified tree data is written to Solana with IPFS metadata storage. Permanent, tamper-proof.",
  },
  {
    n: "05",
    title: "Appears on global map",
    body: "Your tree is now publicly visible. Anyone can click it to see the verification trail and on-chain proof.",
  },
  {
    n: "06",
    title: "Mint your NFT",
    body: "If the tree survives, mint a proof-of-stewardship certificate on Solana. Your permanent environmental record.",
  },
]

const whyWeExist = [
  {
    tags: ["Community-led", "GPS-verified"],
    heading: "Communities are planting. Nobody is counting.",
    image: "https://framerusercontent.com/images/dE3XXZ4AQ0vtNb4Bzls1LgTPI.png",
    body: "Grassroots tree planting happens every day across Africa and the world, by youth groups, local heroes, and everyday people who care. But without a system to record and track what they plant, their effort disappears the moment they walk away. CNC DAO gives every community planter a permanent, GPS-verified, on-chain record of every tree they grow, so their work is never invisible again.",
  },
  {
    tags: ["Two-Hero consensus", "No self-approval"],
    heading: "Anyone can claim to save the planet.",
    image: "https://framerusercontent.com/images/2uZ9w5c2g3c3c3c3c3c3c3c3c.png",
    body: "A photo opportunity is not proof. A social media post is not verification. Without an independent system to confirm environmental action, anyone can make claims and no one can challenge them. CNC DAO requires every tree to pass through two independent Nature Hero validators before anything is written on-chain. No single person can approve their own submission. Consensus is enforced by code, not trust.",
  },
  {
    tags: ["Proof of stewardship", "Solana NFT"],
    heading: "Real people. Real trees. Zero recognition.",
    image: "https://framerusercontent.com/images/3vZ9w5c2g3c3c3c3c3c3c3c3c.png",
    body: "Across Africa and the developing world, thousands of everyday people plant trees, restore land, and protect ecosystems with their own hands. Their effort is never recorded, never rewarded, and completely invisible to the rest of the world. CNC DAO mints every verified, surviving tree as a permanent Solana NFT, a digital badge of real-world impact that belongs to the planter forever.",
  },
  {
    tags: ["Tamper-proof", "Permanent record"],
    heading: "If it's not on-chain, it didn't happen.",
    image: "https://framerusercontent.com/images/4wZ9w5c2g3c3c3c3c3c3c3c3c.png",
    body: "Paper records get lost. Spreadsheets get deleted. Organisations shut down. The only environmental record that cannot be altered, censored, or erased is one written permanently on a decentralised blockchain. CNC DAO anchors every verified tree to the Solana blockchain, tied to GPS coordinates, a photo hash, validator signatures, and a timestamp that no one can ever change or delete.",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-16">
        <div className="absolute inset-0 z-0">
          <ParticleSphere />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-4 font-[family-name:var(--font-space-mono)] text-xs uppercase tracking-[0.2em] text-[#f5a800]">
            Every Tree Verified On-Chain.
          </p>
          <h1 className="font-[family-name:var(--font-dm-sans)] text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            CNC DAO connects real environmental action with blockchain proof.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-[family-name:var(--font-dm-sans)] text-lg text-white/60">
            Submit a tree, earn verification from Nature Heroes, and mint your stewardship on Solana.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button className="rounded-full bg-[#f5a800] px-8 py-4 text-base font-semibold text-black hover:bg-[#e0a000] transition-colors">
              Plant a Tree
            </button>
            <button className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white hover:border-white/40 transition-colors">
              View Map
            </button>
          </div>
        </div>

        {/* Supported by Solana */}
        <div className="relative z-10 mt-20 w-full max-w-md text-center">
          <p className="mb-6 font-[family-name:var(--font-space-mono)] text-xs uppercase tracking-[0.2em] text-white/40">
            Supported by Solana
          </p>
          <RotatingLogos size={260} />
        </div>
      </section>

      {/* ================= THE PROCESS ================= */}
      <section id="process" className="relative bg-[#050505] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 md:mb-20">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold text-white leading-tight">
              Simple to plant.{" "}
              <span className="text-[#f5a800]">Impossible to fake.</span>
            </h2>
            <p className="mt-4 font-[family-name:var(--font-dm-sans)] text-white/60 text-lg max-w-xl">
              Six steps from tree in the ground to proof on-chain. No crypto knowledge required to get started.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="group rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 hover:border-[#f5a800]/30 transition-all duration-300"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-[family-name:var(--font-space-mono)] text-3xl font-bold text-white/20 group-hover:text-[#f5a800]/40 transition-colors">
                    {s.n}
                  </span>
                  <StepIcon step={parseInt(s.n) as 1 | 2 | 3 | 4 | 5 | 6} className="h-8 w-8 text-[#f5a800]" />
                </div>
                <h3 className="font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white mb-2">
                  {s.title}
                </h3>
                <p className="font-[family-name:var(--font-dm-sans)] text-sm text-white/50 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY WE EXIST ================= */}
      <section id="why" className="relative bg-black py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 md:mb-20">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold text-white leading-tight">
              Why We{" "}
              <span className="text-[#f5a800]">Exist</span>
            </h2>
            <p className="mt-4 font-[family-name:var(--font-dm-sans)] text-white/60 text-lg italic max-w-xl">
              "The planet is being promised to death."
            </p>
          </div>

          <div className="space-y-24 md:space-y-32">
            {whyWeExist.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col gap-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center`}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-[#0a0a0a] px-3 py-1 font-[family-name:var(--font-space-mono)] text-xs text-[#f5a800]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-[family-name:var(--font-syne)] text-2xl md:text-3xl font-bold text-white mb-4">
                    {item.heading}
                  </h3>
                  <p className="font-[family-name:var(--font-dm-sans)] text-white/60 leading-relaxed">
                    {item.body}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={item.image}
                      alt={item.heading}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/800x600/0a0a0a/f5a800?text=CNC+DAO"
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <FeaturesGrid />

      {/* ================= LIVE STATS ================= */}
      <LiveStats />

      {/* ================= SEED TO CERTIFICATE ================= */}
      <SeedToCertificate />

      {/* ================= FOOTER ================= */}
      <Footer />
    </main>
  )
}

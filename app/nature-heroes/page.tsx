import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { IconCheck, IconArrow } from "@/components/Icons"

const responsibilities = [
  {
    title: "Review submissions",
    body: "Check photos, GPS coordinates, and species match what was submitted.",
  },
  {
    title: "Confirm in person or via trusted local network",
    body: "Verify the tree is real and actually planted where claimed.",
  },
  {
    title: "Approve or reject",
    body: "Two independent Heroes must both approve before anything goes on-chain.",
  },
]

export default function NatureHeroesPage() {
  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-16 pt-20 text-center md:px-16 md:pt-28">
        <Reveal>
          <p className="mb-4 font-[family-name:var(--font-space-mono)] text-xs font-bold uppercase tracking-[0.15em] text-[#f0a830]">
            Nature Heroes
          </p>
          <h1 className="mx-auto mb-6 max-w-2xl font-[family-name:var(--font-dm-sans)] text-[36px] font-medium leading-tight tracking-[-0.02em] md:text-[52px]">
            The people who verify every tree
          </h1>
          <p className="mx-auto max-w-xl leading-[1.6] text-[#cccccc]">
            Nature Heroes are independent, regional validators. No submission goes
            on-chain without two of them confirming it in person.
          </p>
        </Reveal>
      </section>

      <section className="px-6 py-16 md:px-16">
        <Reveal>
          <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-4 md:grid-cols-3">
            {responsibilities.map((r) => (
              <div
                key={r.title}
                className="rounded-xl border border-white/10 bg-[#08080f] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1db954]/40"
              >
                <IconCheck className="mb-4 h-8 w-8" />
                <h3 className="mb-2 font-[family-name:var(--font-syne)] text-lg font-bold">
                  {r.title}
                </h3>
                <p className="text-sm text-white/60">{r.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-6 py-24 text-center md:px-16">
        <Reveal>
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-[#08080f] to-[#12121c] p-10">
            <h2 className="mb-3 font-[family-name:var(--font-syne)] text-2xl font-bold">
              Become a Nature Hero
            </h2>
            <p className="mb-8 text-sm text-white/60">
              Applications open on a regional basis as the network grows. Connect
              your wallet to register interest for your area.
            </p>
            <button className="rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium transition-transform duration-200 hover:scale-105">
              Connect Wallet to Apply
            </button>
          </div>
        </Reveal>
      </section>

      {/* ---------- Mint Your Digital Tree Identity ---------- */}
      <section className="border-t border-white/5 px-6 py-24 text-center md:px-16">
        <Reveal>
          <h2 className="mx-auto mb-6 max-w-lg font-[family-name:var(--font-dm-sans)] text-[32px] font-medium leading-tight tracking-[-0.02em] md:text-[44px]">
            Mint Your Digital Tree Identity
          </h2>
          <p className="mx-auto mb-8 max-w-xl leading-[1.6] text-[#cccccc]">
            CNC DAO connects real environmental action with blockchain proof. Submit
            a tree, earn verification from Nature Heroes, and mint your stewardship
            on Solana.
          </p>
          <button className="mx-auto flex items-center gap-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium transition-transform duration-200 hover:scale-105">
            <span className="h-2 w-2 rounded-full bg-white" />
            Mint NFT
          </button>
        </Reveal>
      </section>

      <section className="border-t border-white/5 bg-[#0d0d0d] px-6 py-16 md:px-16">
        <Reveal>
          <div className="mx-auto mb-8 flex max-w-[1200px] items-center justify-between">
            <div>
              <h3 className="mb-1 font-[family-name:var(--font-syne)] text-lg font-bold">
                Potential Variations
              </h3>
              <p className="text-sm text-white/50">
                Each mint generates unique genetic markers and aesthetic traits.
              </p>
            </div>
            <Link
              href="#"
              className="hidden items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#f0a830] sm:flex"
            >
              View Collection <IconArrow className="h-3 w-3 rotate-45" />
            </Link>
          </div>

          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Placeholder cards — the real site uses commissioned character
                illustrations here that I can't reproduce. Swap the gradient
                blocks below for your actual NFT art. */}
            {[
              { name: "CNC Green", price: "$12.00", token: "672VC" },
              { name: "CNC Tree Guy", price: "$12.00", token: "672VC" },
              { name: "CNC Green", price: "$12.00", token: "672VC" },
            ].map((card, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#08080f] transition-all duration-300 hover:-translate-y-1 hover:border-[#1db954]/40"
              >
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#1db954]/20 via-[#0d0d0d] to-[#2d6a30]/30 text-xs text-white/30">
                  Art placeholder
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold">{card.price}</span>
                  </div>
                  <div className="mb-1 font-[family-name:var(--font-syne)] text-sm font-bold">
                    {card.name}
                  </div>
                  <div className="mb-3 text-xs text-white/40">{card.token}</div>
                  <button className="w-full rounded-full bg-white/95 py-2 text-xs font-medium text-[#0b0a12]">
                    Mine NFT
                  </button>
                </div>
              </div>
            ))}

            {/* Rare card variant */}
            <div className="overflow-hidden rounded-xl border border-[#f0a830]/40 bg-[#08080f]">
              <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-[#f0a830]/15 via-[#0d0d0d] to-[#1a1a18] text-xs text-white/30">
                Art placeholder
                <span className="absolute right-2 top-2 rounded-full bg-[#f0a830] px-2 py-0.5 text-[9px] font-bold text-[#1a1a18]">
                  RARE
                </span>
                <span className="absolute bottom-2 left-2 font-[family-name:var(--font-space-mono)] text-[10px] text-white/50">
                  #0192
                </span>
              </div>
              <div className="p-4">
                <div className="font-[family-name:var(--font-syne)] text-sm font-bold">
                  Eco-Web3 Hero
                </div>
                <div className="text-xs text-white/40">Rare — Nature Hero exclusive</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

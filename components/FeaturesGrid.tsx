"use client"

import { IconGPS, IconRealtime, IconOnChain, IconCheck } from "./Icons"

const features = [
  {
    icon: IconGPS,
    title: "GPS-locked submissions",
    body: "Every tree is pinned to the exact coordinates submitted at registration, no guessing, no vague pins.",
  },
  {
    icon: IconRealtime,
    title: "Two-Hero verification",
    body: "Nothing goes on-chain until two independent Nature Heroes confirm species, photo, and location match.",
  },
  {
    icon: IconOnChain,
    title: "Real-time map updates",
    body: "New trees appear the moment 2-of-2 validation completes, visible to anyone, anywhere.",
  },
  {
    icon: IconCheck,
    title: "Tamper-proof records",
    body: "Verified data is written to Solana with IPFS metadata. Nothing can be quietly edited or removed.",
  },
  {
    icon: IconGPS,
    title: "Solana-speed minting",
    body: "Proof-of-stewardship NFTs mint in seconds once a tree is confirmed alive and verified.",
  },
  {
    icon: IconRealtime,
    title: "Public verification trail",
    body: "Every tree's history, photos, validators, and transaction, is open for anyone to check.",
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 md:mb-20">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold text-white leading-tight max-w-2xl">
            Built for verification,{" "}
            <span className="text-[#f5a800]">not speculation</span>
          </h2>
          <p className="mt-4 font-[family-name:var(--font-dm-sans)] text-white/60 text-lg max-w-xl">
            Every part of the system exists to make one thing hard to fake: proof that a tree was actually planted, actually verified, and actually survives.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 hover:border-[#f5a800]/30 transition-all duration-300"
              >
                <div className="mb-4">
                  <Icon className="h-9 w-9" />
                </div>
                <h3 className="font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white mb-2">
                  {f.title}
                </h3>
                <p className="font-[family-name:var(--font-dm-sans)] text-sm text-white/50 leading-relaxed">
                  {f.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

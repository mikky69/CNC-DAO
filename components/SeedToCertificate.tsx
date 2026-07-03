"use client"

import { StepIcon } from "./Icons"

const steps = [
  {
    n: 1,
    title: "Create your account in seconds",
  },
  {
    n: 2,
    title: "Complete tree identity verification process",
  },
  {
    n: 3,
    title: "2 Nature Hero Live Verification",
  },
  {
    n: 4,
    title: "NFT mint",
  },
]

export default function SeedToCertificate() {
  return (
    <section id="steps" className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 md:mb-20">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold text-white leading-tight">
            From seed to{" "}
            <span className="text-[#f5a800]">certificate</span>
          </h2>
          <p className="mt-4 font-[family-name:var(--font-dm-sans)] text-white/60 text-lg">
            Four steps from signup to your first verified tree on-chain.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-[1px] bg-white/10" />
              )}
              <div className="flex flex-col items-start">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a] mb-6">
                  <StepIcon step={s.n as 1 | 2 | 3 | 4} className="h-8 w-8" />
                </div>
                <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#f5a800] mb-2">
                  STEP {s.n}
                </span>
                <p className="font-[family-name:var(--font-dm-sans)] text-white font-medium leading-relaxed">
                  {s.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <button className="rounded-full bg-[#f5a800] px-8 py-4 text-base font-semibold text-black hover:bg-[#e0a000] transition-colors">
            Plant Tree
          </button>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#1a1a1a] overflow-hidden">
              <img
                src="https://framerusercontent.com/images/dE3XXZ4AQ0vtNb4Bzls1LgTPI.png"
                alt="Planter"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-[family-name:var(--font-dm-sans)] text-white/80 text-sm italic">
                "Every seed placed with precision is a future engineered, not guessed."
              </p>
              <p className="font-[family-name:var(--font-dm-sans)] text-white/40 text-xs mt-1">
                Planting — CNC DAO Planting Operator
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

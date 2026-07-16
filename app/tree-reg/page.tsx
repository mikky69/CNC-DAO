"use client"

import { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { IconArrow } from "@/components/Icons"

export default function TreeRegPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-16 pt-20 text-center md:px-16 md:pt-28">
        <Reveal>
          <p className="mb-4 font-[family-name:var(--font-space-mono)] text-xs font-bold uppercase tracking-[0.15em] text-[#f0a830]">
            Verification
          </p>
          <h1 className="mx-auto mb-6 max-w-2xl font-[family-name:var(--font-dm-sans)] text-[36px] font-medium leading-tight tracking-[-0.02em] md:text-[52px]">
            Register a tree
          </h1>
          <p className="mx-auto max-w-xl leading-[1.6] text-[#cccccc]">
            Photo, GPS coordinates, species, and planting date. Two Nature Heroes
            verify before it goes on-chain.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-24 md:px-16">
        <Reveal>
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#08080f] p-6 md:p-10">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1db954]/15">
                  <IconArrow className="h-6 w-6 -rotate-45 text-[#1db954]" />
                </div>
                <h2 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  Submission received
                </h2>
                <p className="text-sm text-white/60">
                  Your tree is now in the validation queue. Two Nature Heroes in
                  your region will review it shortly.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSubmitted(true)
                }}
                className="flex flex-col gap-5"
              >
                <Field label="Tree species" placeholder="e.g. Neem, Mango, Baobab" required />
                <Field label="Planting date" type="date" required />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude" placeholder="6.5244" required />
                  <Field label="Longitude" placeholder="3.3792" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">Photo</label>
                  <div className="flex h-32 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-white/40 transition-colors hover:border-[#1db954]/50 hover:text-white/60">
                    Tap to upload a photo of the tree
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Wallet address
                  </label>
                  <input
                    placeholder="Connect your wallet to auto-fill"
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white/40 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium transition-transform duration-200 hover:scale-105"
                >
                  Submit for verification
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
      />
    </div>
  )
}

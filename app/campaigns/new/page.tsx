"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { IconArrow } from "@/components/Icons"
import { getMockUser } from "@/lib/mockAuth"

export default function NewCampaignPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const u = getMockUser()
    setAllowed(u?.role === "nature_hero" || u?.role === "admin")
  }, [])

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-24 pt-20 md:px-16 md:pt-28">
        <Reveal>
          <div className="mx-auto max-w-xl">
            {allowed === null ? null : !allowed ? (
              <div className="rounded-2xl border border-white/10 bg-[#08080f] p-10 text-center">
                <h1 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  Nature Heroes only
                </h1>
                <p className="mb-6 text-sm text-white/60">
                  Only approved Nature Heroes can create campaigns, since they're
                  responsible for validating the trees planted under them.
                </p>
                <Link
                  href="/nature-heroes/apply"
                  className="inline-block rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium"
                >
                  Apply to become a Nature Hero
                </Link>
              </div>
            ) : submitted ? (
              <div className="rounded-2xl border border-white/10 bg-[#08080f] p-10 text-center">
                <h1 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  Campaign created
                </h1>
                <p className="mb-6 text-sm text-white/60">
                  This is mock/demo state — persisting campaigns for real needs a
                  backend data store.
                </p>
                <Link
                  href="/campaigns"
                  className="inline-block rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium"
                >
                  Back to campaigns
                </Link>
              </div>
            ) : (
              <>
                <h1 className="mb-8 font-[family-name:var(--font-dm-sans)] text-[28px] font-medium tracking-[-0.02em]">
                  Create a planting campaign
                </h1>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSubmitted(true)
                  }}
                  className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#08080f] p-6 md:p-10"
                >
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Campaign name
                    </label>
                    <input
                      required
                      placeholder="e.g. Lagos Mangrove Restoration"
                      className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm text-white/70">Region</label>
                      <input
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-white/70">
                        Participant limit
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        placeholder="100"
                        className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="What's the goal, and what should participants know before joining?"
                      className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium transition-transform duration-200 hover:scale-105"
                  >
                    Create campaign <IconArrow className="h-4 w-4 rotate-45" />
                  </button>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

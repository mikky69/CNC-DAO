"use client"

import { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-16 pt-20 text-center md:px-16 md:pt-28">
        <Reveal>
          <h1 className="mx-auto mb-6 max-w-2xl font-[family-name:var(--font-dm-sans)] text-[36px] font-medium leading-tight tracking-[-0.02em] md:text-[52px]">
            Get in touch
          </h1>
          <p className="mx-auto max-w-xl leading-[1.6] text-[#cccccc]">
            Questions about verification, partnerships, or becoming a Nature Hero —
            reach out below.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-24 md:px-16">
        <Reveal>
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#08080f] p-6 md:p-10">
            {sent ? (
              <div className="py-12 text-center">
                <h2 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  Message sent
                </h2>
                <p className="text-sm text-white/60">We'll get back to you shortly.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
                className="flex flex-col gap-5"
              >
                <div>
                  <label className="mb-2 block text-sm text-white/70">Name</label>
                  <input
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium transition-transform duration-200 hover:scale-105"
                >
                  Send message
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

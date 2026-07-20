"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { IconCheck, IconArrow } from "@/components/Icons"
import { connectMockWallet } from "@/lib/mockAuth"

const wallets = [
  { name: "MetaMask", note: "DETECTED", emoji: "🦊" },
  { name: "WalletConnect", note: "QR CODE / MOBILE", emoji: "🔗" },
  { name: "Coinbase Wallet", note: "", emoji: "🔵" },
]

const guarantees = [
  "You retain full custody & control of your digital identity",
  "No funds are ever directly accessed or stored by the platform",
  "Every submission or verification requires signature approval",
]

export default function ConnectWalletPage() {
  const router = useRouter()

  function handleConnect() {
    // Mock connection — no real wallet adapter wired up yet. See
    // lib/mockAuth.ts and README.md for what real wallet integration needs.
    connectMockWallet()
    router.push("/dashboard")
  }

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="flex min-h-[80vh] items-center justify-center px-6 py-16 md:px-16">
        <Reveal>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[#1db954]/20 bg-gradient-to-b from-[#12121c] to-[#08080f] p-8 shadow-[0_0_60px_-15px_rgba(29,185,84,0.25)]">
            <div className="mb-6 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1db954]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1db954]" />
                Secure verification gateway
              </span>
            </div>

            <div className="mb-8 text-center">
              <img
                src="https://framerusercontent.com/images/XkdqyILHzud8shJDghKw5DhZuw.png"
                alt="CNC DAO"
                className="mx-auto mb-4 h-10 w-10 object-cover"
              />
              <h1 className="mb-1 font-[family-name:var(--font-syne)] text-2xl font-bold">
                Connect Wallet
              </h1>
              <p className="text-sm text-white/50">Access your CNC DAO dashboard securely</p>
            </div>

            <div className="mb-8 flex flex-col gap-3">
              {wallets.map((w) => (
                <button
                  key={w.name}
                  onClick={handleConnect}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:border-[#1db954]/40 hover:bg-white/[0.06]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{w.emoji}</span>
                    <span className="text-sm font-medium">{w.name}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    {w.note}
                    <IconArrow className="h-3 w-3 rotate-45" />
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-6 flex flex-col gap-2.5 border-t border-white/10 pt-6">
              {guarantees.map((g) => (
                <div key={g} className="flex items-start gap-2 text-xs text-white/60">
                  <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {g}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs">
              <button onClick={handleConnect} className="text-white/50 hover:text-white">
                Continue in Demo Mode (Read-only)
              </button>
              <Link href="/contact" className="text-white/50 hover:text-white">
                How connection works
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

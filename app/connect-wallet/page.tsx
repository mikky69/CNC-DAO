"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { IconCheck, IconArrow } from "@/components/Icons"
import { Mail } from "lucide-react"

const guarantees = [
  "You retain full custody & control of your digital identity",
  "No funds are ever directly accessed or stored by the platform",
  "Every submission or verification requires signature approval",
]

export default function ConnectWalletPage() {
  const router = useRouter()
  const { publicKey, connected, wallet, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const connectWalletMutation = useMutation(api.users.connectWallet)

  // Once a wallet is actually connected (publicKey exists), save to Convex
  // and redirect to the dashboard.
  useEffect(() => {
    if (!connected || !publicKey) return
    const address = publicKey.toBase58()
    connectWalletMutation({ walletAddress: address })
      .then(() => router.push("/dashboard"))
      .catch((err) => console.error("Wallet save error:", err))
  }, [connected, publicKey]) // eslint-disable-line

  function handleWalletConnect() {
    // Opens the wallet-adapter modal — the user picks Phantom, Backpack,
    // Solflare, Coinbase Wallet, or any other installed adapter from there.
    setVisible(true)
  }

  function handleGoogleSignIn() {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <main className="bg-background text-foreground font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="flex min-h-[80vh] items-center justify-center px-6 py-16 md:px-16">
        <Reveal className="w-full flex justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-xl">
            <div className="mb-6 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1db954]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1db954]" />
                Secure verification gateway
              </span>
            </div>

            <div className="mb-8 text-center">
              <img
                src="/favicon.png"
                alt="CNC DAO"
                className="mx-auto mb-4 h-10 w-10 object-cover"
              />
              <h1 className="mb-1 font-[family-name:var(--font-syne)] text-2xl font-bold text-foreground">
                Connect Wallet
              </h1>
              <p className="text-sm text-muted-foreground">
                Access your CNC DAO dashboard securely
              </p>
            </div>

            <div className="mb-8 flex flex-col gap-3">
              {/* Single button that opens the wallet-adapter modal — it shows
                  all installed adapters (Phantom, Backpack, Solflare, Coinbase
                  Wallet, etc.) dynamically, no hardcoded list needed */}
              <button
                onClick={handleWalletConnect}
                className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-4 text-left transition-colors hover:border-[#1db954]/40 hover:bg-muted"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1db954]/15 text-lg">
                    ◎
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {connected && wallet
                        ? `Connected: ${wallet.adapter.name}`
                        : "Connect Solana Wallet"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Phantom · Backpack · Solflare · Coinbase Wallet · and more
                    </div>
                  </div>
                </span>
                <IconArrow className="h-4 w-4 rotate-45 text-muted-foreground" />
              </button>

              {/* Quick-access buttons for the two most common Solana wallets */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Phantom", icon: "👻" },
                  { name: "Backpack", icon: "🎒" },
                ].map((w) => (
                  <button
                    key={w.name}
                    onClick={handleWalletConnect}
                    className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:border-[#1db954]/40 hover:bg-muted"
                  >
                    <span className="text-base">{w.icon}</span>
                    {w.name}
                  </button>
                ))}
              </div>

              <div className="my-1 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Link
                href="/auth"
                className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3.5 transition-colors hover:border-[#1db954]/40 hover:bg-muted"
              >
                <Mail className="h-5 w-5 text-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Sign in with Email
                </span>
              </Link>

              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-muted"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.55-5.17 3.55-8.66Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
                </svg>
                <span className="text-sm font-semibold text-foreground">
                  Sign in with Google
                </span>
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-2.5 border-t border-border pt-6">
              {guarantees.map((g) => (
                <div key={g} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1db954]" />
                  <span>{g}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5 text-xs">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Continue as guest (read-only)
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground">
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

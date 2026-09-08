"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { signOut, useSession } from "next-auth/react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSessionUser } from "@/lib/useAuth"

function shortAddress(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

function formatUserLabel(raw: string | undefined | null): string {
  if (!raw) return "User"
  let clean = raw.replace(/^(email|google):/i, "")
  if (clean.includes("@")) clean = clean.split("@")[0]
  if (clean.length > 18 && !clean.includes(" "))
    return `${clean.slice(0, 4)}...${clean.slice(-4)}`
  return clean
}

// PROTECTED routes — never redirect away from these
const PROTECTED = ["/dashboard", "/profile", "/tree-reg", "/campaigns", "/map"]

export function WalletButton({ className = "" }: { className?: string }) {
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const sessionUser = useSessionUser()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const redirectedForAddress = useRef<string | null>(null)
  const connectWalletMutation = useMutation(api.users.connectWallet)

  useEffect(() => {
    if (!connected || !publicKey) return
    const address = publicKey.toBase58()
    // Already redirected for this specific wallet address this mount cycle
    if (redirectedForAddress.current === address) return
    // Already on a protected page — just update address, don't redirect
    if (PROTECTED.some((p) => pathname?.startsWith(p))) return
    redirectedForAddress.current = address
    connectWalletMutation({ walletAddress: address }).catch(console.error)
    router.push("/dashboard")
  }, [connected, publicKey, pathname]) // eslint-disable-line

  // Reset when wallet disconnects
  useEffect(() => {
    if (!connected) redirectedForAddress.current = null
  }, [connected])

  // Close on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const walletLabel = connected && publicKey ? shortAddress(publicKey.toBase58()) : null
  const sessionLabel = sessionUser
    ? formatUserLabel(sessionUser.walletAddress ?? session?.user?.email ?? session?.user?.name ?? "")
    : null
  const label = walletLabel ?? sessionLabel
  const isConnected = connected || !!sessionUser

  if (!isConnected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className={`rounded-full bg-[#1db954] px-4 py-2 text-xs font-medium text-white transition-transform duration-200 hover:scale-105 sm:px-5 sm:py-2.5 sm:text-sm ${className}`}
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/20"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#1db954]/25 text-[10px] font-bold text-[#1db954]">
          {sessionUser?.avatar ? (
            <img src={sessionUser.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (label ?? "?").slice(0, 2).toUpperCase()
          )}
        </span>
        <span className="hidden text-xs font-medium text-white sm:block">
          {label ?? "Connected"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d14] shadow-xl z-50">
          {walletLabel && (
            <div className="border-b border-white/10 px-4 py-2.5">
              <div className="text-[10px] text-white/40 uppercase tracking-wide">Solana wallet</div>
              <div className="font-mono text-[10px] text-white/80 truncate">{publicKey?.toBase58()}</div>
            </div>
          )}
          <button onClick={() => { setOpen(false); router.push("/dashboard") }} className="block w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white">Dashboard</button>
          <button onClick={() => { setOpen(false); router.push("/dashboard") }} className="block w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white">Edit profile</button>
          <div className="border-t border-white/10">
            {connected && (
              <button onClick={() => { disconnect(); setOpen(false) }} className="block w-full px-4 py-3 text-left text-sm text-red-400/80 hover:bg-white/5 hover:text-red-400">Disconnect wallet</button>
            )}
            {sessionUser && (
              <button onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false) }} className="block w-full px-4 py-3 text-left text-sm text-red-400/80 hover:bg-white/5 hover:text-red-400">Sign out</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

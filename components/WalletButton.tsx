"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useSessionUser } from "@/lib/useAuth"

function formatUserLabel(raw: string | undefined | null): string {
  if (!raw) return "User"
  let clean = raw.replace(/^(email|google):/i, "")
  if (clean.includes("@")) clean = clean.split("@")[0]
  if (clean.length > 18 && !clean.includes(" "))
    return `${clean.slice(0, 4)}...${clean.slice(-4)}`
  return clean
}

export function WalletButton({ className = "" }: { className?: string }) {
  const sessionUser = useSessionUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  if (!sessionUser) {
    return (
      <Link
        href="/auth"
        className={`rounded-full bg-[#1db954] px-4 py-2 text-xs font-medium text-white transition-transform duration-200 hover:scale-105 sm:px-5 sm:py-2.5 sm:text-sm ${className}`}
      >
        Sign In
      </Link>
    )
  }

  const label = formatUserLabel(sessionUser.walletAddress ?? sessionUser.displayName ?? "")

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
            label.slice(0, 2).toUpperCase()
          )}
        </span>
        <span className="hidden text-xs font-medium text-white sm:block">{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d14] shadow-xl z-50">
          <button onClick={() => { setOpen(false); router.push("/dashboard") }} className="block w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white">Dashboard</button>
          <button onClick={() => { setOpen(false); router.push("/dashboard") }} className="block w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white">Edit profile</button>
          <div className="border-t border-white/10">
            <button onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false) }} className="block w-full px-4 py-3 text-left text-sm text-red-400/80 hover:bg-white/5 hover:text-red-400">Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}

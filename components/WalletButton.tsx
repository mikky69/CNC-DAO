"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getMockUser, type MockUser } from "@/lib/mockAuth"

export function WalletButton({ className = "" }: { className?: string }) {
  const [user, setUser] = useState<MockUser | null>(null)

  useEffect(() => {
    setUser(getMockUser())
    const handler = () => setUser(getMockUser())
    window.addEventListener("mockuser:change", handler)
    return () => window.removeEventListener("mockuser:change", handler)
  }, [])

  if (user) {
    return (
      <Link
        href="/profile"
        className={`rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 ${className}`}
      >
        {user.walletAddress}
      </Link>
    )
  }

  return (
    <Link
      href="/connect-wallet"
      className={`rounded-full bg-[#1db954] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 ${className}`}
    >
      Connect Wallet
    </Link>
  )
}

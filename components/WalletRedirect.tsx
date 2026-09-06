"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * WalletRedirect — mount ONLY on pages where you explicitly want to redirect
 * after wallet connection (i.e. the /connect-wallet page). Do NOT put this
 * on the homepage or dashboard — it will cause a redirect loop since the
 * wallet stays connected across pages.
 */
export function WalletRedirect() {
  const { connected, publicKey } = useWallet()
  const router = useRouter()
  const connectWalletMutation = useMutation(api.users.connectWallet)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!connected || !publicKey || hasRedirected.current) return
    hasRedirected.current = true
    const address = publicKey.toBase58()
    connectWalletMutation({ walletAddress: address }).catch((err) =>
      console.error("Wallet save error:", err)
    )
    router.push("/dashboard")
  }, [connected, publicKey]) // eslint-disable-line

  return null
}

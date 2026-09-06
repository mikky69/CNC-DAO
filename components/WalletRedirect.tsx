"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * WalletRedirect — mount this on any page where you want the user to be
 * sent to /dashboard after connecting a Solana wallet. It watches the
 * wallet adapter state and fires immediately on connection.
 *
 * Used on the homepage so that autoConnect (returning users whose wallet
 * was already approved) get redirected without having to visit
 * /connect-wallet first.
 */
export function WalletRedirect() {
  const { connected, publicKey } = useWallet()
  const router = useRouter()
  const connectWalletMutation = useMutation(api.users.connectWallet)

  useEffect(() => {
    if (!connected || !publicKey) return
    const address = publicKey.toBase58()
    connectWalletMutation({ walletAddress: address }).catch((err) =>
      console.error("Wallet save error:", err)
    )
    router.push("/dashboard")
  }, [connected, publicKey]) // eslint-disable-line

  return null
}

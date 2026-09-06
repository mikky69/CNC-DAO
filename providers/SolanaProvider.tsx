"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

// Wallet adapters touch `window` at import time, which breaks SSR.
// Wrapping in dynamic with ssr:false ensures they only load in the browser.
const SolanaWalletProvider = dynamic(
  () => import("./SolanaWalletProvider").then((m) => m.SolanaWalletProvider),
  { ssr: false }
)

export function SolanaProvider({ children }: { children: ReactNode }) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>
}

"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import {
  getMockUser,
  disconnectMockWallet,
  setAvatar,
  resizeImage,
  type MockUser,
} from "@/lib/mockAuth"

const roleLabel: Record<MockUser["role"], { label: string; color: string }> = {
  user: { label: "Registered User", color: "#cccccc" },
  nature_hero_pending: { label: "Nature Hero — Pending Review", color: "#f0a830" },
  nature_hero: { label: "Nature Hero", color: "#1db954" },
  admin: { label: "Admin", color: "#a78bfa" },
}

export default function ProfilePage() {
  const [user, setUser] = useState<MockUser | null | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await resizeImage(file)
      setAvatar(dataUrl)
      setUser(getMockUser())
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    setUser(getMockUser())
  }, [])

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 py-24 md:px-16">
        <Reveal>
          <div className="mx-auto max-w-xl">
            {user === undefined ? null : !user ? (
              <div className="rounded-2xl border border-white/10 bg-[#08080f] p-10 text-center">
                <h1 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  No wallet connected
                </h1>
                <p className="mb-6 text-sm text-white/60">
                  Connect a wallet to view your profile.
                </p>
                <Link
                  href="/connect-wallet"
                  className="inline-block rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium"
                >
                  Connect Wallet
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#08080f] p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="group relative flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#1db954]/15 font-[family-name:var(--font-syne)] text-lg font-bold text-[#1db954]">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (user.displayName || user.walletAddress).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      aria-label="Upload profile photo"
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#08080f] bg-white text-[#0b0a12] transition-transform hover:scale-110"
                    >
                      {uploading ? (
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-[#0b0a12] border-t-transparent" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                          <path
                            d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <div className="font-[family-name:var(--font-syne)] font-bold">
                      {user.walletAddress}
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: roleLabel[user.role].color }}
                    >
                      {roleLabel[user.role].label}
                    </div>
                  </div>
                </div>

                {user.role === "nature_hero_pending" && (
                  <div className="mb-6 rounded-lg border border-[#f0a830]/30 bg-[#f0a830]/10 px-4 py-3 text-sm text-[#f0a830]">
                    Your Nature Hero application is under admin review. This is
                    mock/demo state — real approval requires a backend admin panel
                    (not built yet).
                  </div>
                )}

                {user.role === "user" && (
                  <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                    Want to help verify trees?{" "}
                    <Link href="/nature-heroes/apply" className="text-[#1db954] underline">
                      Apply to become a Nature Hero
                    </Link>
                    .
                  </div>
                )}

                <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-white/40">Trees registered</dt>
                    <dd className="font-semibold">0</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">NFTs minted</dt>
                    <dd className="font-semibold">0</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Joined</dt>
                    <dd className="font-semibold">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Campaigns joined</dt>
                    <dd className="font-semibold">0</dd>
                  </div>
                </dl>

                <button
                  onClick={() => {
                    disconnectMockWallet()
                    setUser(null)
                  }}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  Disconnect wallet
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

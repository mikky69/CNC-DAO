"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { BadgeIcon } from "@/components/Icons"
import {
  getMockUser,
  disconnectMockWallet,
  setAvatar,
  setDisplayName,
  setBio,
  setRole,
  resizeImage,
  type MockUser,
  type UserRole,
} from "@/lib/mockAuth"
import { getUserTrees, updateTreeStatus, type RegisteredTree } from "@/lib/registeredTrees"
import { getBadges } from "@/lib/badges"

// Sample data standing in for what an admin would see across ALL users —
// this mock system only tracks one wallet per browser (see lib/mockAuth.ts),
// so cross-user data like this can't be real until there's a backend.
// It's here so the admin dashboard's UI/interaction pattern is real and
// testable, not just described.
const sampleApplications = [
  { id: "app-1", name: "Aisha Bello", region: "Kano, Nigeria", submittedAt: "3 days ago" },
  { id: "app-2", name: "Chidi Okafor", region: "Enugu, Nigeria", submittedAt: "1 day ago" },
]

const roleLabel: Record<MockUser["role"], { label: string; color: string }> = {
  user: { label: "Registered User", color: "#cccccc" },
  nature_hero_pending: { label: "Nature Hero — Pending Review", color: "#f0a830" },
  nature_hero: { label: "Nature Hero", color: "#1db954" },
  admin: { label: "Admin", color: "#a78bfa" },
}

export default function DashboardPage() {
  const [user, setUser] = useState<MockUser | null | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [bioDraft, setBioDraft] = useState("")
  const [pendingTrees, setPendingTrees] = useState<RegisteredTree[]>([])
  const [applications, setApplications] = useState(sampleApplications)
  const fileRef = useRef<HTMLInputElement>(null)

  function refreshQueue() {
    setPendingTrees(getUserTrees().filter((t) => t.status === "pending"))
  }

  useEffect(() => {
    const u = getMockUser()
    setUser(u)
    setNameDraft(u?.displayName ?? "")
    setBioDraft(u?.bio ?? "")
    refreshQueue()
    window.addEventListener("trees:change", refreshQueue)
    return () => window.removeEventListener("trees:change", refreshQueue)
  }, [])

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

  function saveEdits() {
    setDisplayName(nameDraft)
    setBio(bioDraft)
    setUser(getMockUser())
    setEditing(false)
  }

  const treeCount = user ? getUserTrees().length : 0
  const badges = user ? getBadges(user) : []
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 py-16 md:px-16 md:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            {user === undefined ? null : !user ? (
              <div className="rounded-2xl border border-white/10 bg-[#08080f] p-10 text-center">
                <h1 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  No wallet connected
                </h1>
                <p className="mb-6 text-sm text-white/60">
                  Connect a wallet to view your dashboard.
                </p>
                <Link
                  href="/connect-wallet"
                  className="inline-block rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium"
                >
                  Connect Wallet
                </Link>
              </div>
            ) : (
              <>
                {/* Profile card */}
                <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-[#12121c] to-[#08080f] p-8">
                  <div className="mb-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <div className="group relative flex-shrink-0">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#1db954]/15 font-[family-name:var(--font-syne)] text-2xl font-bold text-[#1db954]">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (user.displayName || user.walletAddress).slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        aria-label="Upload profile photo"
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#08080f] bg-white text-[#0b0a12] transition-transform hover:scale-110"
                      >
                        {uploading ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#0b0a12] border-t-transparent" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
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

                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <input
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          placeholder="Display name"
                          className="mb-1 w-full max-w-xs rounded-lg border border-white/10 bg-[#050508] px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-[#1db954]/60"
                        />
                      ) : (
                        <div className="truncate font-[family-name:var(--font-syne)] text-lg font-bold">
                          {user.displayName || user.walletAddress}
                        </div>
                      )}
                      <div className="text-xs text-white/40">{user.walletAddress}</div>
                      <div
                        className="mt-1 text-xs font-semibold"
                        style={{ color: roleLabel[user.role].color }}
                      >
                        {roleLabel[user.role].label}
                      </div>
                    </div>

                    <button
                      onClick={() => (editing ? saveEdits() : setEditing(true))}
                      className="flex-shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/5"
                    >
                      {editing ? "Save" : "Edit profile"}
                    </button>
                  </div>

                  {editing ? (
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder="Add a short bio — where you plant, what you care about, etc."
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-[#050508] px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/60"
                    />
                  ) : user.bio ? (
                    <p className="text-sm text-white/60">{user.bio}</p>
                  ) : null}

                  {user.role === "nature_hero_pending" && (
                    <div className="mt-5 rounded-lg border border-[#f0a830]/30 bg-[#f0a830]/10 px-4 py-3 text-sm text-[#f0a830]">
                      Your Nature Hero application is under admin review.
                    </div>
                  )}
                  {user.role === "user" && (
                    <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                      Want to help verify trees?{" "}
                      <Link href="/nature-heroes/apply" className="text-[#1db954] underline">
                        Apply to become a Nature Hero
                      </Link>
                      .
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Trees registered", value: treeCount },
                    { label: "NFTs minted", value: 0 },
                    { label: "Campaigns joined", value: 0 },
                    { label: "Badges earned", value: `${earnedCount}/${badges.length}` },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-white/10 bg-[#08080f] p-4 text-center"
                    >
                      <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold">
                        {s.value}
                      </div>
                      <div className="mt-1 text-xs text-white/40">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                <div className="mb-8">
                  <h2 className="mb-1 font-[family-name:var(--font-syne)] text-lg font-bold">
                    Badges
                  </h2>
                  <p className="mb-5 text-sm text-white/50">
                    Earned by planting, verifying, and showing up for the network.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {badges.map((b) => (
                      <div
                        key={b.id}
                        className={`rounded-xl border p-4 text-center transition-all ${
                          b.earned
                            ? "border-[#1db954]/30 bg-[#1db954]/[0.06]"
                            : "border-white/5 bg-white/[0.02] opacity-40"
                        }`}
                      >
                        <div
                          className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full ${
                            b.earned ? "bg-[#1db954]/15 text-[#1db954]" : "bg-white/5 text-white/30"
                          }`}
                        >
                          <BadgeIcon name={b.icon} className="h-5 w-5" />
                        </div>
                        <div className="mb-0.5 text-xs font-bold">{b.title}</div>
                        <div className="text-[10px] leading-tight text-white/40">
                          {b.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Queue — Nature Heroes and Admins only */}
                {(user.role === "nature_hero" || user.role === "admin") && (
                  <div className="mb-8">
                    <h2 className="mb-1 font-[family-name:var(--font-syne)] text-lg font-bold">
                      Validation Queue
                    </h2>
                    <p className="mb-5 text-sm text-white/50">
                      Trees waiting on verification before they go on-chain.
                    </p>
                    {pendingTrees.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-[#08080f] p-6 text-center text-sm text-white/40">
                        Nothing in the queue right now.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {pendingTrees.map((t) => (
                          <div
                            key={t.id}
                            className="flex flex-col items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#08080f] p-4 sm:flex-row sm:items-center"
                          >
                            <div>
                              <div className="text-sm font-bold">{t.name}</div>
                              <div className="text-xs text-white/50">
                                {t.species} — {t.location}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateTreeStatus(t.id, "verified")}
                                className="rounded-full bg-[#1db954] px-4 py-1.5 text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateTreeStatus(t.id, "pending")}
                                className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-white/30">
                      Real verification requires two independent Nature Heroes to
                      approve — this demo only tracks one action.
                    </p>
                  </div>
                )}

                {/* Nature Hero Applications — Admins only */}
                {user.role === "admin" && (
                  <div className="mb-8">
                    <h2 className="mb-1 font-[family-name:var(--font-syne)] text-lg font-bold">
                      Nature Hero Applications
                    </h2>
                    <p className="mb-5 text-sm text-white/50">
                      Sample data — real applications need a backend to track
                      other users. See README.md.
                    </p>
                    {applications.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-[#08080f] p-6 text-center text-sm text-white/40">
                        No pending applications.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {applications.map((a) => (
                          <div
                            key={a.id}
                            className="flex flex-col items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#08080f] p-4 sm:flex-row sm:items-center"
                          >
                            <div>
                              <div className="text-sm font-bold">{a.name}</div>
                              <div className="text-xs text-white/50">
                                {a.region} — applied {a.submittedAt}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setApplications((prev) => prev.filter((x) => x.id !== a.id))
                                }
                                className="rounded-full bg-[#1db954] px-4 py-1.5 text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setApplications((prev) => prev.filter((x) => x.id !== a.id))
                                }
                                className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Demo-only role switcher, to preview all three dashboard
                    variants without a real approval backend */}
                <div className="mb-8 rounded-xl border border-dashed border-white/15 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                    Demo: preview as
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["user", "nature_hero", "admin"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r)
                          setUser(getMockUser())
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          user.role === r
                            ? "bg-[#1db954] text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {r.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    disconnectMockWallet()
                    setUser(null)
                  }}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  Disconnect wallet
                </button>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

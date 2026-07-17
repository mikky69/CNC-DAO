"use client"

/**
 * Mock user/role state, stored in localStorage.
 *
 * IMPORTANT: this is frontend-only placeholder state so the UI has
 * something real to react to (role-gated pages, application status, etc).
 * It is NOT auth and NOT secure — anyone can edit localStorage and grant
 * themselves any role. Real implementation needs:
 *   - Wallet-based auth (sign a message to prove wallet ownership)
 *   - A real database storing role + application status per wallet address
 *   - An admin-only backend endpoint to approve/reject Nature Hero applications
 * See README.md "Where backend/contract work plugs in".
 */

export type UserRole = "user" | "nature_hero_pending" | "nature_hero" | "admin"

export type MockUser = {
  walletAddress: string
  role: UserRole
  displayName?: string
  joinedAt: string
}

const STORAGE_KEY = "cncdao_mock_user"

export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setMockUser(user: MockUser) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event("mockuser:change"))
}

export function connectMockWallet(address: string = "Demo" + Math.floor(Math.random() * 9999)) {
  const existing = getMockUser()
  const user: MockUser = existing ?? {
    walletAddress: address,
    role: "user",
    joinedAt: new Date().toISOString(),
  }
  setMockUser(user)
  return user
}

export function submitNatureHeroApplication() {
  const user = getMockUser() ?? connectMockWallet()
  setMockUser({ ...user, role: "nature_hero_pending" })
}

export function disconnectMockWallet() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event("mockuser:change"))
}

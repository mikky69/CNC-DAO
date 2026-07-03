"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const links = [
    { label: "Process", href: "#process" },
    { label: "Why We Exist", href: "#why" },
    { label: "Features", href: "#features" },
    { label: "Stats", href: "#stats" },
    { label: "Get Started", href: "#steps" },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#f5a800] font-bold text-black text-sm">
            CNC
          </div>
          <span className="font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white tracking-tight">
            DAO
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-[family-name:var(--font-dm-sans)] text-sm text-white/70 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <button className="rounded-full bg-[#f5a800] px-5 py-2 text-sm font-semibold text-black hover:bg-[#e0a000] transition-colors">
            Connect Wallet
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-md px-6 py-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 font-[family-name:var(--font-dm-sans)] text-sm text-white/70 hover:text-white border-b border-white/5"
            >
              {l.label}
            </a>
          ))}
          <button className="mt-4 w-full rounded-full bg-[#f5a800] px-5 py-3 text-sm font-semibold text-black">
            Connect Wallet
          </button>
        </div>
      )}
    </nav>
  )
}

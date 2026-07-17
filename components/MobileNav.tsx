"use client"

import { useState } from "react"
import Link from "next/link"

const links = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/map", label: "Global Map" },
  { href: "/tree-reg", label: "Verification" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/#nft", label: "NFT" },
  { href: "/nature-heroes", label: "Nature Heroes" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`h-0.5 w-5 bg-white transition-transform duration-300 ${
            open ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          className={`h-0.5 w-5 bg-white transition-opacity duration-300 ${
            open ? "opacity-0" : "opacity-100"
          }`}
        />
        <span
          className={`h-0.5 w-5 bg-white transition-transform duration-300 ${
            open ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      <div
        className={`fixed inset-x-0 top-[65px] z-40 overflow-hidden border-b border-white/10 bg-[#030303] transition-[max-height] duration-300 ease-out ${
          open ? "max-h-[400px]" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-6 py-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/connect-wallet"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-[#1db954] px-5 py-3 text-center text-sm font-medium text-white"
          >
            Connect Wallet
          </Link>
        </nav>
      </div>
    </div>
  )
}

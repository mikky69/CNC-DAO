"use client"

import Link from "next/link"
import { SocialIcon } from "./Icons"

const footerLinks = {
  Product: [
    { label: "Tree Registry", href: "#" },
    { label: "Nature Heroes", href: "#" },
    { label: "NFT Certificates", href: "#" },
    { label: "Global Map", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Whitepaper", href: "#" },
    { label: "GitHub", href: "https://github.com/mikky69/CNC-DAO" },
    { label: "Community", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
}

const socials = [
  { name: "Twitter", href: "#" },
  { name: "Discord", href: "#" },
  { name: "GitHub", href: "https://github.com/mikky69/CNC-DAO" },
  { name: "Telegram", href: "#" },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#f5a800] font-bold text-black text-sm">
                CNC
              </div>
              <span className="font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white tracking-tight">
                DAO
              </span>
            </Link>
            <p className="font-[family-name:var(--font-dm-sans)] text-sm text-white/50 max-w-xs leading-relaxed mb-6">
              Connecting real environmental action with blockchain proof. Every tree verified, every planter recognized.
            </p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-[#f5a800] hover:border-[#f5a800]/30 transition-all"
                >
                  <SocialIcon name={s.name} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-[family-name:var(--font-dm-sans)] text-sm font-bold text-white mb-4 uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="font-[family-name:var(--font-dm-sans)] text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8">
          <p className="font-[family-name:var(--font-dm-sans)] text-xs text-white/30">
            © 2026 CNC DAO. All rights reserved. Built on Solana.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-dm-sans)] text-xs text-white/30">
              Powered by
            </span>
            <span className="font-[family-name:var(--font-dm-sans)] text-xs font-bold text-[#f5a800]">
              Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

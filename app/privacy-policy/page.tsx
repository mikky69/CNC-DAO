import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"

const sections = [
  {
    title: "What we collect",
    body: "When you register a tree, we store the photo, GPS coordinates, species, planting date, and the wallet address used to submit it. When you contact us, we store your name, email, and message.",
  },
  {
    title: "How it's used",
    body: "Verified tree data is written to the Solana blockchain and IPFS as part of the public registry — that's the point of the project, and it's permanent and public by design. Contact form submissions are used only to respond to your inquiry.",
  },
  {
    title: "On-chain data is permanent",
    body: "Once a tree submission passes verification, its data is written on-chain and cannot be edited or deleted by us or by you. Don't submit information you don't want to be permanently public.",
  },
  {
    title: "Third parties",
    body: "We don't sell personal data. Wallet addresses and on-chain tree data are, by the nature of blockchains, publicly visible to anyone.",
  },
  {
    title: "Contact",
    body: "Questions about this policy or your data can be sent through the Contact page.",
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-16 pt-20 md:px-16 md:pt-28">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 font-[family-name:var(--font-dm-sans)] text-[32px] font-medium tracking-[-0.02em] md:text-[44px]">
              Privacy Policy
            </h1>
            <p className="mb-12 text-sm text-white/50">
              Last updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}
            </p>

            <div className="flex flex-col gap-10">
              {sections.map((s) => (
                <div key={s.title}>
                  <h2 className="mb-2 font-[family-name:var(--font-syne)] text-lg font-bold">
                    {s.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/70">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

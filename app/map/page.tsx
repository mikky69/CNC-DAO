import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import TreeMap from "@/components/TreeMap"
import DotGlobe from "@/components/DotGlobe"
import { Reveal } from "@/components/Reveal"

export const metadata = {
  title: "Global Map — CNC DAO",
  description:
    "Explore every verified tree on the CNC DAO registry. GPS-verified coordinates, real-time updates, and on-chain proof for every planted tree.",
}

export default function MapPage() {
  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-16 pt-20 text-center md:px-16 md:pt-28">
        <Reveal>
          <p className="mb-4 font-[family-name:var(--font-space-mono)] text-xs font-bold uppercase tracking-[0.15em] text-[#f0a830]">
            Global Registry
          </p>
          <h1 className="mx-auto mb-6 max-w-2xl font-[family-name:var(--font-syne)] text-[36px] font-bold leading-tight tracking-[-0.02em] md:text-[52px]">
            Every tree has a permanent address.
          </h1>
          <p className="mx-auto max-w-xl leading-[1.6] text-[#cccccc]">
            Click any pin to see its full verification history, on-chain proof, and
            the Nature Heroes who confirmed it.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-20 md:px-16">
        <Reveal>
          <div className="mx-auto h-[650px] max-w-[1400px] overflow-hidden rounded-2xl border border-white/10">
            <TreeMap />
          </div>
        </Reveal>
      </section>

      <section className="border-t border-white/5 px-6 py-24 text-center md:px-16">
        <Reveal>
          <h2 className="mb-4 font-[family-name:var(--font-dm-sans)] text-[24px] font-medium tracking-[-0.02em] md:text-[40px]">
            A planet-wide registry
          </h2>
          <p className="mx-auto mb-14 max-w-xl leading-[1.6] text-[#cccccc]">
            Every highlighted point is a region with verified trees on-chain. The
            network grows with every submission.
          </p>
          <div className="relative mx-auto h-[420px] w-full max-w-[560px] md:h-[560px]">
            <DotGlobe className="h-full w-full" />
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

"use client"

import { useEffect, useState, useRef } from "react"

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let current = 0
    const duration = 2000
    const steps = 60
    const increment = target / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [started, target])

  return (
    <div ref={ref} className="font-[family-name:var(--font-syne)] text-4xl md:text-5xl font-bold text-white">
      {count.toLocaleString()}{suffix}
    </div>
  )
}

const stats = [
  { value: 1240, label: "Trees verified", suffix: "" },
  { value: 38, label: "Countries", suffix: "" },
  { value: 124, label: "Nature Heroes", suffix: "" },
  { value: 0, label: "Solana Network", suffix: "", isText: true },
]

export default function LiveStats() {
  return (
    <section id="stats" className="relative bg-[#050505] py-24 md:py-32 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 md:mb-16">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold text-white leading-tight">
            Keep Your Environment{" "}
            <span className="text-[#f5a800]">Secured On-Chain</span>
          </h2>
          <p className="mt-4 font-[family-name:var(--font-dm-sans)] text-white/60 text-lg">
            Track live tree, verification, and Nature Hero activity as it happens.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center md:text-left">
              {s.isText ? (
                <div className="font-[family-name:var(--font-syne)] text-3xl md:text-4xl font-bold text-[#f5a800]">
                  Solana
                </div>
              ) : (
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              )}
              <p className="mt-2 font-[family-name:var(--font-dm-sans)] text-sm text-white/50 uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

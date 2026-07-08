"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type Direction = "up" | "left" | "right" | "none"

/**
 * Reveal — wraps content so it fades/slides in the first time it enters the
 * viewport, instead of just appearing statically on load.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hiddenTransform =
    direction === "up"
      ? "translate-y-10"
      : direction === "left"
      ? "-translate-x-10"
      : direction === "right"
      ? "translate-x-10"
      : ""

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-x-0 translate-y-0 opacity-100" : `opacity-0 ${hiddenTransform}`
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  )
}

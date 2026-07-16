"use client"

import { useState, type ReactNode } from "react"

export function FlipCard({
  front,
  back,
  className = "",
}: {
  front: ReactNode
  back: ReactNode
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-label="Flip card"
      className={`group block w-full text-left [perspective:1200px] ${className}`}
    >
      <div
        className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div className="[backface-visibility:hidden]">{front}</div>
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          {back}
        </div>
      </div>
    </button>
  )
}

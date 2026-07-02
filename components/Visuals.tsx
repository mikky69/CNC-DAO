"use client"

import { useEffect, useRef } from "react"

/**
 * RotatingLogos — approximates the 3D rotating badge under "Supported by
 * Solana" on the source site (a WebGL/Three.js canvas carousel of chain
 * logos). That JS isn't recoverable from static HTML, so this is a CSS
 * 3D-transform equivalent using the real logo images from the source site.
 */
const logos = [
  { name: "Ethereum", src: "https://framerusercontent.com/images/rfz9YzkJxaakxQgkWlFsPF1Quw.png" },
  { name: "Stacks", src: "https://framerusercontent.com/images/k3VOE2JemS6d7WsCYjctHWZVKs.png" },
  { name: "Cosmos", src: "https://framerusercontent.com/images/LfZmguZXMsGFe4QFS6Dnj5krylQ.png" },
  { name: "Elrond", src: "https://framerusercontent.com/images/OfyushOZ5EH2nzGCONguxXtLHzg.png" },
  { name: "Polygon", src: "https://framerusercontent.com/images/ZTwbMMIvP3dThXnt1HfxnzZ0Wls.png" },
  { name: "Solana", src: "https://framerusercontent.com/images/wgurUfRKKpRChq302kw3Zg847uU.png" },
]

export function RotatingLogos({ size = 260 }: { size?: number }) {
  const radius = size / 2.4
  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size, perspective: 800 }}
    >
      <div
        className="absolute inset-0 [transform-style:preserve-3d] animate-[spin_16s_linear_infinite]"
      >
        {logos.map((logo, i) => {
          const angle = (360 / logos.length) * i
          return (
            <div
              key={logo.name}
              className="absolute left-1/2 top-1/2 flex h-14 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white/5 p-2 backdrop-blur-sm"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
              }}
            >
              <img src={logo.src} alt={logo.name} className="max-h-6 w-auto object-contain" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * StarSphere — approximates the particle/star visual in the Global Registry
 * section of the source site (a masked, radial-faded WebGL canvas, likely a
 * particle sphere or tree-shaped point cloud). Same caveat: the real
 * Three.js scene isn't recoverable from static markup, this is a canvas
 * particle-field equivalent in the same green/white palette and circular
 * radial mask as the original.
 */
export function StarSphere({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0

    type Particle = { theta: number; phi: number; r: number; speed: number; size: number; green: boolean }
    const particles: Particle[] = Array.from({ length: 260 }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(Math.random() * 2 - 1),
      r: 0.6 + Math.random() * 0.4,
      speed: 0.0015 + Math.random() * 0.002,
      size: 0.6 + Math.random() * 1.6,
      green: Math.random() > 0.4,
    }))

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      w = canvas!.width = parent.clientWidth
      h = canvas!.height = parent.clientHeight
    }
    resize()
    window.addEventListener("resize", resize)

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.42

      const sorted = [...particles].sort((a, b) => Math.sin(a.phi) - Math.sin(b.phi))

      for (const p of sorted) {
        p.theta += p.speed
        const x = Math.sin(p.phi) * Math.cos(p.theta)
        const y = Math.cos(p.phi)
        const z = Math.sin(p.phi) * Math.sin(p.theta)
        const scale = (z + 1.4) / 2.4
        const px = cx + x * R * p.r
        const py = cy + y * R * p.r
        const size = p.size * scale
        const alpha = 0.25 + scale * 0.75

        ctx!.beginPath()
        ctx!.arc(px, py, size, 0, Math.PI * 2)
        ctx!.fillStyle = p.green
          ? `rgba(45, 200, 90, ${alpha})`
          : `rgba(255, 255, 255, ${alpha * 0.8})`
        ctx!.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div
      className={className}
      style={{
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 70%)",
        maskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 70%)",
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}

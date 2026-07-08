"use client"

import { useEffect, useRef, useMemo } from "react"
import { geoContains } from "d3-geo"
import { feature } from "topojson-client"
import land110m from "world-atlas/land-110m.json"

type LandPoint = { lng: number; lat: number }

// Yellow highlight dots — verified tree locations. Swap for real
// coordinates once you have live data (lat, lng, label).
const highlights: LandPoint[] = [
  { lng: 3.4, lat: 6.5 }, // Lagos, Nigeria
  { lng: 12.35, lat: 12.35 }, // N'Djamena area
  { lng: -60, lat: -3 }, // Amazon region
  { lng: -47, lat: -15 }, // Brazil
]

export default function DotGlobe({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Build the land dot grid once (real coastlines via world-atlas + d3-geo,
  // not an approximation).
  const landPoints = useMemo<LandPoint[]>(() => {
    const landFeature = feature(land110m as any, (land110m as any).objects.land) as any
    const points: LandPoint[] = []
    const step = 2.2
    for (let lat = -80; lat <= 80; lat += step) {
      for (let lng = -180; lng <= 180; lng += step) {
        if (geoContains(landFeature, [lng, lat])) {
          points.push({ lng, lat })
        }
      }
    }
    return points
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let rotation = 0.4

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = parent.clientWidth
      h = parent.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    function project(lng: number, lat: number, rot: number, R: number, cx: number, cy: number) {
      const lambda = ((lng + rot) * Math.PI) / 180
      const phi = (lat * Math.PI) / 180
      // simple orthographic projection
      const x = Math.cos(phi) * Math.sin(lambda)
      const y = Math.sin(phi)
      const z = Math.cos(phi) * Math.cos(lambda)
      return { x: cx + x * R, y: cy - y * R, z, visible: z > -0.05 }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.46

      rotation += 0.06

      // outline ring — the glow comes from the stroke's own shadow blur,
      // not a separate fill, so it can never show a hard rectangular edge
      ctx!.beginPath()
      ctx!.arc(cx, cy, R, 0, Math.PI * 2)
      ctx!.strokeStyle = "rgba(255,255,255,0.95)"
      ctx!.lineWidth = 1.4
      ctx!.shadowColor = "rgba(255,255,255,0.95)"
      ctx!.shadowBlur = 22
      ctx!.stroke()
      ctx!.stroke() // second pass deepens the glow without widening the line
      ctx!.shadowBlur = 0

      // land dots
      for (const p of landPoints) {
        const { x, y, z, visible } = project(p.lng, p.lat, rotation, R, cx, cy)
        if (!visible) continue
        const alpha = Math.max(0.08, z)
        ctx!.fillStyle = `rgba(255,255,255,${alpha * 0.85})`
        ctx!.beginPath()
        ctx!.arc(x, y, 1.1, 0, Math.PI * 2)
        ctx!.fill()
      }

      // highlighted verification points (yellow)
      for (const p of highlights) {
        const { x, y, z, visible } = project(p.lng, p.lat, rotation, R, cx, cy)
        if (!visible) continue
        const alpha = Math.max(0.2, z)
        const size = 4 + z * 3
        ctx!.fillStyle = `rgba(216, 226, 55, ${alpha})`
        ctx!.shadowColor = "rgba(216,226,55,0.9)"
        ctx!.shadowBlur = 10
        ctx!.beginPath()
        ctx!.arc(x, y, size, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.shadowBlur = 0
      }

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [landPoints])

  return (
    <div
      className={className}
      style={{
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 62%, transparent 78%)",
        maskImage: "radial-gradient(circle at 50% 50%, black 62%, transparent 78%)",
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}

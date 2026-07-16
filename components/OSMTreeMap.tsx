"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export type RegisteredTree = {
  id: string
  name: string
  species: string
  location: string
  lat: number
  lng: number
  status: "verified" | "minted" | "pending"
}

// Real coordinates for the two trees currently in the registry. Swap this
// for a real fetch (DB or on-chain program accounts) once that exists — see
// README.md "Where backend/contract work plugs in".
export const registeredTrees: RegisteredTree[] = [
  {
    id: "neem-001",
    name: "Neem tree #001",
    species: "Neem",
    location: "Lagos, Nigeria",
    lat: 6.5244,
    lng: 3.3792,
    status: "minted",
  },
  {
    id: "mango-001",
    name: "Mango tree #001",
    species: "Mango",
    location: "Yola, Nigeria",
    lat: 9.2035,
    lng: 12.4954,
    status: "minted",
  },
]

const statusColor: Record<RegisteredTree["status"], string> = {
  verified: "#22c55e",
  minted: "#a78bfa",
  pending: "#f5a800",
}

export default function OSMTreeMap({
  trees = registeredTrees,
  className = "",
}: {
  trees?: RegisteredTree[]
  className?: string
}) {
  // Leaflet's default marker icons reference image paths that break under
  // Next.js's bundler — using CircleMarker instead avoids that entirely, so
  // no icon-fix workaround is needed here.
  useEffect(() => {}, [])

  const center: [number, number] =
    trees.length > 0 ? [trees[0].lat, trees[0].lng] : [9.082, 8.6753]

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={trees.length > 1 ? 5 : 8}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#0b0a12" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trees.map((t) => (
          <CircleMarker
            key={t.id}
            center={[t.lat, t.lng]}
            radius={9}
            pathOptions={{
              color: statusColor[t.status],
              fillColor: statusColor[t.status],
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 13 }}>
                <strong>{t.name}</strong>
                <br />
                {t.species} — {t.location}
                <br />
                <span style={{ textTransform: "capitalize" }}>{t.status}</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

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
//
// This file intentionally has NO dependency on leaflet/react-leaflet, so
// components that just need the coordinates (like DotGlobe) don't
// accidentally pull leaflet's browser-only code into a server-rendered
// component. That mistake previously broke the Vercel build with a
// "window is not defined" prerender error on "/" and "/map".
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

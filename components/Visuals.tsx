"use client"

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
 * Note: the particle "tree among stars" visual now lives in
 * components/ParticleSphere.jsx (a real cursor-reactive Fibonacci-sphere
 * particle system), not here.
 */

/**
 * LogoMarquee — horizontal infinite-scroll ticker of chain logos, matching
 * the real site's ecosystem strip under "Supported by Solana".
 */
const marqueeLogos = [
  { name: "Solana", src: "https://framerusercontent.com/images/wgurUfRKKpRChq302kw3Zg847uU.png" },
  { name: "Ethereum", src: "https://framerusercontent.com/images/rfz9YzkJxaakxQgkWlFsPF1Quw.png" },
  { name: "Stacks", src: "https://framerusercontent.com/images/k3VOE2JemS6d7WsCYjctHWZVKs.png" },
  { name: "Cosmos", src: "https://framerusercontent.com/images/LfZmguZXMsGFe4QFS6Dnj5krylQ.png" },
  { name: "Elrond", src: "https://framerusercontent.com/images/OfyushOZ5EH2nzGCONguxXtLHzg.png" },
  { name: "Polygon", src: "https://framerusercontent.com/images/ZTwbMMIvP3dThXnt1HfxnzZ0Wls.png" },
]

export function LogoMarquee() {
  const loop = [...marqueeLogos, ...marqueeLogos]
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)",
      }}
    >
      <div className="flex w-max animate-[marquee_22s_linear_infinite] items-center gap-14">
        {loop.map((logo, i) => (
          <img
            key={`${logo.name}-${i}`}
            src={logo.src}
            alt={logo.name}
            loading="lazy"
            className="h-8 w-auto flex-shrink-0 object-contain opacity-70"
          />
        ))}
      </div>
    </div>
  )
}

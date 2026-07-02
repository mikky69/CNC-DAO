// Icons ported directly from the SVG path data embedded in the live Framer
// site's markup (the <svg id="..."> template defs). These are generic UI
// icons (checkmarks, GPS pin, clock, link, social glyphs), not stylized
// illustration or branded artwork.

export function IconGPS({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <rect width="36" height="36" rx="8" fill="#C8DEC9" />
      <path
        d="M18 19C19.6569 19 21 17.6569 21 16C21 14.3431 19.6569 13 18 13C16.3431 13 15 14.3431 15 16C15 17.6569 16.3431 19 18 19Z"
        stroke="#2D6A30"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 10C14.7 10 12 12.7 12 16C12 20.5 18 26 18 26C18 26 24 20.5 24 16C24 12.7 21.3 10 18 10Z"
        stroke="#2D6A30"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconRealtime({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <rect width="36" height="36" rx="8" fill="#C8DEC9" />
      <path
        d="M18 10V15M22.2 13.8L18.7 17.3M26 18H21M22.2 22.2L18.7 18.7M18 26V21M13.8 22.2L17.3 18.7M10 18H15M13.8 13.8L17.3 17.3"
        stroke="#2D6A30"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconOnChain({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <rect width="36" height="36" rx="8" fill="#C8DEC9" />
      <path
        d="M23 14H13C11.8954 14 11 14.8954 11 16V22C11 23.1046 11.8954 24 13 24H23C24.1046 24 25 23.1046 25 22V16C25 14.8954 24.1046 14 23 14Z"
        stroke="#2D6A30"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14V13C14 11.9391 14.4214 10.9217 15.1716 10.1716C15.9217 9.42143 16.9391 9 18 9C19.0609 9 20.0783 9.42143 20.8284 10.1716C21.5786 10.9217 22 11.9391 22 13V14"
        stroke="#2D6A30"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="19" r="1" fill="#2D6A30" />
    </svg>
  )
}

export function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="14" fill="#C8DEC9" />
      <path d="M9 14L12 17L19 10" stroke="#2D6A30" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const socialPaths: Record<string, string> = {
  linkedin:
    "M6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM4 9h4v13H4V9Zm6 0h4v2a4 4 0 0 1 4-2c3 0 5 2 5 6v9h-4v-9a2 2 0 0 0-4 0v9h-4V9Z",
  x: "M7.1 3H3l6.7 9-6.4 9h3.9l4.6-6.4 4.9 6.4H21l-7-9.4L20 3h-3.9l-4.1 5.7L7.1 3Z",
  instagram:
    "M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm10.4 3.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z",
  facebook:
    "M13 3h3v4h-2c-1 0-1 1-1 1.6V11h3l-.5 4H13v8h-4v-8H7v-4h2V7.5C9 5 10.5 3 13 3Z",
  youtube:
    "M22.5 6.5a3 3 0 0 0-2.1-2.1C18.6 4 12 4 12 4s-6.6 0-8.4.4A3 3 0 0 0 1.5 6.5 31 31 0 0 0 1 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1C5.4 20 12 20 12 20s6.6 0 8.4-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-5.5ZM9.8 15.5v-7l6 3.5-6 3.5Z",
}

export function SocialIcon({ name, className = "" }: { name: keyof typeof socialPaths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={socialPaths[name]} />
    </svg>
  )
}

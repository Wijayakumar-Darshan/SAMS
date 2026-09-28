/**
 * BrandMark — logo for "කාලසටහන" (Kaala-Sataahana ≈ "Time Schedule").
 *
 * Concept: a rounded schedule tile with three timetable rows,
 * overlapped by a clock face — "time" (කාල) + "table/sheet" (සටහන).
 */
export default function BrandMark({ size = 36, radius = 11 }) {
  const uid = `km-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient
          id={`${uid}-bg`}
          x1="0"
          y1="0"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--primary, #2563EB)" />
          <stop offset="100%" stopColor="var(--accent, #F97316)" />
        </linearGradient>
        <linearGradient
          id={`${uid}-shine`}
          x1="0"
          y1="0"
          x2="0"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rounded tile */}
      <rect width="36" height="36" rx={radius} fill={`url(#${uid}-bg)`} />
      <rect width="36" height="36" rx={radius} fill={`url(#${uid}-shine)`} />

      {/* Timetable rows */}
      <rect x="6.5" y="8.5" width="14" height="2.6" rx="1.3" fill="#fff" fillOpacity="0.95" />
      <rect x="6.5" y="14.2" width="10.5" height="2.6" rx="1.3" fill="#fff" fillOpacity="0.75" />
      <rect x="6.5" y="19.9" width="12.5" height="2.6" rx="1.3" fill="#fff" fillOpacity="0.55" />

      {/* Clock body */}
      <circle cx="25.5" cy="22.5" r="7.4" fill="rgba(15, 23, 42, 0.2)" />
      <circle cx="25.5" cy="22.5" r="6.4" fill="#fff" />

      {/* Clock center + hands */}
      <circle cx="25.5" cy="22.5" r="1.05" fill="var(--primary, #2563EB)" />
      {/* Hour hand */}
      <path
        d="M25.5 22.5 V18.2"
        stroke="var(--primary, #2563EB)"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <path
        d="M25.5 22.5 L28.6 24.3"
        stroke="var(--accent, #F97316)"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  );
}
/**
 * BrandMark — the logo for "කාලසටහන" (Kaala-Sataahana ≈ "Time Schedule").
 *
 * Concept: a rounded tile (a schedule "page") with three timetable rows,
 * overlapped by a clock face whose hands point to a fresh study session —
 * literally "time" (කාල) + "table/sheet" (සටහන) in one mark.
 */
export default function BrandMark({ size = 34, radius = 10 }) {
  const id = "km-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--primary-600)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx={radius} fill={`url(#${id})`} />
      {/* timetable rows */}
      <rect x="6.5" y="8.5" width="13" height="2.4" rx="1.2" fill="white" fillOpacity="0.92" />
      <rect x="6.5" y="14" width="9.5" height="2.4" rx="1.2" fill="white" fillOpacity="0.72" />
      <rect x="6.5" y="19.5" width="11.5" height="2.4" rx="1.2" fill="white" fillOpacity="0.55" />
      {/* clock */}
      <circle cx="24.5" cy="21.5" r="7.1" fill="var(--ink, #0F172A)" fillOpacity="0.22" />
      <circle cx="24.5" cy="21.5" r="6.2" fill="white" />
      <circle cx="24.5" cy="21.5" r="0.9" fill="var(--primary-700, #3730A3)" />
      <path d="M24.5 21.5V17.6" stroke="var(--primary-700, #3730A3)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M24.5 21.5L27.4 23.1" stroke="var(--accent, #F97316)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

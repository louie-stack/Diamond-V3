/** the emblem's marks in a 100 x 100 box: a wobbly ring, the faceted diamond (with a swipe of highlighter), two cupped hands */
export function ScrawlMarks({ weight = 1 }: { weight?: number }) {
  return (
    <>
      <path d="M44 36 L52 24 M40 42 L58 26 M42 50 L60 34 M46 56 L60 42" stroke="#c6f500" strokeWidth={7 * weight} opacity="0.75" />
      <g stroke="#17150f" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M51 7 C 75 5, 94 23, 93 48 C 92 74, 73 93, 49 93 C 24 92, 7 73, 8 48 C 9 25, 27 8, 55 9" strokeWidth={2.6 * weight} />
        <path d="M50 14 L67 35 L51 71 L33 34 Z" strokeWidth={2.6 * weight} />
        <path d="M33 34 L42 41 L50 35 L59 41 L67 35 M50 14 L50 35 M42 41 L49 68 M59 41 L52 68" strokeWidth={1.8 * weight} />
        <path d="M21 52 C 22 64, 32 75, 47 79 M21 52 L19 41 M25 55 L24 44 M29 59 L30 48 M34 63 L36 54" strokeWidth={2.2 * weight} />
        <path d="M79 52 C 78 64, 68 75, 53 79 M79 52 L81 41 M75 55 L76 44 M71 59 L70 48 M66 63 L64 54" strokeWidth={2.2 * weight} />
      </g>
    </>
  );
}

/** the emblem, scrawled in marker */
export default function Scrawl({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ScrawlMarks />
    </svg>
  );
}

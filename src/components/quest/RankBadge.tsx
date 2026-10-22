import { useId } from "react";
import type { Rank, TierId } from "@/lib/game";
import { cn } from "@/lib/utils";

function starPath(points: number, outer: number, inner: number) {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)} `;
  }
  return d + "Z";
}

const SHAPES: Record<TierId, string> = {
  iron: "M50 6 L88 18 V48 C88 72 70 88 50 96 C30 88 12 72 12 48 V18 Z",
  bronze: "M50 5 L89 27 V73 L50 95 L11 73 V27 Z",
  silver: "M32 6 H68 L94 32 V68 L68 94 H32 L6 68 V32 Z",
  gold: "M12 30 L27 13 L39 25 L50 6 L61 25 L73 13 L88 30 V56 C88 76 71 90 50 96 C29 90 12 76 12 56 Z",
  diamond: "M50 3 L93 42 L50 97 L7 42 Z",
  legend: starPath(8, 48, 36),
};

const HAS_RAYS: TierId[] = ["gold", "diamond", "legend"];

interface Props {
  rank: Rank;
  size?: number;
  className?: string;
  locked?: boolean;
}

export function RankBadge({ rank, size = 96, className, locked }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tier = rank.tier.id;
  const a = `var(--tier-${tier}-a)`;
  const b = `var(--tier-${tier}-b)`;
  const path = SHAPES[tier];
  const pipSpacing = 8;
  const pipStart = 50 - ((rank.division - 1) * pipSpacing) / 2;

  return (
    <svg
      viewBox="-12 -12 124 124"
      width={size}
      height={size}
      className={cn("shrink-0 drop-shadow-lg", locked && "opacity-50 saturate-50", className)}
      role="img"
      aria-label={rank.name}
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: a }} />
          <stop offset="100%" style={{ stopColor: b }} />
        </linearGradient>
        <radialGradient id={`r${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: a, stopOpacity: 0.55 }} />
          <stop offset="100%" style={{ stopColor: a, stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {HAS_RAYS.includes(tier) && (
        <g className="animate-spin-slow [transform-box:view-box] [transform-origin:50px_50px]">
          {Array.from({ length: 16 }).map((_, i) => (
            <path
              key={i}
              d="M50 -10 L53 12 L47 12 Z"
              fill={a}
              opacity={0.4}
              transform={`rotate(${i * 22.5} 50 50)`}
            />
          ))}
        </g>
      )}
      {tier !== "iron" && <circle cx="50" cy="50" r="58" fill={`url(#r${uid})`} />}

      <path d={path} fill={`url(#g${uid})`} stroke={a} strokeWidth="1.5" strokeLinejoin="round" />
      {tier === "diamond" && (
        <path
          d="M50 3 L32 42 L50 97 M50 3 L68 42 L50 97 M7 42 H93"
          stroke={a}
          strokeOpacity="0.5"
          fill="none"
        />
      )}
      <path
        d={path}
        transform="translate(50 50) scale(0.76) translate(-50 -50)"
        fill="var(--badge-inner)"
        stroke={b}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* highlight */}
      <path
        d={path}
        transform="translate(50 50) scale(0.9) translate(-50 -50)"
        fill="none"
        stroke={a}
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />

      <text
        x="50"
        y={tier === "diamond" ? 50 : 55}
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize={rank.numeral.length > 2 ? 18 : 22}
        fill={`url(#g${uid})`}
        stroke={a}
        strokeWidth="0.4"
      >
        {rank.numeral}
      </text>

      {Array.from({ length: rank.division }).map((_, i) => (
        <path
          key={i}
          d="M0 -3 L3 0 L0 3 L-3 0 Z"
          transform={`translate(${pipStart + i * pipSpacing} ${tier === "diamond" ? 64 : 70})`}
          fill={a}
        />
      ))}
    </svg>
  );
}

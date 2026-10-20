"use client";

import { useState } from "react";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/* chart space: x = protocol day (0 to 112), y = max outbound % (0 to 100).
   Two sizes, because a desktop viewBox shrinks its type to nothing on a phone. */
const LAST = 112;
const WIDE = { w: 1000, h: 340, pad: { l: 64, r: 24, t: 28, b: 52 }, fs: 15, pcts: [0, 25, 50, 75, 100], days: [1, 25, 50, 75, 100], label: true };
const NARROW = { w: 360, h: 250, pad: { l: 40, r: 16, t: 14, b: 32 }, fs: 12, pcts: [0, 50, 100], days: [1, 50, 100], label: false };

function Chart({ day, spec, className }: { day: number; spec: typeof WIDE; className: string }) {
  const { w: W, h: H, pad: PAD, fs } = spec;
  const x = (d: number) => PAD.l + (d / LAST) * (W - PAD.l - PAD.r);
  const y = (p: number) => H - PAD.b - (p / 100) * (H - PAD.t - PAD.b);
  // one step per day: day N allows N%, then the curve is done
  let stair = `M ${x(0)} ${y(0)}`;
  for (let i = 1; i <= 100; i++) stair += ` V ${y(i).toFixed(1)} H ${x(i).toFixed(1)}`;
  const done = day > 100;
  const px = x(done ? 106 : day - 0.5);
  const py = y(done ? 100 : day);
  // keep the label off the stairs: above-left of the line once there is room, above-right while it is still flat
  const label = done
    ? { x: x(100) - 20, y: y(60), textAnchor: "end" as const }
    : day <= 20
      ? { x: px + 14, y: py - 64, textAnchor: "start" as const }
      : { x: px - 16, y: py - 16, textAnchor: "end" as const };
  const fx = (x(100) + x(LAST)) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Max outbound rises from 1% on day 1 to 100% on day 100, then the limit ends.">
      {spec.pcts.map((p) => (
        <g key={p}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(p)} y2={y(p)} stroke="rgba(236,230,214,0.1)" />
          <text x={PAD.l - fs * 0.9} y={y(p) + fs / 3} textAnchor="end" fontSize={fs} fill="rgba(236,230,214,0.45)" fontFamily="var(--font-term)">{p}%</text>
        </g>
      ))}
      {/* after day 100 there is no line to stay under */}
      <rect x={x(100)} y={PAD.t} width={x(LAST) - x(100)} height={y(0) - PAD.t} fill="rgba(204,255,0,0.07)" />
      <text x={fx} y={y(50)} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill="var(--lime)" fontFamily="var(--font-term)" letterSpacing="2" transform={`rotate(-90 ${fx} ${y(50)})`}>FREE MARKET</text>
      <path d={`${stair} V ${y(0)} Z`} fill="rgba(204,255,0,0.08)" />
      <path d={stair} fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeLinejoin="round" />
      {spec.days.map((d) => (
        <g key={d}>
          <line x1={x(d)} x2={x(d)} y1={y(0)} y2={y(0) + fs / 2} stroke="rgba(236,230,214,0.45)" />
          <text x={x(d)} y={y(0) + fs * 1.85} textAnchor="middle" fontSize={fs} fill="rgba(236,230,214,0.55)" fontFamily="var(--font-term)">DAY {d}</text>
        </g>
      ))}
      {/* the chosen day */}
      {!done && <line x1={px} x2={px} y1={PAD.t} y2={y(0)} stroke="var(--bone)" strokeDasharray="3 5" opacity="0.5" />}
      <circle cx={px} cy={py} r={fs * 0.47} fill="var(--lime)" stroke="var(--night-2)" strokeWidth="3" />
      {spec.label && (
        <text {...label} fontSize={fs * 1.2} fill="var(--bone)" fontFamily="var(--font-term)">
          {done ? "AFTER DAY 100 · NO LIMIT" : `DAY ${day} · ${day}%`}
        </text>
      )}
    </svg>
  );
}

/** The 100-day curve. Pick a day, type a bag, get the max next outbound. */
export default function Calculator() {
  const [raw, setRaw] = useState("1,000,000");
  const [day, setDay] = useState(1);
  const done = day > 100;
  const n = Number(raw.replace(/[^0-9.]/g, "")) || 0;
  const max = done ? n : Math.floor((n * day) / 100);
  const supply = 1_000_000_000;
  const pct = n > 0 ? (max / supply) * 100 : 0;

  return (
    <div className="vf border border-[var(--line-d)]">
      <span className="vf__b" />
      <div className="border-b border-[var(--line-d)] p-8 sm:p-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="meta opacity-50">The 100-day curve</p>
            <p className="display mt-5 text-[clamp(36px,3.6vw,58px)] leading-[1]">
              Anti-jeet early.
              <br />
              <span className="text-[var(--lime)]">Free market over time.</span>
            </p>
          </div>
          <p className="body-s max-w-[380px] text-[var(--bone)]/70">
            The limit follows the age of the protocol, not your wallet. Every holder gets the same percentage on the same day, and
            every day it rises by one.
          </p>
        </div>

        <Chart day={day} spec={WIDE} className="mt-10 block h-auto w-full max-sm:hidden" />
        <Chart day={day} spec={NARROW} className="mt-8 block h-auto w-full sm:hidden" />

        <label htmlFor="day" className="meta mt-8 flex items-center justify-between opacity-60">
          <span>Drag the day</span>
          <span className="text-[var(--lime)]">{done ? "After Day 100" : `Day ${day}`}</span>
        </label>
        <input
          id="day"
          type="range"
          min={1}
          max={101}
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="curve-range mt-4 w-full"
        />
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-[var(--line-d)] p-8 sm:p-12 lg:border-b-0 lg:border-r">
          <p className="meta opacity-50">Worked example. Try your own bag.</p>
          <label htmlFor="bag" className="display mt-5 block text-[clamp(40px,4vw,64px)] leading-[1]">
            Hold how much $DIAMOND?
          </label>
          <input
            id="bag"
            className="field mt-10 text-[var(--bone)]"
            inputMode="numeric"
            value={raw}
            onChange={(e) => {
              const v = Number(e.target.value.replace(/[^0-9]/g, ""));
              setRaw(v ? fmt(Math.min(v, supply)) : "");
            }}
            placeholder="1,000,000"
          />
        </div>
        <div className="flex flex-col justify-between p-8 sm:p-12">
          <p className="meta opacity-50">{done ? "After Day 100, maximum outbound:" : `Day ${day}, maximum next outbound:`}</p>
          <p className="display mt-6 break-all text-[clamp(64px,8vw,128px)] leading-[0.85] text-[var(--lime)] tabular-nums" aria-live="polite">
            {fmt(max)}
          </p>
          <p className="meta mt-6 opacity-60">
            $DIAMOND. {pct > 0 ? `${pct.toFixed(pct < 0.001 ? 5 : 3)}% of supply.` : "Type a number."}{" "}
            {done ? "No cooldown. The curve is done." : "Then your own 24-hour clock starts."}
          </p>
        </div>
      </div>
    </div>
  );
}

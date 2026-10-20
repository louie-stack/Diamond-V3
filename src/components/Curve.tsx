"use client";

import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";
import SecHead from "./SecHead";

/* chart space, in a stretched 1000 x 1000 box: x = protocol day (0 to 112), y = max outbound % */
const LAST = 112;
const X = (d: number) => (d / LAST) * 1000;
const Y = (p: number) => 1000 - p * 10;
const STAIR = (() => {
  let d = `M 0 ${Y(0)}`;
  for (let i = 1; i <= 100; i++) d += ` V ${Y(i)} H ${X(i).toFixed(2)}`;
  return d;
})();
const AXIS = [1, 25, 50, 75, 100];
const FINAL = 101;

/** the milestones from the overview; each is a stop on the timeline and a beat in the caption */
const STOPS = [
  { day: 1, chip: "1%", head: "Day 1. The chart is newborn.", sub: "Every wallet can move 1% of its bag. Not one token more. This is when a whale would strike, so this is when the rules are strongest." },
  { day: 2, chip: "2%", head: "Day 2. 2%.", sub: "One point a day, the same for every holder. No VIP wallets, no exemptions." },
  { day: 3, chip: "3%", head: "Day 3. 3%.", sub: "Each wallet runs its own 24-hour clock, so nobody unlocks at the same moment. Selling pressure stays staggered." },
  { day: 25, chip: "25%", head: "Day 25. A quarter of the way out.", sub: "Holders have been free to sell since Day 1. What nobody could do was empty a giant bag into everyone else." },
  { day: 50, chip: "50%", head: "Day 50. Halfway.", sub: "Liquidity deeper, holders spread out, a chart that grew up under protection. The limit keeps stepping back." },
  { day: 75, chip: "75%", head: "Day 75. The cuffs are loosening.", sub: "Protection when it matters most. Freedom when it doesn't." },
  { day: 100, chip: "100%", head: "Day 100. 100%.", sub: "The curve is complete. Every normal holder can move their whole bag." },
  { day: FINAL, chip: "Free", head: "Anti-jeet early. Free market over time.", sub: "$DIAMOND protects its early market, then gets out of the way. No adjustable curve. No insider exemption. No hidden switch." },
];

/* the reel: [seconds, day]. It glides between stops and holds on each long enough to read. */
const REEL: [number, number][] = [
  [0, 1], [3.2, 1], [3.6, 2], [6.0, 2], [6.4, 3], [9.4, 3], [12.2, 25], [15.6, 25],
  [18.2, 50], [21.6, 50], [24.2, 75], [27.2, 75], [29.8, 100], [32.6, 100], [32.6, FINAL], [38, FINAL],
];
const LOOP = REEL[REEL.length - 1][0];
const dayAt = (t: number) => {
  for (let i = 1; i < REEL.length; i++) {
    const [t1, d1] = REEL[i];
    const [t0, d0] = REEL[i - 1];
    if (t <= t1) return t1 === t0 ? d1 : d0 + ((d1 - d0) * (t - t0)) / (t1 - t0);
  }
  return FINAL;
};
/** where the reel first reaches a day, so it can pick up from wherever you left it */
const timeOf = (d: number) => {
  for (let i = 1; i < REEL.length; i++) {
    const [t1, d1] = REEL[i];
    const [t0, d0] = REEL[i - 1];
    if (d <= d1 && d1 > d0) return t0 + ((t1 - t0) * Math.max(0, d - d0)) / (d1 - d0);
  }
  return 0;
};

const WHALE = 50_000_000; // 5% of supply
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Chapter one: the 100-day curve, as a self-playing reel. It runs on its own
 * clock while on screen; hover or drag the chart to scrub, or pick a stop.
 * JS writes the day into CSS vars and a few text nodes, the visuals are CSS.
 */
export default function Curve() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  const reveal = useRef<SVGRectElement>(null);
  const dayEl = useRef<HTMLSpanElement>(null);
  const sellEl = useRef<HTMLElement>(null);
  const protEl = useRef<HTMLElement>(null);
  const whaleEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const st = stage.current;
    const ch = chart.current;
    if (!st || !ch) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    let last = 0;
    let visible = false;
    let held = false; // the viewer has the wheel
    let resume = 0;
    let lastDay = -1;
    let stop = -1;

    const show = (d: number) => {
      const final = d > 100.5;
      const day = final ? FINAL : Math.max(1, Math.floor(d + 1e-6));
      const hx = final ? 106 : Math.min(100, Math.max(1, d));
      st.style.setProperty("--x", (X(hx) / 1000).toFixed(4));
      st.style.setProperty("--y", (Math.min(100, day) / 100).toFixed(4));
      reveal.current?.setAttribute("width", X(Math.min(100, hx)).toFixed(1));
      if (day !== lastDay) {
        const fwd = day > lastDay && lastDay !== -1;
        lastDay = day;
        const pct = Math.min(100, day);
        if (dayEl.current) dayEl.current.textContent = final ? "100+" : String(day).padStart(3, "0");
        if (sellEl.current) sellEl.current.textContent = final ? "All" : `${pct}%`;
        if (protEl.current) protEl.current.textContent = final ? "None" : `${100 - pct}%`;
        if (whaleEl.current) whaleEl.current.textContent = final ? "The whole bag" : `${fmt((WHALE * pct) / 100)} $DIAMOND`;
        st.dataset.final = final ? "1" : "0";
        st.dataset.side = hx > 70 ? "l" : "r";
        if (fwd && !held && day === FINAL) sfx.ching();
      }
      let s = 0;
      STOPS.forEach((x, i) => { if (day >= x.day) s = i; });
      if (s !== stop) {
        stop = s;
        st.dataset.stop = String(s);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!held) {
        t = (t + dt) % LOOP;
        show(dayAt(t));
      }
      if (visible && !held) raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (still || raf || held || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const take = (d: number) => {
      held = true;
      clearTimeout(resume);
      cancelAnimationFrame(raf);
      raf = 0;
      t = timeOf(d);
      show(d);
    };
    const release = (after: number) => {
      clearTimeout(resume);
      resume = window.setTimeout(() => {
        held = false;
        play();
      }, after);
    };

    // scrub: the pointer's x on the chart is the day
    const dayFromPointer = (e: PointerEvent) => {
      const r = ch.getBoundingClientRect();
      const d = ((e.clientX - r.left) / r.width) * LAST;
      return d > 101 ? FINAL : Math.min(100, Math.max(1, d));
    };
    const onMove = (e: PointerEvent) => take(dayFromPointer(e));
    const onLeave = () => release(1400);
    ch.addEventListener("pointermove", onMove);
    ch.addEventListener("pointerdown", onMove);
    ch.addEventListener("pointerleave", onLeave);
    ch.addEventListener("pointerup", onLeave);

    // the stops along the bottom
    const chips = Array.from(st.querySelectorAll<HTMLButtonElement>(".cv-stop"));
    const onChip = (e: Event) => {
      const d = Number((e.currentTarget as HTMLElement).dataset.day);
      take(d);
      sfx.tick();
      release(4200);
    };
    chips.forEach((c) => c.addEventListener("click", onChip));

    // only spend frames while the reel is on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
    }, { threshold: 0.15 });
    io.observe(root.current!);

    show(1);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      ch.removeEventListener("pointermove", onMove);
      ch.removeEventListener("pointerdown", onMove);
      ch.removeEventListener("pointerleave", onLeave);
      ch.removeEventListener("pointerup", onLeave);
      chips.forEach((c) => c.removeEventListener("click", onChip));
    };
  }, []);

  return (
    <section ref={root} id="curve" className="sec curve scroll-mt-16 overflow-hidden" aria-label="Chapter one. The 100-day curve.">
      <div ref={stage} className="wrap relative" data-stop="0" data-final="0" data-side="r">
        <SecHead
          n="01"
          label="The 100-day curve"
          size="h-m"
          title={<>Protection when it matters most.<br /><span className="text-[var(--lime)]">Then it gets out of the way.</span></>}
          aside={<>Watch it play.<br />Or drag across the chart<br />and take the wheel.</>}
        />

        <div className="cv-plot vf mt-14 lg:mt-16" data-fx="rise">
          <span className="vf__b" />
          <div className="cv-glow" aria-hidden="true" />

          {/* the readout sits in the empty sky above the curve */}
          <div className="cv-read" aria-live="polite">
            <p className="meta cv-read__k">Protocol age</p>
            <p className="display cv-read__day"><span className="cv-read__pre">Day</span><span ref={dayEl} className="tabular-nums">001</span></p>
            <dl className="cv-read__row">
              <div><dt className="meta">Sellable today</dt><dd ref={sellEl} className="display tabular-nums">1%</dd></div>
              <div><dt className="meta">Protected</dt><dd ref={protEl} className="display tabular-nums">99%</dd></div>
            </dl>
          </div>

          <div ref={chart} className="cv-chart" aria-hidden="true">
            {[25, 50, 75, 100].map((p) => (
              <span key={p} className="cv-grid" data-p={p} style={{ bottom: `${p}%` }}><span className="meta">{p}%</span></span>
            ))}
            <div className="cv-free"><span className="term">Free market</span></div>
            <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="cv-svg">
              <defs>
                <clipPath id="cv-past"><rect ref={reveal} x="0" y="0" width="0" height="1000" /></clipPath>
              </defs>
              {/* where it is going */}
              <path d={STAIR} className="cv-ghost" vectorEffect="non-scaling-stroke" />
              {/* where it has been */}
              <g clipPath="url(#cv-past)">
                <path d={`${STAIR} V 1000 Z`} className="cv-area" />
                <path d={STAIR} className="cv-line" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>

            {/* today's column: what you can move, and what the curve still holds back */}
            <div className="cv-col">
              <span className="cv-prot" />
              <span className="cv-sell" />
              <span className="cv-tag cv-tag--prot meta">Protected</span>
              <span className="cv-tag cv-tag--sell meta">Sellable today</span>
            </div>
            <span className="cv-head" />

            {AXIS.map((d) => (
              <span key={d} className="cv-tick meta" data-d={d} style={{ left: `${(X(d) / 10).toFixed(2)}%` }}>Day {d}</span>
            ))}
          </div>
        </div>

        {/* the stops: the overview's table, as a timeline you can click */}
        <div className="cv-stops" data-fx="rise">
          {STOPS.map((s, i) => (
            <button key={s.day} type="button" className="cv-stop" data-day={s.day} data-n={i}>
              <span className="meta">{s.day === FINAL ? "After 100" : `Day ${s.day}`}</span>
              <span className="display">{s.chip}</span>
            </button>
          ))}
        </div>

        <div className="cv-band" data-fx="rise">
          <div className="cv-beats">
            {STOPS.map((s, i) => (
              <div key={s.day} className="cv-beat" data-n={i}>
                <p className="display cv-beat__head">{s.head}</p>
                <p className="cv-beat__sub">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="cv-whale">
            <p className="meta opacity-50">A whale holding 5% can move today</p>
            <p className="display cv-whale__v"><span ref={whaleEl} className="tabular-nums">500,000 $DIAMOND</span></p>
            <p className="meta cv-whale__no">
              <span className="cv-whale__deny">Dump it all: denied</span>
              <span className="cv-whale__ok">Move it all: allowed. The market grew up.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

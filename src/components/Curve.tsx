"use client";

import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";
import SecHead from "./SecHead";
import type { Vault } from "./vault3d";

/**
 * Chapter one: the 100-day curve, explained with your own bag. The bag is 100
 * diamonds in a vault; on Day N, N of them are free to move and the rest stay
 * locked, filling from the bottom up like a rising level. One sentence says the
 * same thing in words, and the curve underneath is the timeline you drag. It
 * plays on its own: one point a day, a hold at Day 100, then the vault relocks.
 * JS writes the day into CSS vars, a few text nodes and is-on classes.
 */

const BEATS = [
  { from: 1, head: "Day 1 is the strictest day.", sub: "This is when a whale would strike, so this is when the rules are strongest. Selling is still allowed. Dumping everything is not." },
  { from: 10, head: "One more point, every day.", sub: "The same for every holder. No VIP wallets, no exemptions. Each wallet runs its own 24-hour clock, so nobody unlocks at the same moment." },
  { from: 25, head: "A quarter of the way out.", sub: "Holders have been free to sell since Day 1. What nobody could do was empty a giant bag into everyone else." },
  { from: 50, head: "Halfway.", sub: "Liquidity deeper, holders spread out, a chart that grew up under protection. The limit keeps stepping back." },
  { from: 75, head: "The cuffs are loosening.", sub: "Protection when it matters most. Freedom when it doesn't." },
  { from: 100, head: "Then it gets out of the way.", sub: "From Day 100 every holder can move their whole bag. No adjustable curve. No insider exemption. No hidden switch." },
];

/* the run: one straight climb, a hold on the open vault, then it relocks */
const DRAW = 25;
const HOLD = 5;
const DOWN = 1.2;
const LOOP = DRAW + HOLD + DOWN;
const FINAL = 101;
const dayAt = (t: number) => (t < DRAW ? 1 + (99 * t) / DRAW : t < DRAW + HOLD ? FINAL : 100 - (99 * (t - DRAW - HOLD)) / DOWN);
const timeOf = (d: number) => (d > 100 ? DRAW : ((d - 1) / 99) * DRAW);

/* the vault fills from the bottom row up, left to right: cell i opens on day i + 1 */
const CELLS = Array.from({ length: 100 }, (_, i) => ({ i, row: 9 - Math.floor(i / 10), col: i % 10 }));

export default function Curve() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scrub = useRef<HTMLDivElement>(null);
  const dayEl = useRef<HTMLSpanElement>(null);
  const nEl = useRef<HTMLSpanElement>(null);
  const sellEl = useRef<HTMLSpanElement>(null);
  const protEl = useRef<HTMLSpanElement>(null);
  const freeEl = useRef<HTMLSpanElement>(null);
  const lockEl = useRef<HTMLSpanElement>(null);
  const nextEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const st = stage.current, sc = scrub.current;
    if (!st || !sc) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gems = Array.from(st.querySelectorAll<HTMLElement>(".vx__gem"));
    const beats = Array.from(st.querySelectorAll<HTMLElement>(".vx__beat"));
    const ticks = Array.from(st.querySelectorAll<HTMLElement>(".bt-scrub__t"));
    let raf = 0, t = 0, last = 0, visible = false, held = false, resume = 0;
    let lastDay = -1, beat = -1;
    // the 3D case, once it loads; the flat grid stands in until then (or for good, without WebGL)
    let vault: Vault | null = null, gone = false;
    const host = st.querySelector<HTMLElement>(".vx__grid")!;
    import("./vault3d").then((m) => {
      if (gone) return;
      vault = m.createVault(host);
      if (!vault) return;
      st.dataset.gl = "1";
      const p = Math.min(100, Math.max(1, lastDay));
      vault.set(p, lastDay > 100, false, false);
    });

    const show = (d: number, down = false) => {
      const final = d > 100.5;
      const dc = final ? 100 : Math.min(100, Math.max(1, d));
      const day = final ? FINAL : Math.max(1, Math.floor(d + 1e-6));
      const p = Math.min(100, day);
      st.style.setProperty("--x", ((dc - 1) / 99).toFixed(4));
      st.dataset.down = down ? "1" : "0";
      if (day === lastDay) return;
      const fwd = day > lastDay && lastDay !== -1;
      lastDay = day;
      st.style.setProperty("--p", `${p}%`);
      st.style.setProperty("--pf", (p / 100).toFixed(2));
      if (dayEl.current) dayEl.current.textContent = final ? "100+" : String(day).padStart(3, "0");
      if (nEl.current) nEl.current.textContent = String(p);
      if (sellEl.current) sellEl.current.textContent = final ? "All" : `${p}%`;
      if (protEl.current) protEl.current.textContent = final ? "None" : `${100 - p}%`;
      if (freeEl.current) freeEl.current.textContent = String(p);
      if (lockEl.current) lockEl.current.textContent = String(100 - p);
      if (nextEl.current) nextEl.current.textContent = final ? "Anytime" : "24h later";
      gems.forEach((g, i) => {
        const on = i < p;
        if (on === g.classList.contains("is-on")) return;
        g.classList.toggle("is-on", on);
        // the newest one pops; on a scrub or a relock they just switch
        g.classList.toggle("is-new", on && fwd && !held && !down);
      });
      ticks.forEach((k, i) => k.classList.toggle("is-on", i < p));
      vault?.set(p, final, down, fwd && !held && !down);
      const was = st.dataset.final === "1";
      st.dataset.final = final ? "1" : "0";
      if (!held && !down) {
        if (fwd && !final) sfx.tick();
        if (final && !was) sfx.ching();
      }
      let s = 0;
      BEATS.forEach((b, i) => { if (day >= b.from) s = i; });
      if (s !== beat) {
        beat = s;
        beats.forEach((b, i) => b.classList.toggle("is-on", i === s));
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!held) {
        t = (t + dt) % LOOP;
        show(dayAt(t), t > DRAW + HOLD);
      }
      if (visible) raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (raf || !visible || still) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const take = (d: number) => {
      held = true;
      st.dataset.held = "1";
      clearTimeout(resume);
      t = timeOf(d);
      show(d);
    };
    const release = () => {
      clearTimeout(resume);
      resume = window.setTimeout(() => { held = false; st.dataset.held = "0"; }, 1800);
    };

    // drag the curve: the pointer is the day
    const at = (e: PointerEvent) => {
      const r = sc.getBoundingClientRect();
      const f = (e.clientX - r.left) / r.width;
      return f > 1.005 ? FINAL : 1 + Math.min(1, Math.max(0, f)) * 99;
    };
    const onMove = (e: PointerEvent) => take(at(e));
    sc.addEventListener("pointermove", onMove);
    sc.addEventListener("pointerdown", onMove);
    sc.addEventListener("pointerleave", release);
    sc.addEventListener("pointerup", release);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
    }, { threshold: 0.15 });
    io.observe(root.current!);

    show(still ? 37 : 1);
    return () => {
      gone = true;
      vault?.dispose();
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      sc.removeEventListener("pointermove", onMove);
      sc.removeEventListener("pointerdown", onMove);
      sc.removeEventListener("pointerleave", release);
      sc.removeEventListener("pointerup", release);
    };
  }, []);

  return (
    <section ref={root} id="curve" className="sec bt-sec scroll-mt-16 overflow-hidden" aria-label="Chapter one. The 100-day curve.">
      {/* one gem, drawn once */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="vx-lit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2ffb0" />
            <stop offset="0.45" stopColor="#ccff00" />
            <stop offset="1" stopColor="#7fa300" />
          </linearGradient>
          <symbol id="vx-gem" viewBox="0 0 24 22">
            <path d="M6 1 H18 L23 7.5 L12 21 L1 7.5 Z" style={{ fill: "var(--gb)", stroke: "var(--gs)", strokeWidth: 0.8, strokeLinejoin: "round" }} />
            <path d="M1 7.5 H23 M6 1 L8.5 7.5 L12 21 M18 1 L15.5 7.5 L12 21 M8.5 7.5 L12 1 L15.5 7.5" style={{ fill: "none", stroke: "var(--gf)", strokeWidth: 0.6, strokeLinejoin: "round" }} />
            <path d="M6 1 L8.5 7.5 L1 7.5 Z" style={{ fill: "var(--gh)" }} />
            <path d="M12 1 L15.5 7.5 L8.5 7.5 Z" style={{ fill: "var(--gh2)" }} />
          </symbol>
        </defs>
      </svg>

      <div className="wrap">
        <SecHead
          n="01"
          label="The 100-day curve"
          size="h-m"
          title={<>Protection when it matters most.<br /><span className="text-[var(--lime)]">Then it gets out of the way.</span></>}
          aside={<>Your bag, 100 tokens.<br />Watch how much of it can move.<br />Drag the curve to pick a day.</>}
        />

        <div ref={stage} className="vx mt-14 lg:mt-20" data-final="0" data-down="0" data-held="0">
          <div className="vx__copy">
            <p className="meta vx__k">Protocol age / Day <span ref={dayEl} className="tabular-nums text-[var(--bone)]">001</span></p>
            <p className="display vx__line" aria-live="polite">
              Today you can move
              <br /><span className="vx__n"><span ref={nEl} className="tabular-nums">1</span></span> of every 100
              <br />tokens you hold.
            </p>
            <dl className="vx__row">
              <div><dt className="meta">Sellable today</dt><dd className="display tabular-nums"><span ref={sellEl}>1%</span></dd></div>
              <div><dt className="meta">Protected</dt><dd className="display tabular-nums"><span ref={protEl}>99%</span></dd></div>
              <div><dt className="meta">Next sell</dt><dd className="display"><span ref={nextEl}>24h later</span></dd></div>
            </dl>
            <div className="vx__beats">
              {BEATS.map((b, i) => (
                <div key={b.from} className={`vx__beat ${i === 0 ? "is-on" : ""}`}>
                  <p className="display vx__beat-h">{b.head}</p>
                  <p className="vx__beat-s">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* the vault: your bag as 100 diamonds */}
          <figure className="vx__vault" aria-hidden="true">
            <figcaption className="vx__cap meta"><span>Your bag</span><span>100 tokens</span></figcaption>
            <div className="vx__grid">
              <span className="vx__level" />
              {CELLS.map(({ i, row, col }) => (
                <span key={i} className="vx__gem" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
                  <svg viewBox="0 0 24 22"><use href="#vx-gem" /></svg>
                  <i className="vx__lock" />
                </span>
              ))}
              <span className="vx__stamp"><span className="stamp stamp--lime">Free market</span></span>
            </div>
            <div className="vx__foot meta">
              <span><b className="vx__dot vx__dot--on" /><span ref={freeEl} className="tabular-nums">1</span> free to move today</span>
              <span><b className="vx__dot" /><span ref={lockEl} className="tabular-nums">99</span> locked</span>
            </div>
          </figure>

          {/* the curve is the timeline: 100 bars, one a day, each 1% taller than the last; drag it */}
          <div ref={scrub} className="bt-curve" aria-hidden="true">
            <div className="bt-curve__bars">
              {Array.from({ length: 100 }, (_, i) => (
                <span key={i} className={`bt-scrub__t ${(i + 1) % 25 === 0 ? "is-key" : ""}`} style={{ height: `${i + 1}%` }} />
              ))}
            </div>
            <span className="bt-scrub__head" />
            <div className="bt-curve__lbl meta">
              <span>Day 1 / 1%</span><span>The curve: max share of your bag per 24 hours</span><span>Day 100 / 100%</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

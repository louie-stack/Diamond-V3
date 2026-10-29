"use client";

import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";
import SecHead from "./SecHead";

/**
 * Chapter one: the 100-day curve, as one real chart. X is the protocol's age,
 * Y is the share of your bag you may sell in a 24-hour window. The lime line is
 * $DIAMOND (Day N = N%); the red dashed line is any other launch (100% from
 * Day 1). The wedge between them is what the curve protects. A playhead walks
 * the days on its own and the chart can be dragged; JS writes --x / --y and the
 * readout text, CSS draws the rest.
 */

/* the plot runs Day 0 to Day 125; the last fifth is the "after Day 100" zone */
const SPAN = 125;
const END = 100 / SPAN;
const xOf = (d: number) => Math.min(d, SPAN) / SPAN;

/* the run: a beat on Day 1, one steady glide along the whole line to the end
   of the chart, a pause there, a blink, and again from Day 1 */
const REST = 1.4;
const RUN = 11.3;
const PAUSE = 2;
const RESET = 0.4;
const LOOP = REST + RUN + PAUSE + RESET;
const dayAt = (t: number) =>
  t < REST ? 1 : t < REST + RUN ? 1 + ((SPAN - 1) * (t - REST)) / RUN : t < REST + RUN + PAUSE ? SPAN : 1;

const RULES = [
  { k: "+1% every day", v: "Day 1 you can sell 1% of your bag. Day 2, 2%. Day 50, 50%. The same curve for every wallet." },
  { k: "One sell per 24 hours", v: "Each wallet runs its own 24-hour clock, so nobody unlocks at the same moment and nothing stacks up." },
  { k: "Day 100: fully free", v: "After Day 100 the limit is gone for good. No adjustable curve, no insider exemption, no hidden switch." },
];

export default function Curve() {
  const root = useRef<HTMLElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const dayEl = useRef<HTMLSpanElement>(null);
  const pctEl = useRef<HTMLSpanElement>(null);
  const protEl = useRef<HTMLSpanElement>(null);
  const bagEl = useRef<HTMLSpanElement>(null);
  const yEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pl = plot.current;
    if (!pl) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lit = pl.querySelector<HTMLElement>(".cv__sell--lit")!;
    const guard = pl.querySelector<HTMLElement>(".cv__prot--lit")!;
    let raf = 0, t = 0, last = 0, visible = false, held = false, resume = 0, lastDay = -1;

    const show = (d: number) => {
      const free = d > 100;
      const dc = free ? 100 : Math.max(1, d);
      const x = xOf(free ? d : dc);
      const p = Math.floor(dc + 1e-6);
      pl.style.setProperty("--x", x.toFixed(4));
      pl.style.setProperty("--y", (dc / 100).toFixed(4));
      // the lit wedges grow behind the playhead
      const X = (x * 100).toFixed(2);
      const Y = (100 - dc).toFixed(2);
      lit.style.clipPath = free
        ? `polygon(0 100%, ${END * 100}% 0, ${X}% 0, ${X}% 100%)`
        : `polygon(0 100%, ${X}% ${Y}%, ${X}% 100%)`;
      guard.style.clipPath = free
        ? `polygon(0 0, ${END * 100}% 0, 0 100%)`
        : `polygon(0 0, ${X}% 0, ${X}% ${Y}%, 0 100%)`;
      pl.style.setProperty("--line", `inset(0 ${(100 - x * 100).toFixed(2)}% 0 0)`);
      const day = free ? 101 : p;
      if (day === lastDay) return;
      const fwd = day > lastDay && lastDay !== -1;
      const was = pl.dataset.free === "1";
      lastDay = day;
      pl.dataset.free = free ? "1" : "0";
      pl.dataset.flip = x > 0.56 ? "1" : "0";
      if (dayEl.current) dayEl.current.textContent = free ? "100+" : String(p).padStart(3, "0");
      if (pctEl.current) pctEl.current.textContent = free ? "100%" : `${p}%`;
      if (yEl.current) yEl.current.textContent = free ? "100%" : `${p}%`;
      if (protEl.current) protEl.current.textContent = free ? "No limit. Sell any amount." : `${100 - p}% protected`;
      if (bagEl.current) bagEl.current.textContent = free ? "all of it" : (p * 10000).toLocaleString("en-US");
      if (!held && fwd && !free && p % 10 === 0) sfx.tick();
      if (!held && free && !was) sfx.ching();
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!held) {
        t = (t + dt) % LOOP;
        pl.dataset.reset = t > REST + RUN + PAUSE ? "1" : "0";
        show(dayAt(t));
      }
      if (visible) raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (raf || !visible || still) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // drag or hover the chart: the pointer is the day
    const at = (e: PointerEvent) => {
      const r = pl.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * SPAN;
    };
    const onMove = (e: PointerEvent) => {
      held = true;
      pl.dataset.held = "1";
      pl.dataset.reset = "0";
      clearTimeout(resume);
      const d = at(e);
      t = REST + ((Math.max(1, d) - 1) / (SPAN - 1)) * RUN;
      show(d);
    };
    const release = () => {
      clearTimeout(resume);
      resume = window.setTimeout(() => { held = false; pl.dataset.held = "0"; }, 1800);
    };
    pl.addEventListener("pointermove", onMove);
    pl.addEventListener("pointerdown", onMove);
    pl.addEventListener("pointerleave", release);
    pl.addEventListener("pointerup", release);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
    }, { threshold: 0.2 });
    io.observe(root.current!);

    show(still ? 40 : 1);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      pl.removeEventListener("pointermove", onMove);
      pl.removeEventListener("pointerdown", onMove);
      pl.removeEventListener("pointerleave", release);
      pl.removeEventListener("pointerup", release);
    };
  }, []);

  const E = END * 1000;
  return (
    <section ref={root} id="curve" className="sec bt-sec scroll-mt-16 overflow-hidden" aria-label="Chapter one. The 100-day curve.">
      <div className="wrap">
        <SecHead
          n="01"
          label="The 100-day curve"
          size="h-m"
          title={<>Sell 1% more every day.<br /><span className="text-[var(--lime)]">Free trade by Day 100.</span></>}
          aside={<>Your sell limit is a share of your bag.<br />It rises 1% a day for 100 days.<br />Drag the chart to pick a day.</>}
        />

        <figure className="cv mt-14 lg:mt-20" aria-label="Chart: the share of your bag you can sell each day rises from 1% on Day 1 to 100% on Day 100, then the limit disappears.">
          <div className="cv__head meta">
            <span>Max share of your bag you can sell, per 24 hours</span>
            <span className="cv__key">
              <span><b className="cv__sw cv__sw--lime" />$DIAMOND</span>
              <span><b className="cv__sw cv__sw--red" />Any other launch</span>
            </span>
          </div>

          <div className="cv__frame">
            {/* y axis */}
            <div className="cv__yaxis meta" aria-hidden="true">
              {[100, 75, 50, 25, 0].map((v) => <span key={v} style={{ top: `${100 - v}%` }}>{v}%</span>)}
            </div>

            <div ref={plot} className="cv__plot" data-free="0" data-flip="0" data-held="0" data-reset="0" aria-hidden="true">
              {[25, 50, 75].map((v) => <span key={v} className="cv__grid" style={{ top: `${100 - v}%` }} />)}
              <span className="cv__zone" style={{ left: `${END * 100}%` }}>
                <span className="cv__zone-k display">Free market</span>
                <span className="cv__zone-v meta">No limit. Forever.</span>
              </span>

              {/* the wedges: protected above the line, sellable below it */}
              <span className="cv__prot" />
              <span className="cv__prot cv__prot--lit" />
              <span className="cv__sell" />
              <span className="cv__sell cv__sell--lit" />
              <span className="cv__lbl cv__lbl--prot">
                <span className="display">Protected</span>
                <span className="meta">What a whale can&rsquo;t dump on you</span>
              </span>
              <span className="cv__lbl cv__lbl--sell">
                <span className="display">Sellable</span>
              </span>

              <svg className="cv__svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path className="cv__other" d={`M0 0 H${E}`} />
                <path className="cv__line" d={`M0 100 L${E} 0 H1000`} />
              </svg>
              <svg className="cv__svg cv__svg--lit" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path className="cv__line cv__line--lit" d={`M0 100 L${E} 0 H1000`} />
              </svg>

              <span className="cv__note cv__note--other meta">Any other launch: 100% from Day 1</span>

              {/* the playhead */}
              <span className="cv__vline" />
              <span className="cv__hline" />
              <span className="cv__ychip meta"><span ref={yEl}>1%</span></span>
              <span className="cv__dot" />
              <span className="cv__card">
                <span className="meta cv__card-k">Day <span ref={dayEl} className="tabular-nums">001</span></span>
                <span className="display cv__card-n tabular-nums"><span ref={pctEl}>1%</span></span>
                <span className="cv__card-s">of your bag can be sold today</span>
                <span className="meta cv__card-p"><span ref={protEl}>99% protected</span></span>
                <span className="meta cv__card-b">On a 1M bag: <span ref={bagEl} className="tabular-nums text-[var(--bone)]">10,000</span></span>
              </span>
            </div>

            {/* x axis */}
            <div className="cv__xaxis meta" aria-hidden="true">
              {[1, 25, 50, 75, 100].map((d) => <span key={d} style={{ left: `${xOf(d) * 100}%` }}>Day {d}</span>)}
              <span className="cv__xaxis-after" style={{ left: `${((END + 1) / 2) * 100}%` }}>After</span>
            </div>
          </div>
        </figure>

        <ol className="cv__rules">
          {RULES.map((r, i) => (
            <li key={r.k}>
              <span className="meta cv__rule-n">0{i + 1}</span>
              <p className="display cv__rule-k">{r.k}</p>
              <p className="cv__rule-v">{r.v}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

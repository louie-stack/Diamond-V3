"use client";

import { useEffect, useRef } from "react";
import { Idx } from "./SecHead";
import Rip from "./Rip";
import { sfx } from "@/lib/sfx";

/* ---------------------------------------------------------------- */
/* The chart: the tape the detective replays                          */
/* ---------------------------------------------------------------- */
type Candle = { x: number; o: number; c: number; h: number; l: number; v: number };
const TOP = 70;
const BOT = 590;
function chart(seed: number, n: number, from: number, to: number, x0: number, step: number): Candle[] {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const rise = Math.abs(to - from) / n;
  const out: Candle[] = [];
  let price = from;
  for (let i = 0; i < n; i++) {
    const o = price;
    const down = rnd() < 0.24;
    const c = down ? o + 8 + rnd() * 20 : o - rise * (0.95 + rnd() * 0.9);
    out.push({ x: x0 + i * step, o, c, h: Math.min(o, c) - 5 - rnd() * 14, l: Math.max(o, c) + 5 + rnd() * 14, v: 0.25 + rnd() * 0.75 });
    price = c;
  }
  return out;
}
const A = chart(7, 24, 560, 150, 90, 48);
const B = chart(23, 24, 560, 80, 90, 48); // climbs as high as the first
const yToPrice = (y: number) => 0.0002 + ((BOT - y) / (BOT - TOP)) * 0.0098;

/** where each candle of the first chart flies when the whale hits (deterministic) */
const SCATTER = A.map((_, i) => {
  const f = (k: number) => Math.abs((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1);
  return { dx: (f(1) - 0.5) * 140, dy: 160 + f(2) * 220, rot: (f(3) - 0.5) * 160 };
});

function Candles({ data, cls, scatter }: { data: Candle[]; cls: string; scatter?: boolean }) {
  return (
    <g className={cls}>
      {data.map((d, i) => {
        const up = d.c < d.o;
        const col = up ? "var(--lime)" : "var(--red)";
        const sc = scatter ? SCATTER[i] : null;
        return (
          <g
            key={i}
            className="cndl"
            style={{
              ["--i" as string]: i,
              ["--j" as string]: data.length - i,
              ...(sc ? { ["--dx" as string]: `${sc.dx.toFixed(1)}px`, ["--dy" as string]: `${sc.dy.toFixed(1)}px`, ["--rot" as string]: `${sc.rot.toFixed(1)}deg` } : {}),
            }}
          >
            <line x1={d.x} x2={d.x} y1={d.h} y2={d.l} stroke={col} strokeWidth="2" />
            <rect x={d.x - 13} y={Math.min(d.o, d.c)} width="26" height={Math.max(4, Math.abs(d.o - d.c))} fill={col} />
            <rect x={d.x - 13} y={680 - d.v * 60} width="26" height={d.v * 60} fill={col} opacity="0.22" />
          </g>
        );
      })}
    </g>
  );
}

/* price readout per step: [price, the base it is measured from] */
const pA = yToPrice(A[A.length - 1].c);
const pB0 = yToPrice(B[0].o);
const pB = yToPrice(B[B.length - 1].c);
const PRICES: [number, number][] = [
  [yToPrice(A[0].o), yToPrice(A[0].o)],
  [pA, yToPrice(A[0].o)],
  [pA * 0.08, pA],
  [pB * 0.99, pB0],
  [pB * 0.99, pB0],
];

/* ---------------------------------------------------------------- */
/* The scene: Louie's crime-scene plate, shot like a film             */
/* ---------------------------------------------------------------- */
const PLATE = { w: 1600, h: 900 };

/** camera per step: focus point on the plate (0..1), zoom, where the focus lands in the frame (0..1) */
type Shot = { px: number; py: number; s: number; vx: number; vy: number };
const SHOTS: Shot[] = [
  { px: 0.5, py: 0.5, s: 1.04, vx: 0.5, vy: 0.5 }, // the scene, sealed
  { px: 0.2, py: 0.5, s: 1.35, vx: 0.4, vy: 0.42 }, // the pump candles and exhibit 01
  { px: 0.55, py: 0.6, s: 1.06, vx: 0.5, vy: 0.6 }, // the whale candle, the body, the rug, clear of the monitor
  { px: 0.5, py: 0.5, s: 1.0, vx: 0.5, vy: 0.5 }, // pulled back for the replay
  { px: 0.5, py: 0.5, s: 1.0, vx: 0.5, vy: 0.5 },
];
const SHOTS_PHONE: Shot[] = [
  { px: 0.56, py: 0.5, s: 1.0, vx: 0.5, vy: 0.5 },
  { px: 0.17, py: 0.47, s: 1.25, vx: 0.28, vy: 0.5 },
  { px: 0.475, py: 0.7, s: 1.08, vx: 0.22, vy: 0.66 },
  { px: 0.5, py: 0.5, s: 1.0, vx: 0.5, vy: 0.5 },
  { px: 0.5, py: 0.5, s: 1.0, vx: 0.5, vy: 0.5 },
];

/** the numbered tents already standing in the painting */
const EXHIBITS = [
  { n: "01", x: 0.149, y: 0.655, side: "r", label: "The promise", note: "“Hold the line.” Signed: nobody." },
  { n: "02", x: 0.475, y: 0.78, side: "l", label: "The chart", note: "−92% in a single candle." },
  { n: "03", x: 0.755, y: 0.7, side: "l", label: "One wallet", note: "12.7% of supply. One click." },
  { n: "04", x: 0.89, y: 0.575, side: "l", label: "The rug", note: "Pulled. Community left holding it." },
];

const LOG = ["Case opened", "The promise", "The dump", "The rule", "The verdict"];

/**
 * Chapter one, staged as a crime-scene reconstruction. A tall track with a
 * sticky stage. Scroll sets data-step (0 to 4); every visual state lives in
 * CSS. JS only aims the camera, types the captions and runs the price.
 *   0  the scene, sealed        1  the promise, the pump
 *   2  the whale, the body      3  the replay with the day-1 limit
 *   4  the verdict
 */
export default function Crime() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const cam = useRef<HTMLDivElement>(null);
  const price = useRef<HTMLSpanElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const tc = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const st = stage.current;
    const fm = film.current;
    const cm = cam.current;
    if (!st || !fm || !cm) return;
    let step = -1;
    let priceRaf = 0;
    let typeTimer = 0;
    let tcTimer = 0;
    let sfxTimer = 0;
    let shown = PRICES[0][0];
    let frames = 14 * 3600 + 7 * 60; // the tape starts mid-roll

    /* --- camera: cover the frame with the plate, then frame the shot --- */
    const marks = Array.from(fm.querySelectorAll<HTMLElement>(".cr-mark"));
    const aim = (n: number) => {
      const W = fm.clientWidth;
      const H = fm.clientHeight;
      const cover = Math.max(W / PLATE.w, H / PLATE.h);
      const w = PLATE.w * cover;
      const h = PLATE.h * cover;
      const shot = (W < 640 ? SHOTS_PHONE : SHOTS)[n];
      const s = shot.s;
      const tx = Math.min(0, Math.max(W - w * s, shot.vx * W - shot.px * w * s));
      const ty = Math.min(0, Math.max(H - h * s, shot.vy * H - shot.py * h * s));
      cm.style.width = `${w}px`;
      cm.style.height = `${h}px`;
      cm.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s})`;
      marks.forEach((m, i) => {
        const e = EXHIBITS[i];
        m.style.setProperty("--k", (cover * s).toFixed(3));
        m.style.transform = `translate3d(${(tx + e.x * w * s).toFixed(1)}px, ${(ty + e.y * h * s).toFixed(1)}px, 0)`;
      });
    };

    /* --- price tape --- */
    const paint = (p: number, base: number) => {
      shown = p;
      if (price.current) price.current.textContent = `$${p.toFixed(4)}`;
      if (pct.current) {
        const ch = (p / base - 1) * 100;
        pct.current.textContent = `${ch >= 0 ? "+" : "−"}${Math.abs(ch).toFixed(1)}%`;
        pct.current.style.color = ch >= 0 ? "var(--lime)" : "var(--red)";
      }
    };
    const animatePrice = (n: number) => {
      cancelAnimationFrame(priceRaf);
      const [to, base] = PRICES[n];
      const from = shown;
      const t0 = performance.now() + (n === 3 ? 700 : 0);
      const dur = n === 2 ? 700 : 1500;
      const f = (t: number) => {
        const k = Math.min(1, Math.max(0, (t - t0) / dur));
        const e = n === 2 ? k * k : 1 - Math.pow(1 - k, 3);
        paint(from + (to - from) * e, base);
        if (k < 1) priceRaf = requestAnimationFrame(f);
      };
      priceRaf = requestAnimationFrame(f);
    };

    /* --- captions type out like a transcript --- */
    const typeAct = (n: number, instant: boolean) => {
      clearInterval(typeTimer);
      const spans = Array.from(st.querySelectorAll<HTMLElement>(`.cr-act${n} .ty`));
      if (instant) {
        spans.forEach((s) => (s.textContent = s.dataset.text || ""));
        return;
      }
      spans.forEach((s) => (s.textContent = ""));
      let si = 0;
      let ci = 0;
      typeTimer = window.setInterval(() => {
        const s = spans[si];
        if (!s) return clearInterval(typeTimer);
        const text = s.dataset.text || "";
        ci += 2;
        s.textContent = text.slice(0, ci);
        if (ci >= text.length) {
          si++;
          ci = 0;
        }
      }, 28);
    };

    /* --- timecode, only while the stage is on screen --- */
    const pad = (v: number) => String(v).padStart(2, "0");
    const runTc = (on: boolean) => {
      if (on && !tcTimer) {
        tcTimer = window.setInterval(() => {
          frames++;
          const f = frames % 25;
          const sec = Math.floor(frames / 25);
          if (tc.current) tc.current.textContent = `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}:${pad(f)}`;
        }, 40);
      } else if (!on && tcTimer) {
        clearInterval(tcTimer);
        tcTimer = 0;
      }
    };

    const setStep = (n: number) => {
      if (n === step) return;
      const back = n < step;
      step = n;
      st.dataset.step = String(n);
      aim(n);
      if (n >= 1 && n <= 3) typeAct(n, back);
      animatePrice(n);
      clearTimeout(sfxTimer);
      if (!back && n === 2) sfxTimer = window.setTimeout(() => sfx.thud(), 420);
      if (!back && n === 3) sfxTimer = window.setTimeout(() => sfx.buzz(), 2700);
    };

    const check = () => {
      const el = track.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      runTc(r.top < window.innerHeight && r.bottom > 0);
      const p = -r.top / Math.max(1, el.offsetHeight - window.innerHeight);
      setStep(Math.min(4, Math.max(0, Math.floor(p * 5 + 0.35))));
    };
    const resize = () => {
      // re-aim without animating, so a resize never sweeps the camera
      st.classList.add("is-sizing");
      aim(Math.max(0, step));
      requestAnimationFrame(() => st.classList.remove("is-sizing"));
      check();
    };

    paint(PRICES[0][0], PRICES[0][1]);
    st.classList.add("is-sizing");
    check();
    requestAnimationFrame(() => st.classList.remove("is-sizing"));
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(priceRaf);
      clearInterval(typeTimer);
      clearInterval(tcTimer);
      clearTimeout(sfxTimer);
    };
  }, []);

  const lastA = A[A.length - 1];
  const lastB = B[B.length - 1];
  const whaleX = lastA.x + 48;
  const whale2X = lastB.x + 48;
  const FLOOR = lastB.c + 44;
  const whaleH = 610 - (lastA.c - 20);
  const tapeRow = Array.from({ length: 8 }, () => "Crime scene · Do not cross · Case #1027");

  return (
    <section ref={track} className="crime" aria-label="Chapter one. The crime.">
      <div ref={stage} className="crime__stage" data-step="0">
        <div className="cr-frame">
          <div className="wrap relative z-[3] pt-[100px]">
            <Idx n="01" label="The crime" />
          </div>

          {/* the film: a widescreen frame over the scene */}
          <div ref={film} className="cr-film" aria-hidden="true">
            <div className="cr-shake">
              <div ref={cam} className="cr-cam">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/case/crime-scene.webp" alt="" draggable={false} />
              </div>
              <div className="cr-grade" />
              <div className="cr-siren" />

              {EXHIBITS.map((e) => (
                <div key={e.n} className={`cr-mark cr-mark--${e.side}`} data-ex={e.n}>
                  <span className="cr-mark__ring" />
                  <span className="cr-mark__line" />
                  <span className="cr-mark__tag">
                    <span className="cr-mark__n">Exhibit {e.n} · {e.label}</span>
                    <span className="cr-mark__note">{e.note}</span>
                  </span>
                </div>
              ))}

              <div className="cr-flash" />
            </div>

            {/* the scene is sealed until you scroll in */}
            <div className="cr-tape cr-tape--a">
              <div className="tape__track">{[...tapeRow, ...tapeRow].map((t, i) => <span key={i}>{t}</span>)}</div>
            </div>
            <div className="cr-tape cr-tape--b">
              <div className="tape__track tape__track--rev">{[...tapeRow, ...tapeRow].map((t, i) => <span key={i}>{t}</span>)}</div>
            </div>

            {/* the tape, replayed */}
            <div className="cr-pip">
              <div className="cr-pip__bar">
                <span className="meta cr-pip__lbl">
                  <span className="cr-pip__t1">Exhibit A<span className="cr-lg"> · Price action · Tape 1</span></span>
                  <span className="cr-pip__t2">Tape 2<span className="cr-lg"> · Same chart, with <span className="text-[var(--lime)]">$DIAMOND</span></span></span>
                </span>
                <span className="cr-pip__read">
                  <span ref={price} className="display cr-price tabular-nums">$0.0000</span>
                  <span ref={pct} className="term cr-pct tabular-nums">+0.0%</span>
                </span>
              </div>
              <svg className="cr-chart" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <g>
                  {[110, 230, 350, 470, 590].map((y) => (
                    <g key={y}>
                      <line x1="40" x2="1440" y1={y} y2={y} stroke="rgba(236,230,214,0.08)" />
                      <text x="1460" y={y + 5} fontSize="17" fill="rgba(236,230,214,0.4)" fontFamily="var(--font-term)">{yToPrice(y).toFixed(4)}</text>
                    </g>
                  ))}
                  <line x1="40" x2="1440" y1="682" y2="682" stroke="rgba(236,230,214,0.18)" />
                </g>

                <Candles data={A} cls="c1" scatter />
                <rect className="cr-whale" x={whaleX - 16} y={lastA.c - 20} width="32" height={whaleH} fill="var(--red)" />

                <g className="cr-floor">
                  <line x1={lastB.x - 300} x2={whale2X + 120} y1={FLOOR} y2={FLOOR} stroke="var(--lime)" strokeWidth="2.5" strokeDasharray="10 7" />
                  <text x={whale2X + 132} y={FLOOR + 6} fontSize="19" fill="var(--lime)" fontFamily="var(--font-term)" letterSpacing="2">DAY 1: 1%</text>
                </g>
                <Candles data={B} cls="c2" />
                <rect className="cr-whale2" x={whale2X - 16} y={lastB.c} width="32" height="380" fill="var(--red)" />
                <g className="cr-denied">
                  <g transform={`rotate(-7 ${whale2X} ${FLOOR + 62})`}>
                    <rect x={whale2X - 86} y={FLOOR + 38} width="172" height="48" fill="none" stroke="var(--red)" strokeWidth="4" />
                    <text x={whale2X} y={FLOOR + 72} textAnchor="middle" fontSize="28" fontWeight="900" fill="var(--red)" fontFamily="var(--font-display)" letterSpacing="3">DENIED</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* rewind, between the crime and the replay */}
            <div className="cr-rew">
              <span className="display">&#9664;&#9664; Rewind</span>
            </div>

            {/* camera chrome */}
            <div className="cr-chrome">
              <span className="cr-corner cr-corner--tl" />
              <span className="cr-corner cr-corner--tr" />
              <span className="cr-corner cr-corner--bl" />
              <span className="cr-corner cr-corner--br" />
              <span className="meta cr-slate">
                <span className="cr-rec" /> Rec <span ref={tc} className="tabular-nums">00:14:07:00</span>
                <span className="cr-slate__case">Case #1027 · Scene reconstruction</span>
              </span>
              <span className="meta cr-cam-id">
                <span className="cr-cam-id__a">Cam 01 · The scene</span>
                <span className="cr-cam-id__b">Cam 01 · Exhibit 01</span>
                <span className="cr-cam-id__c">Cam 02 · Exhibits 02 to 04</span>
                <span className="cr-cam-id__d">Playback · Tape 2</span>
              </span>
            </div>
          </div>

          {/* the caption band under the film */}
          <div className="cr-band">
            <div className="cr-acts">
              <div className="cr-act cr-act0">
                <h2 className="display cr-title">
                  Diamond hands aren&apos;t just a promise <span className="text-[var(--lime)]">anymore.</span>
                </h2>
                <p className="term cr-k">Same story. Every chart. Every cycle. Until now.</p>
              </div>
              <div className="cr-act cr-act1">
                <p className="term cr-k">
                  <span className="ty" data-text="Every memecoin tells holders the same thing:" />
                </p>
                <p className="term cr-head">
                  <span className="ty" data-text="Don't jeet. Don't dump. " />
                  <span className="ty text-[var(--lime)]" data-text="Hold the line." />
                  <span className="caret" />
                </p>
              </div>
              <div className="cr-act cr-act2">
                <p className="term cr-head">
                  <span className="ty" data-text="Then one whale hits sell and nukes the chart." />
                  <span className="caret caret--red" />
                </p>
                <p className="term cr-k !text-[var(--red)]">
                  <span className="ty" data-text="Narrator: they did not hold the line." />
                </p>
              </div>
              <div className="cr-act cr-act3">
                <p className="term cr-head">
                  <span className="ty text-[var(--lime)]" data-text="$DIAMOND" />
                  <span className="ty" data-text=" changes the rules." />
                  <span className="caret" />
                </p>
                <p className="term cr-k">
                  <span className="ty" data-text="Instead of asking people to have diamond hands, the mechanism is built directly into the token." />
                </p>
              </div>
              <div className="cr-act cr-act4">
                <p className="display cr-final__line">
                  Buy as much as you want. Sell from day one.
                  <br />
                  <span className="text-[var(--red)]">But while the market is young, no wallet can dump its entire bag at once.</span>
                </p>
                <div className="cr-verdict">
                  {["No promises.", "No pinky swears.", "No “trust the whales.”"].map((t) => (
                    <span key={t} className="term text-[15px] uppercase tracking-[0.06em] text-[var(--bone)]/55">
                      <span className="strike">{t}</span>
                    </span>
                  ))}
                  <span className="cr-code inline-flex items-center gap-3 bg-[var(--lime)] px-4 py-2 text-[var(--ink)]">
                    <span className="term text-[14px]">&gt;</span>
                    <span className="display text-[28px] leading-none">Just code.</span>
                  </span>
                </div>
              </div>
            </div>

            {/* case log: where you are in the story */}
            <ol className="cr-log meta" aria-hidden="true">
              {LOG.map((t, i) => (
                <li key={t} data-n={i}>
                  <span className="cr-log__n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cr-log__t">{t}</span>
                  <span className="cr-log__bar" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      {/* the section's own torn bottom edge, laid over the next section */}
      <Rip color="var(--night)" fiber="#3d4034" seed={29} className="rip--bottom" />
    </section>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { sfx } from "@/lib/sfx";
import { createBurnGL, type BurnGL } from "./burn-gl";
import { paintWords } from "./paint";

/** px per field cell (the shader adds fine detail on top) */
const CELL = 4;
/** where the match touches the paper, as a fraction of the sheet width */
const IGNITE = 0.8;
const TILT = (-0.8 * Math.PI) / 180;
/** room around the sheet for the shadow (and flames) the fire draws */
const MARGIN = 170;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; smoke: boolean };

/**
 * The front page, plus a match nobody mentions. Strike it on the bottom edge and the page
 * burns away to a ransom note glued to the wall behind. Leave the section and a fresh copy
 * is pinned back up.
 */
export default function BurnPaper({ children }: { children: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const match = useRef<HTMLButtonElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  const api = useRef<{ strike: () => void }>({ strike: () => {} });

  useEffect(() => {
    const sh = sheet.current, art = paper.current, fc = fx.current, m = match.current, wl = wall.current;
    if (!sh || !art || !fc || !m || !wl) return;
    const section = sh.closest<HTMLElement>(".press");
    let phase: "idle" | "lit" | "burnt" = "idle";
    let visible = true;
    let raf = 0;
    let tl: gsap.core.Timeline | null = null;
    let words: HTMLCanvasElement | null = null;
    let fire: BurnGL | null = null;
    let glc: HTMLCanvasElement | null = null;
    const sparks: Spark[] = [];

    // paint the words on the wall ahead of time, once the display face has loaded
    const prep = () => {
      if (words) return;
      words = paintWords(wl);
      wl.appendChild(words);
    };
    const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1500));
    let alive = true;
    document.fonts.ready.then(() => idle(() => alive && prep()));

    const rest = () => {
      gsap.set(m, { clearProps: "transform,opacity" });
      m.classList.remove("is-lit", "is-up");
      const flame = m.querySelector<HTMLElement>(".match__flame");
      if (flame) flame.style.rotate = "";
    };

    const dropFire = () => {
      fire?.destroy();
      fire = null;
      glc?.remove();
      glc = null;
    };

    const reset = () => {
      cancelAnimationFrame(raf);
      tl?.kill();
      sparks.length = 0;
      dropFire();
      art.style.visibility = "";
      gsap.set(art, { clearProps: "opacity,filter" });
      art.style.boxShadow = "";
      wl.classList.remove("is-on");
      fc.getContext("2d")?.clearRect(0, 0, fc.width, fc.height);
      rest();
      phase = "idle";
      // a fresh copy, pinned back up
      gsap.fromTo(sh, { y: -36, rotation: 1.6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: "back.out(1.3)", delay: 0.05, clearProps: "transform,opacity" });
    };

    /** what the hole shows: the clippings wall, its wash and the painted words, in the sheet's own (tilted) coordinates */
    const paintBehind = (W: number, H: number, dpr: number) => {
      const c = document.createElement("canvas");
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      const x = c.getContext("2d")!;
      const ar = art.getBoundingClientRect();
      const cx = ar.left + ar.width / 2, cy = ar.top + ar.height / 2;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.translate(W / 2, H / 2);
      x.rotate(-TILT);
      x.translate(-cx, -cy);
      const bg = section?.querySelector<HTMLElement>(".press__bg");
      const img = bg?.querySelector<HTMLImageElement>("img");
      if (bg && img && img.naturalWidth) {
        const r = bg.getBoundingClientRect();
        x.fillStyle = "#15130d";
        x.fillRect(r.left, r.top, r.width, r.height);
        const s = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
        const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
        x.drawImage(img, r.left + (r.width - iw) / 2, r.top + (r.height - ih) / 2, iw, ih);
        // the same dark wash the wall has (.press__shade), so the hole matches the wall around it
        const sr = section?.querySelector<HTMLElement>(".press__shade")?.getBoundingClientRect() ?? r;
        x.save();
        x.translate(sr.left + sr.width / 2, sr.top + sr.height / 2);
        x.scale(sr.width * 0.5, sr.height * 0.55);
        const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, "rgba(10,9,6,0.9)");
        g.addColorStop(0.6, "rgba(10,9,6,0.74)");
        g.addColorStop(1, "rgba(10,9,6,0.7)");
        x.fillStyle = g;
        x.fillRect(-1 / 0.5, -1 / 0.55, 2 / 0.5, 2 / 0.55);
        x.restore();
      }
      if (words) {
        const r = words.getBoundingClientRect();
        x.drawImage(words, r.left, r.top, r.width, r.height);
      }
      return c;
    };

    const burn = () => {
      const W = art.offsetWidth, H = art.offsetHeight;
      const cols = Math.ceil(W / CELL) + 1, rows = Math.ceil(H / CELL) + 1;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);

      // how far the fire travels to reach each point, roughened so it eats unevenly
      const T = new Float32Array(cols * rows);
      const ix = IGNITE * W;
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j < rows; j++) {
        const py = j * CELL;
        for (let i = 0; i < cols; i++) {
          const px = i * CELL;
          const dx = (px - ix) * 0.82, dy = H - py;
          const v = Math.sqrt(dx * dx + dy * dy) + (fbm(px / 210, py / 210) - 0.5) * 520 + (fbm(px / 38 + 9, py / 38) - 0.5) * 90;
          T[j * cols + i] = v;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }

      glc = document.createElement("canvas");
      glc.className = "burn__gl";
      glc.setAttribute("aria-hidden", "true");
      glc.style.inset = `${-MARGIN}px`;
      glc.style.width = `calc(100% + ${MARGIN * 2}px)`;
      glc.style.height = `calc(100% + ${MARGIN * 2}px)`;
      art.appendChild(glc);
      fire = createBurnGL(glc, { w: W, h: H, dpr, margin: MARGIN }, { data: T, cols, rows, cell: CELL }, paintBehind(W, H, dpr));

      // effects layer: firelight, sparks, smoke
      const fr = fc.getBoundingClientRect();
      const fdpr = Math.min(2, window.devicePixelRatio || 1);
      fc.width = Math.round(fr.width * fdpr);
      fc.height = Math.round(fr.height * fdpr);
      const fxx = fc.getContext("2d")!;
      const ar = art.getBoundingClientRect();
      const ox = ar.left + ar.width / 2 - fr.left, oy = ar.top + ar.height / 2 - fr.top;
      const cos = Math.cos(TILT), sin = Math.sin(TILT);
      const toFx = (x: number, y: number): [number, number] => {
        const lx = x - W / 2, ly = y - H / 2;
        return [ox + lx * cos - ly * sin, oy + lx * sin + ly * cos];
      };

      const DUR = 4.2;
      const prog = { f: lo - 20 };
      const end = hi + 60;
      // the words only exist once the fire starts (the sheet fades in on scroll, so they'd show through)
      wl.classList.add("is-on");
      // the fire draws the sheet's shadow from here on, so it burns away with the paper
      if (fire) {
        fire.frame(prog.f, 0);
        art.style.boxShadow = "none";
      }
      sfx.crackle(DUR + 0.4);
      tl = gsap.timeline();
      tl.to(prog, { f: end, duration: DUR, ease: "power1.in" });

      if (!fire) {
        // no WebGL2: the page simply chars and fades
        gsap.to(art, { opacity: 0, filter: "sepia(1) brightness(0.3)", duration: DUR, ease: "power1.in" });
      }

      const t0 = performance.now();
      let last = t0;
      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const F = prog.f;
        fire?.frame(F, (now - t0) / 1000);

        // sample the front for sparks and the firelight
        let sx = 0, sy = 0, n = 0;
        const front: number[] = [];
        for (let k = 0; k < T.length; k += 3) {
          if (Math.abs(T[k] - F) < 5) {
            const i = k % cols, j = (k - i) / cols;
            sx += i;
            sy += j;
            n++;
            if (front.length < 600) front.push(i, j);
          }
        }
        for (let s = 0; s < 5 && front.length; s++) {
          if (Math.random() > 0.75) continue;
          const q = Math.floor(Math.random() * (front.length / 2)) * 2;
          const [x, y] = toFx(front[q] * CELL, front[q + 1] * CELL);
          const smoke = Math.random() < 0.3;
          sparks.push({
            x, y,
            vx: (Math.random() - 0.5) * (smoke ? 18 : 60),
            vy: smoke ? -26 - Math.random() * 30 : -70 - Math.random() * 150,
            life: 0,
            max: smoke ? 1.8 + Math.random() * 1.6 : 0.5 + Math.random() * 1.0,
            r: smoke ? 16 + Math.random() * 22 : 0.6 + Math.random() * 1.3,
            smoke,
          });
        }
        fxx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
        fxx.clearRect(0, 0, fr.width, fr.height);
        if (n > 0) {
          const [gx, gy] = toFx((sx / n) * CELL, (sy / n) * CELL);
          const f = 0.82 + 0.18 * Math.sin(now / 70) * Math.sin(now / 113);
          const rad = 300 + Math.min(1, n / 400) * 360;
          const gr = fxx.createRadialGradient(gx, gy, 0, gx, gy, rad);
          gr.addColorStop(0, `rgba(255,130,40,${0.2 * f})`);
          gr.addColorStop(1, "rgba(255,90,20,0)");
          fxx.fillStyle = gr;
          fxx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
        }
        for (let s = sparks.length - 1; s >= 0; s--) {
          const p = sparks[s];
          p.life += dt;
          if (p.life > p.max) {
            sparks.splice(s, 1);
            continue;
          }
          const k = p.life / p.max;
          p.x += p.vx * dt + (p.smoke ? Math.sin(now / 400 + s) * 0.3 : Math.sin(now / 60 + s * 7) * 0.6);
          p.y += p.vy * dt;
          if (!p.smoke) p.vy *= 0.995;
          if (p.smoke) {
            const rr = p.r * (1 + k * 2);
            const sg = fxx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
            sg.addColorStop(0, `rgba(150,140,125,${0.13 * Math.sin(k * Math.PI)})`);
            sg.addColorStop(1, "rgba(150,140,125,0)");
            fxx.fillStyle = sg;
            fxx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
          } else {
            const g = Math.round(210 - 130 * k);
            fxx.shadowColor = `rgba(255,140,40,${1 - k})`;
            fxx.shadowBlur = 6;
            fxx.fillStyle = `rgba(255,${g},${Math.round(90 - 70 * k)},${1 - k * k})`;
            fxx.beginPath();
            fxx.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, Math.PI * 2);
            fxx.fill();
            fxx.shadowBlur = 0;
          }
        }

        if (F < end || sparks.length) raf = requestAnimationFrame(frame);
        else {
          phase = "burnt";
          art.style.visibility = "hidden";
          dropFire();
          if (!visible) reset();
        }
        if (F >= end && art.style.visibility !== "hidden") {
          art.style.visibility = "hidden";
          dropFire();
        }
      };
      raf = requestAnimationFrame(frame);
    };

    api.current.strike = () => {
      if (phase !== "idle") return;
      phase = "lit";
      prep();
      const W = art.offsetWidth, H = art.offsetHeight;
      // the paper's bottom edge, tilted with the sheet
      const edge = (x: number) => H - (x - W / 2) * Math.tan(-TILT) - 1;
      // the match is positioned by its head; move the head along the edge
      const r0 = { x: m.offsetLeft + m.offsetWidth - 5, y: m.offsetTop + m.offsetHeight / 2 };
      const at = (x: number, y: number) => ({ x: x - r0.x, y: y - r0.y });
      const a = at(W * 0.97, edge(W * 0.97) + 3);
      const b = at(W * (IGNITE + 0.02), edge(W * (IGNITE + 0.02)) + 3);
      const c = at(W * IGNITE, edge(W * IGNITE) - 2);
      const flame = m.querySelector<HTMLElement>(".match__flame");
      // the flame burns upward whatever angle the match is held at
      tl = gsap.timeline({ onUpdate: () => flame && (flame.style.rotate = `${-Number(gsap.getProperty(m, "rotation"))}deg`) });
      tl.add(() => m.classList.add("is-up"))
        .to(m, { x: a.x, y: a.y + 18, rotation: 132, duration: 0.42, ease: "power3.out" })
        .to(m, { y: a.y, duration: 0.12, ease: "power2.in" })
        .add(() => sfx.strike())
        .to(m, { x: b.x, y: b.y, duration: 0.26, ease: "power2.in", onUpdate: () => scrape(sh, r0.x + Number(gsap.getProperty(m, "x")), r0.y + Number(gsap.getProperty(m, "y"))) })
        .add(() => m.classList.add("is-lit"))
        .to(m, { x: b.x - 6, y: b.y - 34, rotation: 120, duration: 0.5, ease: "power2.out" })
        .to(m, { x: c.x, y: c.y, rotation: 128, duration: 0.4, ease: "power2.inOut" })
        .add(burn, "+=0.15")
        .to(m, { y: c.y + 120, x: c.x + 40, rotation: 220, opacity: 0, duration: 0.9, ease: "power2.in" }, "+=0.25");
    };

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (!visible && phase === "burnt") reset();
    });
    io.observe(sh);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      tl?.kill();
      dropFire();
      alive = false;
      words?.remove();
      words = null;
    };
  }, []);

  return (
    <div className="burn">
      {/* painted on the wall behind the page, found when it burns */}
      <div ref={wall} className="burn__wall" aria-hidden="true" />
      <div ref={sheet} className="burn__sheet">
        <article ref={paper} className="paper" data-fx="rise">
          {children}
        </article>
        <button ref={match} type="button" className="match" aria-label="Strike the match" onClick={() => api.current.strike()}>
          <span className="match__flame" aria-hidden="true" />
        </button>
      </div>
      <canvas ref={fx} className="burn__fx" aria-hidden="true" />
    </div>
  );
}

/** a few sparks off the striking surface, at the match head (sheet coordinates) */
function scrape(host: HTMLElement, x: number, y: number) {
  if (Math.random() > 0.65) return;
  const s = document.createElement("i");
  s.className = "match__spark";
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  s.style.setProperty("--dx", `${(Math.random() - 0.2) * 60}px`);
  s.style.setProperty("--dy", `${-12 - Math.random() * 46}px`);
  host.appendChild(s);
  setTimeout(() => s.remove(), 600);
}

function hash(x: number, y: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return s / 0.9375;
}

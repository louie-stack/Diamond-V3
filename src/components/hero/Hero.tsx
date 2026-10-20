"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { LINKS } from "@/content";
import { createGlass, type Glass } from "./glass";

const KEY_ART = "/art/case/wanted-hq.webp";
/** desktop design width: the layout as approved at 110% zoom on a 1440 screen */
const DESIGN_W = 1309;
const LOGLINE = "What happens when jeeting is prohibited by smart contract?";
/** the same fit as the effect below, inlined so it runs while the page is still loading */
const FIT_NOW = `(function(){var el=document.currentScript&&document.currentScript.parentElement;if(!el||innerWidth<1024)return;var z=innerWidth/${DESIGN_W};el.classList.add("is-locked");el.style.zoom=String(z);el.style.width="${DESIGN_W}px";el.style.height=(innerHeight/z)+"px";})();`;

/** One screen. The detective, through a rain-streaked window. */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLImageElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const typed = useRef<HTMLSpanElement>(null);
  const rest = useRef<HTMLSpanElement>(null);

  // lock the layout on desktop: one fixed design, zoomed to fit the width
  useEffect(() => {
    const fit = () => {
      const el = stage.current;
      if (!el) return;
      if (window.innerWidth >= 1024) {
        const z = window.innerWidth / DESIGN_W;
        el.classList.add("is-locked");
        el.style.zoom = String(z);
        el.style.width = `${DESIGN_W}px`;
        el.style.height = `${window.innerHeight / z}px`;
      } else {
        el.classList.remove("is-locked");
        el.style.zoom = "";
        el.style.width = "";
        el.style.height = "";
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // the glass
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    let glass: Glass | null = null;
    let raf = 0;
    let alive = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = { zoom: 1.16, flash: 0, par: [0, 0] as [number, number], tp: [0, 0], visible: true };
    let nextBolt = performance.now() + 2600;
    let last = { x: -1, y: -1 };

    const img = new Image();
    img.decoding = "async";
    img.src = KEY_ART;
    img.onload = () => {
      if (!alive) return;
      // phones: a thinner fog, so the character reads on a small screen (desktop keeps the defaults)
      glass = createGlass(cv, img, window.innerWidth < 768 ? { rain: 0.6, fogDetail: 2 } : undefined);
      if (!glass) return;
      cv.style.opacity = "1";
      if (fallback.current) fallback.current.style.opacity = "0";
      gsap.to(state, { zoom: 1.04, duration: 3.2, ease: "expo.out", delay: openDelay() });
      const t0 = performance.now();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (!state.visible || !glass) return;
        const vh = window.innerHeight;
        const clear = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85)));
        if (!reduce && now > nextBolt && clear < 0.5) {
          gsap.fromTo(state, { flash: 1 }, { flash: 0, duration: 0.9, ease: "expo.out" });
          gsap.delayedCall(0.12, () => gsap.fromTo(state, { flash: 0.6 }, { flash: 0, duration: 0.6, ease: "expo.out" }));
          nextBolt = now + 6000 + Math.random() * 7000;
        }
        state.par[0] += (state.tp[0] - state.par[0]) * 0.05;
        state.par[1] += (state.tp[1] - state.par[1]) * 0.05;
        glass.frame({
          time: reduce ? 0 : (now - t0) / 1000,
          clear,
          flash: state.flash,
          zoom: state.zoom,
          par: state.par,
          focus: window.innerWidth < 768 ? 0.74 : 0.5,
        });
      };
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => glass?.resize();
    const onMove = (e: PointerEvent) => {
      if (!glass) return;
      // wipe the fog along the pointer path
      const steps = last.x < 0 ? 1 : Math.min(8, Math.ceil(Math.hypot(e.clientX - last.x, e.clientY - last.y) / 10));
      for (let i = 1; i <= steps; i++) {
        const x = last.x < 0 ? e.clientX : last.x + ((e.clientX - last.x) * i) / steps;
        const y = last.y < 0 ? e.clientY : last.y + ((e.clientY - last.y) * i) / steps;
        glass.wipeAt(x, y);
      }
      last = { x: e.clientX, y: e.clientY };
    };
    const io = new IntersectionObserver(([en]) => (state.visible = en.isIntersecting));
    if (root.current) io.observe(root.current);
    window.addEventListener("resize", onResize);
    root.current?.addEventListener("pointermove", onMove);
    const r = root.current;
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      r?.removeEventListener("pointermove", onMove);
      glass?.destroy();
    };
  }, []);

  // the logline types out after the cold open
  useEffect(() => {
    const el = title.current;
    if (!el) return;
    let go = () => {};
    const ctx = gsap.context(() => {
      // the title, buttons and stats are simply there; only the logline types itself out, case-file terminal style
      const tl = gsap.timeline({ paused: true });
      const type = { n: 0 };
      const paint = () => {
        const n = Math.round(type.n);
        if (typed.current) typed.current.textContent = LOGLINE.slice(0, n);
        if (rest.current) rest.current.textContent = LOGLINE.slice(n);
      };
      paint();
      tl.to(type, { n: LOGLINE.length, duration: LOGLINE.length * 0.032, ease: "none", onUpdate: paint }, 0.3);
      go = () => tl.play();

      // scroll away: copy drifts up while the glass clears
      gsap.to(content.current, {
        y: () => -window.innerHeight * 0.18, opacity: 0, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    const w = window as unknown as { __dhOpened?: boolean };
    const start = () => go();
    if (w.__dhOpened) gsap.delayedCall(0.15, start);
    else window.addEventListener("dh:open", start, { once: true });
    return () => {
      window.removeEventListener("dh:open", start);
      ctx.revert();
    };
  }, []);

  return (
    <section id="top" ref={root} className="hero" aria-label="Diamond Hands">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={fallback} src={KEY_ART} alt="" className="hero__fallback" />
      <canvas ref={canvas} className="hero__glass" aria-hidden="true" />
      <div className="hero__shade" />

      <div ref={stage} className="hero__stage" suppressHydrationWarning>
      {/* lock the layout before the first paint, so nothing jumps when the app takes over */}
      <script dangerouslySetInnerHTML={{ __html: FIT_NOW }} />
      <div ref={content} className="hero__content wrap">
        <h1 ref={title} className="display hero__title">
          Diamond
          <br />
          <span className="lime">Hands</span>
        </h1>

        <div className="hero__foot">
          <p className="hero__logline" aria-label={LOGLINE}>
            <span aria-hidden="true">
              <span className="pre">&gt;</span>
              <span ref={typed} />
              <span className="caret" />
              <span ref={rest} className="rest">{LOGLINE}</span>
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={LINKS.buy} className="btn btn--lime">
              Buy $DIAMOND <span className="btn__arrow" aria-hidden="true" />
            </a>
            <button type="button" onClick={watchTeaser} className="play">
              <span className="play__icon" aria-hidden="true" />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold uppercase tracking-[0.12em]">Watch the teaser</span>
                <span className="meta !text-[10px] text-[var(--bone)]/50">Case #1027 / 0:23</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <dl className="hero__stats" aria-label="The rule">
        <div><dt className="meta">Day 1 max</dt><dd className="display">1%</dd></div>
        <div><dt className="meta">Day 100 max</dt><dd className="display">100%</dd></div>
        <div><dt className="meta">Cooldown</dt><dd className="display">24h</dd></div>
      </dl>
      </div>

    </section>
  );
}

function watchTeaser() {
  const el = document.getElementById("teaser");
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o: object) => void } }).__lenis;
  const play = () => window.dispatchEvent(new Event("dh:teaser"));
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4, onComplete: play });
  else {
    el.scrollIntoView({ behavior: "smooth" });
    setTimeout(play, 900);
  }
}

function openDelay() {
  return (window as unknown as { __dhOpened?: boolean }).__dhOpened ? 0 : 2.2;
}

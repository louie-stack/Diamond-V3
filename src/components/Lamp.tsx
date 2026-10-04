"use client";

import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";

/**
 * The interrogation lamp. It hangs over the room and barely moves; grab it and let go,
 * or flick it, and it swings on its cord, sweeping its light across the wall.
 */
export default function Lamp() {
  const rig = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rig.current, hit = shade.current;
    if (!el || !hit) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let th = 0, w = 0;
    let drag: { id: number; moved: boolean; x: number; y: number; t: number; th: number } | null = null;
    let raf = 0, last = performance.now();
    let visible = false;

    const angleAt = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      // pivot is the top-centre of the rig
      const px = r.left + r.width / 2, py = r.top;
      return Math.max(-1, Math.min(1, Math.atan2(-(x - px), y - py)));
    };

    const flicker = () => {
      el.classList.remove("is-flicker");
      void el.offsetWidth;
      el.classList.add("is-flicker");
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!drag) {
        // a pendulum, with a little air resistance
        w += (-14 * Math.sin(th) - 0.32 * w) * dt;
        th += w * dt;
      }
      // a breath of a sway at rest, so it feels like it's hanging there
      const idle = reduce ? 0 : 0.012 * Math.sin(now / 900);
      el.style.setProperty("--swing", `${th + idle}rad`);
      if (visible) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const down = (e: PointerEvent) => {
      e.preventDefault();
      hit.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, moved: false, x: e.clientX, y: e.clientY, t: performance.now(), th };
      el.classList.add("is-held");
      // no text selection while dragging the lamp around
      document.documentElement.classList.add("no-select");
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
      if (!drag.moved) return;
      const now = performance.now();
      const nt = angleAt(e.clientX, e.clientY);
      const dt = Math.max(0.008, (now - drag.t) / 1000);
      w = w * 0.5 + ((nt - th) / dt) * 0.5;
      th = nt;
      drag.t = now;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      el.classList.remove("is-held");
      document.documentElement.classList.remove("no-select");
      if (!drag.moved) {
        // a flick: knock it away from the side you hit
        const r = hit.getBoundingClientRect();
        w += (e.clientX < r.left + r.width / 2 ? -1 : 1) * 2.6;
      }
      w = Math.max(-7, Math.min(7, w));
      if (Math.abs(w) > 1 || Math.abs(th) > 0.15) sfx.swing();
      if (Math.abs(w) > 3.5 || Math.abs(th) > 0.6) flicker();
      drag = null;
    };

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    hit.addEventListener("pointerdown", down);
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerup", up);
    hit.addEventListener("pointercancel", up);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      hit.removeEventListener("pointerdown", down);
      hit.removeEventListener("pointermove", move);
      hit.removeEventListener("pointerup", up);
      hit.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div ref={rig} className="lamp" aria-hidden="true">
      <span className="lamp__beam" />
      <span className="lamp__cord" />
      <div ref={shade} className="lamp__shade">
        <svg viewBox="0 0 80 44" className="lamp__svg">
          <defs>
            <linearGradient id="lamp-metal" x1="0" x2="1">
              <stop offset="0" stopColor="#0c0c0a" />
              <stop offset="0.35" stopColor="#3a3a33" />
              <stop offset="0.55" stopColor="#1f1f1b" />
              <stop offset="1" stopColor="#0a0a08" />
            </linearGradient>
          </defs>
          <rect x="35" y="0" width="10" height="8" rx="1.5" fill="#1b1b18" />
          <path d="M33 7 H47 L76 38 Q77 41 74 41 H6 Q3 41 4 38 Z" fill="url(#lamp-metal)" />
          <path d="M5.5 39.5 H74.5" stroke="#77756a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
        <span className="lamp__bulb" />
      </div>
    </div>
  );
}

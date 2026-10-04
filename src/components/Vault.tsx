"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { sfx } from "@/lib/sfx";
import Letter from "./Letter";

const CODE = [0, 0, 1];
const STEP = 36; // degrees per digit

/**
 * One evidence tag is a locker door. A small combination dial sits in its corner; dial
 * 0-0-1 (the 1% rule) and the door swings open on what's inside.
 */
export default function Vault({ children }: { children: ReactNode }) {
  const dial = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState<number[]>([]);
  const [digit, setDigit] = useState(0);
  const [state, setState] = useState<"shut" | "wrong" | "open">("shut");

  useEffect(() => {
    const el = dial.current;
    if (!el) return;
    let rot = 0; // degrees, clockwise
    let notch = 0;
    let codeIn: number[] = [];
    let drag: { id: number; a: number; from: number } | null = null;
    let wheelT = 0;
    let wheelFrom = 0;
    let busy = false;

    const digitOf = (n: number) => ((n % 10) + 10) % 10;
    const paint = () => el.style.setProperty("--rot", `${rot}deg`);
    const angle = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    };
    const turnTo = (deg: number) => {
      rot = deg;
      const n = Math.round(rot / STEP);
      if (n !== notch) {
        notch = n;
        setDigit(digitOf(n));
        sfx.click();
      }
      paint();
    };
    const enter = () => {
      if (busy) return;
      const d = digitOf(notch);
      codeIn = [...codeIn, d];
      setEntered(codeIn);
      if (codeIn.length < CODE.length) return;
      busy = true;
      if (codeIn.every((v, i) => v === CODE[i])) {
        setState("open");
        sfx.chime();
        setTimeout(() => sfx.thud(), 380);
      } else {
        setState("wrong");
        sfx.buzz();
        setTimeout(() => {
          codeIn = [];
          setEntered([]);
          setState("shut");
          busy = false;
          // the dial spins itself back to zero
          rot = 0;
          notch = 0;
          setDigit(0);
          el.classList.add("is-resetting");
          paint();
          setTimeout(() => el.classList.remove("is-resetting"), 600);
        }, 900);
      }
    };
    const snap = () => {
      rot = notch * STEP;
      paint();
    };

    const down = (e: PointerEvent) => {
      if (busy) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, a: angle(e), from: notch };
      document.documentElement.classList.add("no-select");
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const a = angle(e);
      let d = a - drag.a;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      drag.a = a;
      turnTo(rot + d);
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = notch !== drag.from;
      drag = null;
      document.documentElement.classList.remove("no-select");
      snap();
      if (moved) enter();
      else {
        // a tap turns it one click; the number is taken once you stop
        turnTo((notch + 1) * STEP);
        clearTimeout(wheelT);
        wheelT = window.setTimeout(() => {
          wheelT = 0;
          enter();
        }, 1100);
      }
    };
    const wheel = (e: WheelEvent) => {
      // the page mustn't scroll while you're turning the dial
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      if (!wheelT) wheelFrom = notch;
      turnTo((notch + (e.deltaY > 0 ? 1 : -1)) * STEP);
      clearTimeout(wheelT);
      wheelT = window.setTimeout(() => {
        wheelT = 0;
        if (notch !== wheelFrom) enter();
      }, 650);
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    (el as unknown as { __reset: () => void }).__reset = () => {
      codeIn = [];
      busy = false;
      rot = 0;
      notch = 0;
      paint();
      setDigit(0);
    };
    return () => {
      clearTimeout(wheelT);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, []);

  // where the folded letter was picked up, while it's being read
  const [reading, setReading] = useState<{ x: number; y: number } | null>(null);

  function close() {
    setState("shut");
    setEntered([]);
    sfx.thud();
    (dial.current as unknown as { __reset?: () => void } | null)?.__reset?.();
  }

  const slots = [0, 1, 2].map((i) => (i < entered.length ? String(entered[i]) : i === entered.length ? String(digit) : "_"));

  return (
    <>
      {/* inside the safe: a steel box, a lamp, and one folded letter */}
      <div className={`vault__inside ${state === "open" ? "is-open" : ""}`} aria-hidden={state !== "open"} onClick={close}>
        <span className="vault__wall vault__wall--top" />
        <span className="vault__wall vault__wall--left" />
        <span className="vault__wall vault__wall--right" />
        <span className="vault__wall vault__wall--floor" />
        <span className="vault__wall vault__wall--back" />
        <span className="vault__light" />
        <button
          type="button"
          className={`vault__letter ${reading ? "is-gone" : ""}`}
          aria-label="Unfold the letter"
          tabIndex={state === "open" ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            const r = e.currentTarget.getBoundingClientRect();
            setReading({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
        >
          <span className="vault__shadow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/case/safe-letter.webp" alt="" loading="lazy" />
        </button>
      </div>
      <Letter from={reading} onClose={() => setReading(null)} />
      <div className={`vault__door ${state === "open" ? "is-open" : ""}`}>
        {children}
        <div className={`vault__lock ${state === "wrong" ? "is-wrong" : ""}`}>
          <span className="vault__read mono" aria-hidden="true">
            {slots.map((s, i) => (
              <span key={i} className={i === entered.length && state === "shut" ? "is-live" : ""}>{s}</span>
            ))}
          </span>
          <button ref={dial} type="button" className="vault__dial" aria-label="Combination dial" data-lenis-prevent="">
            <span className="vault__face" />
          </button>
        </div>
      </div>
    </>
  );
}

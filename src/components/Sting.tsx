"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "@/lib/sfx";
import SceneBg from "./SceneBg";
import SecHead from "./SecHead";
import Rip from "./Rip";

const START = 1_000_000;
const HOURS = 24;
const SPEED = 2.4; // simulated hours per real second
const fmt = (n: number) => n.toLocaleString("en-US");
/** the 100-day curve: day N allows N% of the current bag, after Day 100 there is no limit */
const CURVE_END = 100;
const free = (day: number) => day > CURVE_END;
const capOf = (bal: number, day: number) => (free(day) ? bal : Math.floor((bal * day) / 100));

type Line = { t: string; kind: "ok" | "deny" | "info" };

/** A wallet, a sell button, the rule. Try to jeet. */
export default function Sting() {
  const [balance, setBalance] = useState(START);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [day, setDay] = useState(1);
  const [log, setLog] = useState<Line[]>([
    { t: "Day 1. Wallet loaded. 1,000,000 $DIAMOND. No cooldown. First outbound available now.", kind: "info" },
  ]);
  const [stamp, setStamp] = useState<{ text: string; kind: "deny" | "ok"; id: number } | null>(null);
  const [sells, setSells] = useState(0);
  const elapsedRef = useRef<number | null>(null);
  const balanceRef = useRef(START);
  const dayRef = useRef(1);
  const console_ = useRef<HTMLDivElement>(null);
  const logBox = useRef<HTMLDivElement>(null);
  const active = elapsed !== null;

  const max = capOf(balance, day);
  const push = (l: Line) => setLog((prev) => [...prev.slice(-7), l]);

  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const e = Math.min(HOURS, (elapsedRef.current ?? 0) + dt * SPEED);
      elapsedRef.current = e;
      setElapsed(e);
      if (e >= HOURS) {
        elapsedRef.current = null;
        setElapsed(null);
        const b = balanceRef.current;
        const d = dayRef.current + 1;
        dayRef.current = d;
        setDay(d);
        push({
          t: free(d)
            ? `24h elapsed. Day ${d}. The curve is done. No limit, no cooldown. Free market.`
            : `24h elapsed. Day ${d}. CLEAR. Limit recalculated from current balance: ${d}% of ${fmt(b)} = ${fmt(capOf(b, d))}. Unused allowance did not carry over.`,
          kind: "ok",
        });
        sfx.ching();
        return;
      }
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [active]);

  useEffect(() => {
    if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight;
  }, [log]);

  const shake = () => {
    if (console_.current) gsap.fromTo(console_.current, { x: 0 }, { x: 6, duration: 0.05, repeat: 6, yoyo: true, ease: "none", clearProps: "x" });
  };
  const deny = (why: string) => {
    setStamp({ text: "Denied", kind: "deny", id: Date.now() });
    push({ t: `DENIED. ${why}`, kind: "deny" });
    shake();
    sfx.buzz();
    sfx.thud();
  };
  const remaining = () => {
    const left = HOURS - (elapsedRef.current ?? 0);
    const h = Math.floor(left);
    const m = Math.floor((left - h) * 60);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  const sell = (amount: number, label: string) => {
    if (elapsedRef.current !== null) return deny(`Cooldown running. ${remaining()} remaining.`);
    if (amount > max) return deny(`That's a jeet. ${label} is ${fmt(amount)}. Day ${day} max outbound is ${day}% = ${fmt(max)}.`);
    if (amount <= 0) return;
    const next = balance - amount;
    balanceRef.current = next;
    setBalance(next);
    setSells((s) => s + 1);
    setStamp({ text: "Sold", kind: "ok", id: Date.now() });
    if (free(day)) {
      push({ t: `Sold ${fmt(amount)} (${label}). Balance ${fmt(next)}. Day ${day}: no cooldown, no limit.`, kind: "ok" });
    } else {
      push({ t: `Sold ${fmt(amount)} (${label}). Balance ${fmt(next)}. Rolling 24h cooldown started.`, kind: "ok" });
      elapsedRef.current = 0;
      setElapsed(0);
    }
    sfx.ching();
    sfx.thud();
  };
  const buy = (amount: number) => {
    const next = balance + amount;
    balanceRef.current = next;
    setBalance(next);
    push({
      t: `Received ${fmt(amount)}. Balance ${fmt(next)}. ${elapsedRef.current !== null ? "Cooldown unaffected." : "No cooldown started. Buying never starts one."}`,
      kind: "info",
    });
    sfx.ching();
  };
  const jump = (d: number) => {
    dayRef.current = d;
    elapsedRef.current = null;
    setDay(d);
    setElapsed(null);
    const b = balanceRef.current;
    push({
      t: free(d)
        ? `Skipped to Day ${d}. The curve is over. Normal holders are unrestricted.`
        : `Skipped to Day ${d}. Cooldown clear. Max outbound is now ${d}% of ${fmt(b)} = ${fmt(capOf(b, d))}.`,
      kind: "info",
    });
    sfx.flip();
  };
  const reset = () => {
    balanceRef.current = START;
    elapsedRef.current = null;
    dayRef.current = 1;
    setDay(1);
    setBalance(START);
    setElapsed(null);
    setSells(0);
    setStamp(null);
    setLog([{ t: "Wallet reset. Day 1. 1,000,000 $DIAMOND. No cooldown.", kind: "info" }]);
    sfx.flip();
  };

  const angle = ((elapsed ?? 0) / HOURS) * 360;
  const left = HOURS - (elapsed ?? 0);
  const lh = Math.floor(left);
  const lm = Math.floor((left - lh) * 60);

  return (
    <section id="sting" className="sec overflow-hidden bg-[var(--night)]">
      <Rip color="var(--night-2)" fiber="#3d4034" seed={33} inside />
      <SceneBg src="/art/case/max-sell.webp" tone="var(--night)" height="min(90vh, 860px)" opacity={0.5} position="40% 35%" />
      <div className="wrap relative">
        <SecHead
          n="Interlude"
          label="The sting"
          title="Try to jeet."
          aside="A wallet. A sell button. The curve. Go on. The demo clock runs at 24 hours in ten seconds, and every 24 hours is a new day."
        />

        <div ref={console_} className="mt-16 grid gap-px bg-[var(--line-d)] lg:mt-20 lg:grid-cols-[1.15fr_1fr]" data-fx="rise">
          {/* Wallet console */}
          <div className="relative bg-[var(--night)] p-7 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="meta opacity-50">Wallet 0xD1A...0ND · <span className="text-[var(--lime)]">Day {day}</span></p>
                <p className="display mt-3 text-[clamp(48px,5vw,76px)] leading-none tabular-nums">{fmt(balance)}</p>
                <p className="meta mt-2 opacity-50">$DIAMOND held</p>
              </div>
              <div className="text-right max-sm:text-left">
                <p className="meta opacity-50">Max next outbound</p>
                <p className="display mt-3 text-[clamp(48px,5vw,76px)] leading-none text-[var(--lime)] tabular-nums">{fmt(max)}</p>
                <p className="meta mt-2 opacity-50">{free(day) ? "No limit. Curve complete" : `${day}% of current bag`}</p>
              </div>
            </div>

            <div className="mt-10 border-t border-[var(--line-d)] pt-8">
              <p className="meta opacity-50">Outbound</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => sell(Math.floor(balance / 500), "0.2%")} className="btn btn--line">
                  Sell 0.2%
                </button>
                <button type="button" onClick={() => sell(max, free(day) ? "the max" : `${day}%`)} className="btn btn--lime">
                  {free(day) ? "Sell max" : `Sell ${day}% (max)`}
                </button>
                <button
                  type="button"
                  onClick={() => sell(balance, "your whole bag")}
                  className="btn border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-[var(--ink)]"
                  aria-label="Sell everything"
                >
                  Sell all
                </button>
              </div>
              <p className="meta mt-8 opacity-50">Protocol age</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {[1, 25, 50, 100, 101].map((d) => (
                  <button key={d} type="button" onClick={() => jump(d)} className={`btn btn--line btn--sm ${day === d ? "!border-[var(--lime)] !text-[var(--lime)]" : ""}`}>
                    Day {d}
                  </button>
                ))}
              </div>
              <p className="meta mt-8 opacity-50">Inbound</p>
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <button type="button" onClick={() => buy(250_000)} className="btn btn--line">
                  Buy 250,000
                </button>
                <button type="button" onClick={reset} className="meta link-u opacity-60 hover:opacity-100">
                  Reset wallet
                </button>
              </div>
            </div>

            {stamp && (
              <span
                key={stamp.id}
                className={`stamp stamp-in pointer-events-none absolute bottom-10 right-8 !border-[5px] !text-[40px] sm:!text-[56px] ${stamp.kind === "deny" ? "" : "stamp--lime"}`}
              >
                {stamp.text}
              </span>
            )}
          </div>

          {/* Clock and transcript */}
          <div className="flex flex-col bg-[var(--night)]">
            <div className="flex items-center gap-7 border-b border-[var(--line-d)] p-7 sm:p-10">
              <svg viewBox="0 0 200 200" className="h-[132px] w-[132px] shrink-0" aria-hidden="true">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(236,230,214,0.14)" strokeWidth="2" />
                {Array.from({ length: 24 }).map((_, i) => {
                  const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
                  const r1 = i % 6 === 0 ? 70 : 76;
                  return (
                    <line
                      key={i}
                      x1={+(100 + Math.cos(a) * r1).toFixed(2)}
                      y1={+(100 + Math.sin(a) * r1).toFixed(2)}
                      x2={+(100 + Math.cos(a) * 82).toFixed(2)}
                      y2={+(100 + Math.sin(a) * 82).toFixed(2)}
                      stroke={i % 6 === 0 ? "rgba(236,230,214,0.6)" : "rgba(236,230,214,0.25)"}
                      strokeWidth={i % 6 === 0 ? 2 : 1}
                    />
                  );
                })}
                {active && <path d={describeArc(100, 100, 90, 0, angle)} fill="none" stroke="var(--lime)" strokeWidth="4" />}
                <line x1="100" y1="100" x2="100" y2="38" stroke={active ? "var(--lime)" : "var(--bone)"} strokeWidth="2" strokeLinecap="round" transform={`rotate(${angle} 100 100)`} />
                <circle cx="100" cy="100" r="4" fill="var(--bone)" />
              </svg>
              <div>
                <p className="meta opacity-50">Cooldown clock</p>
                <p className={`display mt-2 text-[52px] leading-none tabular-nums ${active ? "text-[var(--bone)]" : "text-[var(--lime)]"}`}>
                  {active ? `${lh}h ${String(lm).padStart(2, "0")}m` : "Clear"}
                </p>
                <p className="body-s mt-2 text-[var(--bone)]/60">{active ? "One outbound already used. Wait it out." : free(day) ? "Past Day 100. No cooldown." : "Next outbound available now."}</p>
                <p className="meta mt-3 opacity-40">Sells this session: {sells}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between px-7 pt-6 sm:px-10">
                <span className="meta opacity-50">Transcript</span>
                <span className="meta flex items-center gap-2 opacity-50"><span className="rec" /> Recorded live</span>
              </div>
              <div ref={logBox} className="h-[230px] overflow-y-auto px-7 pb-6 pt-3 sm:px-10" data-lenis-prevent="">
                {log.map((l, i) => (
                  <p
                    key={i}
                    className={`mono border-b border-[var(--line-d)] py-2 text-[13px] leading-relaxed ${l.kind === "deny" ? "text-[var(--red)]" : l.kind === "ok" ? "text-[var(--bone)]" : "text-[var(--bone)]/55"}`}
                  >
                    <span className="mr-3 opacity-40">{String(i + 1).padStart(2, "0")}</span>
                    {l.t}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = ((start - 90) * Math.PI) / 180;
  const e = ((Math.min(end, 359.99) - 90) * Math.PI) / 180;
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
}

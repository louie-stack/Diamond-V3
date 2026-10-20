"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Caveat, Permanent_Marker } from "next/font/google";
import { sfx } from "@/lib/sfx";
import Scrawl from "./Scrawl";

const hand = Caveat({ weight: ["400", "600", "700"], subsets: ["latin"], display: "swap" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * The letter left in the safe. Flies from where it lay to the centre of the screen:
 * a torn-out page, folded in three, written in a hurry.
 */
export default function Letter({ from, onClose }: { from: { x: number; y: number } | null; onClose: () => void }) {
  const sheet = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const torn = useMemo(() => tornEdge(), []);

  useEffect(() => {
    if (!from) return;
    const el = sheet.current, bg = veil.current;
    if (!el || !bg) return;
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    sfx.flip();
    const r = el.getBoundingClientRect();
    const dx = from.x - (r.left + r.width / 2), dy = from.y - (r.top + r.height / 2);
    gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    gsap.fromTo(
      el,
      { x: dx, y: dy, scale: 0.08, rotation: -40, opacity: 0, filter: "brightness(0.6)" },
      { x: 0, y: 0, scale: 1, rotation: -1.2, opacity: 1, filter: "brightness(1)", duration: 1, ease: "expo.out" },
    );
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  function close() {
    const el = sheet.current, bg = veil.current;
    if (!el || !bg || !from) return onClose();
    sfx.flip();
    const r = el.getBoundingClientRect();
    gsap.to(bg, { opacity: 0, duration: 0.45 });
    gsap.to(el, {
      x: from.x - (r.left + r.width / 2), y: from.y - (r.top + r.height / 2), scale: 0.06, rotation: 50, opacity: 0,
      duration: 0.6, ease: "power3.in", onComplete: onClose,
    });
  }

  if (!from) return null;
  return createPortal(
    <div className="letter" role="dialog" aria-modal="true" aria-label="A letter from the founder">
      <div ref={veil} className="letter__veil" onClick={close} />
      <div ref={sheet} className={`letter__sheet ${hand.className}`} style={{ clipPath: torn }} data-lenis-prevent="">
        <svg className="letter__crumple" aria-hidden="true">
          <filter id="letter-crumple" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="5" seed="8" result="n" />
            <feDiffuseLighting in="n" surfaceScale="3.4" lightingColor="#f4ecd6" result="l">
              <feDistantLight azimuth="235" elevation="52" />
            </feDiffuseLighting>
          </filter>
          <rect width="100%" height="100%" filter="url(#letter-crumple)" />
        </svg>
        <span className="letter__stain" aria-hidden="true" />

        <div className="letter__body">
          <p className="letter__case">Case #001. Not for the press.</p>

          <p className={`letter__open ${marker.className}`}>If you&apos;re reading this, you cracked it.</p>

          <p>
            Most people never look this closely. They buy, they panic, they sell to the next one in line. I watched it happen for years.
            Every chart I loved ended the same way: <u>one wallet</u>, one red candle, and everyone else left holding the bag.
          </p>

          <p>
            I tried <s>trusting the teams</s> <s>trusting the promises</s>. Promises break. Teams get bought. Whales just wait.
          </p>

          <p className="letter__big">So I needed <span className="letter__ring">another way</span>.</p>

          <p>
            Not a better pitch. A <b>rule</b>. Written into the contract, out of everyone&apos;s reach. Mine included. No owner switch.
            No whitelist. Nobody to call. <span className="letter__hl">One percent on day one</span>, a little more every day after, and the
            same rule for everyone at the same time. Strongest when the chart is youngest. Gone when it&apos;s grown.
          </p>

          <p>
            I set something aside, too. A tenth of everything, sealed where nobody can rush it. It isn&apos;t for sale. It&apos;s for whoever
            keeps looking.
          </p>

          <p>
            And now you&apos;ve found $DMND. That tells me what kind of holder you are. Patient. Paying attention. Hard to shake. This was
            built for you.
          </p>

          <p className="letter__big">It isn&apos;t a coin. It&apos;s a pact.</p>

          <p>
            Welcome to the movement. Tell the right people. Ignore the rest. <span className="letter__under">Nobody leaves early.</span>
          </p>

          <div className="letter__sign">
            <div>
              <p className={`letter__name ${marker.className}`}>The Founder</p>
              <p className="letter__ps">P.S. Burn after reading. You already know where the match is.</p>
            </div>
            <Scrawl className="letter__scrawl" />
          </div>
        </div>
      </div>
      <button type="button" className="letter__close" onClick={close}>
        Fold it back up
      </button>
    </div>,
    document.body,
  );
}

/** a torn sheet: ragged on all four sides, with a couple of deeper rips */
function tornEdge() {
  let s = 31;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const pts: string[] = [];
  const side = (n: number, f: (t: number, j: number) => [number, number]) => {
    for (let i = 0; i < n; i++) {
      const rip = rnd() < 0.06 ? 2.6 : 1;
      pts.push(f(i / n, (rnd() * 1.4) * rip).map((v) => `${v.toFixed(2)}%`).join(" "));
    }
  };
  side(46, (t, j) => [t * 100, j]);
  side(60, (t, j) => [100 - j * 0.8, t * 100]);
  side(46, (t, j) => [100 - t * 100, 100 - j]);
  side(60, (t, j) => [j * 0.8, 100 - t * 100]);
  return `polygon(${pts.join(", ")})`;
}

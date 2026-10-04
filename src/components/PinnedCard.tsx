"use client";

import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { Permanent_Marker } from "next/font/google";
import { sfx } from "@/lib/sfx";
import Scrawl from "./Scrawl";

const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * An exhibit card held up by two pushpins. Pull the right-hand pin and the card swings
 * down on the other one, showing what was pinned behind it. Click it to pin it back up.
 */
export default function PinnedCard({ children }: { children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLButtonElement>(null);
  const [down, setDown] = useState(false);
  const busy = useRef(false);

  const pull = () => {
    const c = card.current, p = pin.current;
    if (!c || !p || busy.current || down) return;
    busy.current = true;
    setDown(true);
    sfx.click();
    // it comes to rest where its weight hangs straight under the remaining pin
    const hang = Math.min(window.innerWidth < 640 ? 28 : 42, Math.max(22, (Math.atan(c.offsetWidth / c.offsetHeight) * 180) / Math.PI));
    gsap.timeline({ onComplete: () => void (busy.current = false) })
      .to(p, { y: -16, rotation: -20, duration: 0.14, ease: "power2.out" })
      .to(p, { y: 340, x: 30, rotation: 260, opacity: 0, duration: 0.85, ease: "power2.in" })
      .to(c, { rotation: hang, duration: 1.8, ease: "elastic.out(1, 0.32)" }, 0.08)
      .add(() => sfx.swing(), 0.1);
  };

  const pinBack = () => {
    const c = card.current, p = pin.current;
    if (!c || !p || busy.current || !down) return;
    busy.current = true;
    sfx.thud();
    gsap.timeline({
      onComplete: () => {
        busy.current = false;
        setDown(false);
      },
    })
      .to(c, { rotation: 0, duration: 0.55, ease: "power3.out" })
      .fromTo(p, { x: 0, y: -30, rotation: 0, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" }, 0.4);
  };

  return (
    <div className={`pinned ${down ? "is-down" : ""}`}>
      <div className="pinned__note" aria-hidden={!down} onClick={pinBack}>
        <div className={`pinned__paper ${marker.className}`}>
          <p className="pinned__hand">This is the end of paper hands.</p>
          <Scrawl className="pinned__scrawl" />
        </div>
      </div>
      <div ref={card} className={`pinned__card ${down ? "is-down" : ""}`} onClick={down ? pinBack : undefined}>
        {children}
        <span className="pushpin pushpin--l" aria-hidden="true" />
      </div>
      <button ref={pin} type="button" className="pushpin pushpin--r" aria-label="Pull the pin" onClick={pull} />
    </div>
  );
}

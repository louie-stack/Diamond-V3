"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { sfx } from "@/lib/sfx";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * One motion layer for the page. Elements opt in with data-fx:
 *   lines  - heading reveals line by line from behind a mask
 *   rise   - lifts in and fades
 *   img    - image wipes up into its frame while settling from a slight zoom
 *   draw   - SVG path draws itself
 *   strike - red strike-through draws across
 *   stamp  - rubber stamp lands
 *   type   - types out character by character, terminal style
 * data-fx-delay="0.2" adds a delay. data-count="1000000000" counts up.
 * data-parallax drifts an image inside its frame.
 */
export default function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = reduce ? null : new Lenis({ lerp: 0.1, smoothWheel: true });
    if (lenis) {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href === "#" || href === "#buy") return;
      const el = document.querySelector<HTMLElement>(href);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: href === "#top" ? 0 : -72, duration: 1.4 });
      else el.scrollIntoView({ behavior: "smooth" });
    };
    document.addEventListener("click", onAnchor);

    // Type "jeet" anywhere. The file objects.
    let buf = "";
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf !== "jeet") return;
      buf = "";
      const egg = document.createElement("div");
      egg.className = "egg";
      egg.innerHTML = '<span class="stamp" style="font-size:clamp(40px,9vw,120px);border-width:6px">Denied</span>';
      document.body.appendChild(egg);
      sfx.buzz();
      sfx.thud();
      gsap.fromTo(egg.firstElementChild, { scale: 2.6, rotation: 2, opacity: 0 }, { scale: 1, rotation: -8, opacity: 1, duration: 0.3, ease: "power4.in" });
      gsap.to(egg, { opacity: 0, duration: 0.5, delay: 1.3, onComplete: () => egg.remove() });
    };
    window.addEventListener("keydown", onKey);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    // late images and fonts change the page height; keep every trigger and pin honest
    let lastH = document.body.scrollHeight;
    let rt = 0;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(rt);
      rt = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(document.body);

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      if (reduce) return;
      const delayOf = (el: Element) => Number((el as HTMLElement).dataset.fxDelay || 0);
      const trig = (el: Element, start = "top 86%") => ({ trigger: el, start, once: true });

      gsap.utils.toArray<HTMLElement>("[data-fx='lines']").forEach((el) => {
        const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "ln" });
        splits.push(split);
        gsap.from(split.lines, { yPercent: 105, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: delayOf(el), scrollTrigger: trig(el) });
      });

      gsap.utils.toArray<HTMLElement>("[data-fx='type']").forEach((el) => {
        // words keep their letters together, so a line never wraps mid-word on a phone
        const split = SplitText.create(el, { type: "words,chars" });
        splits.push(split);
        gsap.set(split.chars, { opacity: 0 });
        gsap.to(split.chars, { opacity: 1, duration: 0.01, stagger: 0.022, ease: "none", delay: delayOf(el) + 0.2, scrollTrigger: trig(el) });
      });

      gsap.utils.toArray<HTMLElement>("[data-fx='rise']").forEach((el) => {
        gsap.from(el, { y: 28, opacity: 0, duration: 1, ease: "expo.out", delay: delayOf(el), scrollTrigger: trig(el) });
      });

      // image reveal: a cover in the section's colour slides away (transform only,
      // so it runs on the GPU instead of repainting the image every frame)
      gsap.utils.toArray<HTMLElement>("[data-fx='img']").forEach((el) => {
        const img = el.querySelector("img");
        const sec = el.closest("section");
        const cover = document.createElement("span");
        cover.className = "img-cover";
        cover.style.background = sec ? getComputedStyle(sec).backgroundColor : "#080906";
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        el.style.overflow = "hidden";
        el.appendChild(cover);
        const tl = gsap.timeline({ scrollTrigger: trig(el, "top 90%"), delay: delayOf(el), onComplete: () => cover.remove() });
        tl.fromTo(cover, { scaleY: 1 }, { scaleY: 0, duration: 1.1, ease: "expo.inOut" });
        if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: "expo.out", clearProps: "transform" }, 0.05);
      });

      gsap.utils.toArray<SVGPathElement>("[data-fx='draw']").forEach((el) => {
        const len = el.getTotalLength();
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(el, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: delayOf(el), scrollTrigger: trig(el) });
      });

      gsap.utils.toArray<HTMLElement>("[data-fx='strike']").forEach((el, i) => {
        gsap.fromTo(el, { "--s": 0 }, { "--s": 1, duration: 0.6, ease: "power2.inOut", delay: delayOf(el) + i * 0.12, scrollTrigger: trig(el) });
      });

      gsap.utils.toArray<HTMLElement>("[data-fx='stamp']").forEach((el) => {
        const rot = Number(el.dataset.rot || -6);
        gsap.set(el, { rotation: rot });
        gsap.from(el, {
          scale: 2.2, opacity: 0, rotation: rot + 5, duration: 0.32, ease: "power4.in", delay: delayOf(el),
          scrollTrigger: trig(el),
          onComplete: () => sfx.thud(),
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count || 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 2, ease: "expo.out", delay: delayOf(el), scrollTrigger: trig(el),
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("en-US");
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amt = Number(el.dataset.parallax || 8);
        gsap.fromTo(el, { yPercent: -amt }, {
          yPercent: amt, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

    });

    return () => {
      document.removeEventListener("click", onAnchor);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("load", onLoad);
      ro.disconnect();
      clearTimeout(rt);
      splits.forEach((s) => s.revert());
      document.querySelectorAll(".img-cover").forEach((c) => c.remove());
      ctx.revert();
      lenis?.destroy();
    };
  }, []);

  return null;
}

/**
 * NOBODY LEAVES EARLY as a ransom note: every letter cut from a different magazine and
 * glued to the clippings wall behind the front page, so the fire uncovers it as it burns.
 * Drawn once into a canvas; the same canvas is shown on the wall and drawn into the
 * fire's view of the wall, so the two always match.
 */
const W = 1000, H = 800, S = 1.6;
const LINES = ["NOBODY", "LEAVES", "EARLY"];

/** gloss: coated magazine stock (halftone, sheen, a white core where it was cut) */
type Paper = { bg: string; ink: string; gloss?: boolean };
/** the magazines: newsprint, glossy black, tabloid red, tape yellow, the brand's lime */
const PAPERS: Paper[] = [
  { bg: "#efe8d6", ink: "#14110a" },
  { bg: "#16130c", ink: "#f1ebdc", gloss: true },
  { bg: "#d93a28", ink: "#fff6ea", gloss: true },
  { bg: "#f2c94c", ink: "#14110a", gloss: true },
  { bg: "#c6f500", ink: "#14110a", gloss: true },
  { bg: "#ddd3ba", ink: "#7a1f12" },
  { bg: "#fbfaf6", ink: "#d93a28", gloss: true },
  { bg: "#c39e66", ink: "#14110a" },
];

export function paintWords(host: HTMLElement) {
  const c = document.createElement("canvas");
  c.width = W * S;
  c.height = H * S;
  const x = c.getContext("2d")!;
  x.scale(S, S);
  const css = getComputedStyle(document.body);
  const v = (n: string) => css.getPropertyValue(n).trim() || "sans-serif";
  // a different face for each cut-out: the site's own plus the usual magazine suspects (upright only)
  const FACES = [
    `900 FONT ${v("--font-display")}`,
    `800 FONT ${v("--font-sans")}`,
    `700 FONT Georgia, "Times New Roman", serif`,
    `400 FONT Impact, "Arial Black", sans-serif`,
    `600 FONT ${v("--font-mono")}`,
    `700 FONT "Times New Roman", Times, serif`,
    `900 FONT "Arial Black", Arial, sans-serif`,
    `400 FONT ${v("--font-term")}`,
  ];
  const rnd = seeded(23);
  const grain = x.createPattern(grainTile(rnd), "repeat")!;
  const dots = x.createPattern(dotTile(), "repeat")!;
  dots.setTransform(new DOMMatrix().rotate(15));
  let lastPaper = -1, lastFace = -1, n = 0;

  LINES.forEach((word, li) => {
    // size every cut-out first, then centre the line
    const cuts = [...word].map((ch) => {
      let pi = Math.floor(rnd() * PAPERS.length);
      if (pi === lastPaper) pi = (pi + 3) % PAPERS.length;
      let fi = Math.floor(rnd() * FACES.length);
      if (fi === lastFace) fi = (fi + 2) % FACES.length;
      lastPaper = pi;
      lastFace = fi;
      const size = 150 + rnd() * 50;
      const font = FACES[fi].replace("FONT", `${size}px`);
      x.font = font;
      const m = x.measureText(ch);
      const cap = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const px = 12 + rnd() * 14, py = 12 + rnd() * 14;
      return {
        ch, font, paper: PAPERS[pi], m,
        w: m.width + px * 2, h: cap + py * 2, px, py,
        rot: (rnd() - 0.5) * 0.2, dy: (rnd() - 0.5) * 22,
        zig: rnd() < 0.12, tape: (n++ % 5 === 2), lift: Math.floor(rnd() * 6),
      };
    });
    const gap = 8;
    const total = cuts.reduce((a, k) => a + k.w, 0) + gap * (cuts.length - 1);
    const scale = Math.min(1, (W * 0.97) / total);
    let cx = (W - total * scale) / 2;
    const cy = 140 + li * 262;

    cuts.forEach((k) => {
      const w = k.w * scale;
      x.save();
      x.translate(cx + w / 2, cy + k.dy);
      x.rotate(k.rot);
      x.scale(scale, scale);
      const hw = k.w / 2, hh = k.h / 2;
      // scissor cut: four slightly crooked corners (or pinking shears now and then)
      const j = () => (rnd() - 0.5) * 9;
      const corners: [number, number][] = [[-hw + j(), -hh + j()], [hw + j(), -hh + j()], [hw + j(), hh + j()], [-hw + j(), hh + j()]];
      const path = new Path2D();
      if (k.zig) {
        const teeth = Math.max(6, Math.round(k.w / 14));
        path.moveTo(-hw, -hh);
        for (let t = 0; t <= teeth; t++) path.lineTo(-hw + (k.w * t) / teeth, -hh + (t % 2 ? 5 : 0));
        path.lineTo(hw, hh);
        for (let t = teeth; t >= 0; t--) path.lineTo(-hw + (k.w * t) / teeth, hh - (t % 2 ? 5 : 0));
        path.closePath();
      } else {
        corners.forEach(([a, b], i) => (i ? path.lineTo(a, b) : path.moveTo(a, b)));
        path.closePath();
      }

      // glued down: a contact shadow plus a softer one, deeper under a lifted corner
      x.shadowColor = "rgba(0,0,0,0.45)";
      x.shadowBlur = 3;
      x.shadowOffsetY = 2;
      x.fillStyle = k.paper.bg;
      x.fill(path);
      x.shadowColor = "rgba(0,0,0,0.5)";
      x.shadowBlur = 16;
      x.shadowOffsetX = k.lift === 1 ? 6 : k.lift === 3 ? -6 : 0;
      x.shadowOffsetY = 8;
      x.fill(path);
      x.shadowColor = "transparent";
      x.shadowOffsetX = 0;

      x.save();
      x.clip(path);
      // print: the letter, set on the page it came from
      x.font = k.font;
      x.fillStyle = k.paper.ink;
      x.textBaseline = "alphabetic";
      x.fillText(k.ch, -hw + k.px - k.m.actualBoundingBoxLeft, -hh + k.py + k.m.actualBoundingBoxAscent);
      // coated stock is printed in halftone, and has a sheen
      if (k.paper.gloss) {
        x.globalCompositeOperation = "multiply";
        x.fillStyle = dots;
        x.fillRect(-hw - 10, -hh - 10, k.w + 20, k.h + 20);
        x.globalCompositeOperation = "source-over";
        const g = x.createLinearGradient(-hw, -hh, hw * 0.6, hh);
        g.addColorStop(0, "rgba(255,255,255,0.2)");
        g.addColorStop(0.35, "rgba(255,255,255,0.04)");
        g.addColorStop(0.36, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(0,0,0,0.1)");
        x.fillStyle = g;
        x.fillRect(-hw - 10, -hh - 10, k.w + 20, k.h + 20);
      }
      // paper grain over everything, ink included
      x.globalCompositeOperation = "multiply";
      x.globalAlpha = k.paper.gloss ? 0.35 : 0.75;
      x.fillStyle = grain;
      x.fillRect(-hw - 10, -hh - 10, k.w + 20, k.h + 20);
      x.globalAlpha = 1;
      x.globalCompositeOperation = "source-over";
      // a corner peeling up off the wall catches light along its fold
      if (k.lift === 0 || k.lift === 2) {
        const [fx, fy] = corners[k.lift];
        const g = x.createRadialGradient(fx, fy, 0, fx, fy, 46);
        g.addColorStop(0, "rgba(255,255,255,0.28)");
        g.addColorStop(0.5, "rgba(0,0,0,0.12)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g;
        x.fillRect(fx - 50, fy - 50, 100, 100);
      }
      // coated paper shows its white core where the scissors went through
      if (k.paper.gloss) {
        x.strokeStyle = "rgba(255,253,245,0.75)";
        x.lineWidth = 2.4;
        x.stroke(path);
      }
      x.restore();

      // a strip of tape across the top
      if (k.tape) {
        x.save();
        x.translate((rnd() - 0.5) * hw * 0.6, -hh + 2);
        x.rotate((rnd() - 0.5) * 0.35);
        const tw = 74, th = 22;
        const tape = new Path2D();
        tape.moveTo(-tw / 2, -th / 2);
        tape.lineTo(tw / 2, -th / 2);
        for (let t = 0; t <= 5; t++) tape.lineTo(tw / 2 + (t % 2 ? 3 : 0), -th / 2 + (th * t) / 5);
        tape.lineTo(-tw / 2, th / 2);
        for (let t = 5; t >= 0; t--) tape.lineTo(-tw / 2 - (t % 2 ? 3 : 0), -th / 2 + (th * t) / 5);
        tape.closePath();
        x.shadowColor = "rgba(0,0,0,0.25)";
        x.shadowBlur = 4;
        x.shadowOffsetY = 1;
        x.fillStyle = "rgba(236,230,205,0.42)";
        x.fill(tape);
        x.shadowColor = "transparent";
        const tg = x.createLinearGradient(0, -th / 2, 0, th / 2);
        tg.addColorStop(0, "rgba(255,255,255,0.35)");
        tg.addColorStop(0.5, "rgba(255,255,255,0.05)");
        tg.addColorStop(1, "rgba(255,255,255,0.18)");
        x.fillStyle = tg;
        x.fill(tape);
        x.restore();
      }
      x.restore();
      cx += w + gap * scale;
    });
  });
  void host;
  return c;
}

/** paper fibre: soft mottling plus fine speckle, as a multiply layer */
function grainTile(rnd: () => number) {
  const t = document.createElement("canvas");
  t.width = t.height = 160;
  const g = t.getContext("2d")!;
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 255 - Math.pow(rnd(), 3) * 70 - rnd() * 14;
    img.data[i] = v;
    img.data[i + 1] = v * 0.99;
    img.data[i + 2] = v * 0.96;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return t;
}

/** a print screen: tiny dots, as a multiply layer */
function dotTile() {
  const t = document.createElement("canvas");
  t.width = t.height = 5;
  const g = t.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 5, 5);
  g.fillStyle = "rgba(0,0,0,0.16)";
  g.beginPath();
  g.arc(2.5, 2.5, 1.1, 0, Math.PI * 2);
  g.fill();
  return t;
}

function seeded(s: number) {
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

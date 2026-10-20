import { tornTop, tornBottom } from "./Rip";
import BurnPaper from "./BurnPaper";

/** Stop the presses. A broadsheet front page on a wall of other people's bad days. */
export default function Newspaper() {
  return (
    <section className="press !py-[clamp(96px,8vw,130px)]">
      <div className="press__fiber" style={{ clipPath: tornTop(7, 4) }} aria-hidden="true" />
      <div className="press__fiber" style={{ clipPath: tornBottom(11, 4) }} aria-hidden="true" />
      <div className="press__bg" style={{ clipPath: tornTop(7, 0) }} aria-hidden="true">
        <div className="absolute inset-0" style={{ clipPath: tornBottom(11, 0) }}>
          {/* the clippings wall, pre-rendered to one image so scrolling stays smooth */}
          <picture>
            <source media="(max-width: 767px)" srcSet="/art/case/press-wall-m.webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/case/press-wall.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </picture>
          <div className="press__shade absolute inset-0 bg-[radial-gradient(50%_55%_at_50%_50%,rgba(10,9,6,0.9),rgba(10,9,6,0.74)_60%,rgba(10,9,6,0.7)_100%)]" />
        </div>
      </div>

      <div className="wrap relative">
        <BurnPaper>
          <span className="paper__stain" aria-hidden="true" />

          {/* top strip */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <span className="meta !text-[10px]">Vol. I, No. 1</span>
            <span className="paper__extra">Extra</span>
            <span className="meta !text-[10px]">Price: 0% tax</span>
          </div>

          {/* masthead */}
          <header className="border-y-[3px] border-double border-[var(--ink)] py-3 text-center">
            <h3 className="display paper__mast">The Daily Chart</h3>
          </header>
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-[var(--ink)] py-1.5">
            <span className="meta !text-[10px]">2026. Morning edition.</span>
            <span className="meta hidden !text-[10px] sm:inline">All the news that holds</span>
            <span className="meta !text-[10px]">Weather: volatile</span>
          </div>

          {/* the splash */}
          <div className="relative mt-7">
            <h4 className="display paper__head">Jeeting outlawed</h4>
            <p className="paper__deck">Smart contract caps every wallet at 1% on day one, then lets go a day at a time. Whales furious. Everyone else: relieved.</p>
          </div>

          {/* the page */}
          <div className="paper__grid">
            <figure className="paper__lead">
              <div className="paper__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/boxing.webp" alt="A bear on the canvas after trying to dump." width={1200} height={1500} loading="lazy" />
              </div>
              <figcaption className="meta mt-2 !text-[9.5px] !tracking-[0.1em] opacity-70">A bear, moments after trying to dump. Photo: staff.</figcaption>
            </figure>

            <div className="paper__col">
              <p className="paper__body">
                <span className="paper__drop">I</span>n a move whales are calling &ldquo;unfair&rdquo; and everyone else is calling &ldquo;about
                time&rdquo;, a memecoin has written diamond hands directly into its contract. Every wallet gets one successful non-zero
                outbound transaction per rolling 24 hours, capped at 1% of its holdings on day one, 2% on day two, and so on until day
                100, when the cuffs come off. Buying is unrestricted. The first sell is available immediately.
              </p>
              <blockquote className="paper__quote">&ldquo;Once live, the mechanism is the mechanism.&rdquo;</blockquote>
              <p className="paper__body">
                Selling remains legal. Dumping does not. Asked whether the rule could be changed later, the contract declined to
                comment, on the grounds that it has no owner switch, no whitelist and no adjustable curve. Full story, page 3.
                Tokenomics, page 9.
              </p>
            </div>

            <aside className="paper__side">
              <div className="paper__box">
                <p className="meta !text-[10px]">Markets</p>
                <dl className="mt-2 space-y-1.5">
                  {[["Day 1 max", "1%"], ["Day 100 max", "100%"], ["Cooldown", "24h"], ["Tax", "0%"]].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dotted border-[var(--ink)]/40 pb-1">
                      <dt className="text-[12px]">{k}</dt>
                      <dd className="display text-[22px] leading-none">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="paper__wanted">
                <p className="display text-center text-[26px] leading-none">Wanted</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/case/lineup.webp" alt="The usual suspects." loading="lazy" />
                <p className="mt-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.06em]">Whale. KOL. Sniper. Dev.</p>
              </div>
            </aside>
          </div>

          {/* index */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-double border-[var(--ink)] pt-3">
            {["Inside", "The 100-day curve, p.3", "Whales, p.5", "The interrogation, p.7", "Tokenomics, p.9"].map((t, i) => (
              <span key={t} className={`meta !text-[10px] ${i === 0 ? "bg-[var(--ink)] px-2 py-0.5 text-[var(--paper)]" : ""}`}>{t}</span>
            ))}
          </div>
        </BurnPaper>
      </div>
    </section>
  );
}

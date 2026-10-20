import Calculator from "./Calculator";
import SceneBg from "./SceneBg";
import SecHead from "./SecHead";
import Lamp from "./Lamp";
import PinnedCard from "./PinnedCard";
import Rip from "./Rip";

/* ---------------------------------------------------------------- */
/* 01. The crime, as a triptych.                                     */
/* ---------------------------------------------------------------- */
/* 02. The rules, as four exhibits.                                   */
/* ---------------------------------------------------------------- */
const EXHIBITS = [
  {
    tag: "Exhibit A", mark: "A", title: "Buy freely", big: "∞",
    lines: ["There is no buy cooldown. Buy 1 or 100,000,000.", "Receiving $DIAMOND never starts or resets it."],
  },
  {
    tag: "Exhibit B", mark: "B", title: "Sell immediately", big: "Now",
    lines: ["Your first outbound is available straight away.", "There is no initial 24-hour lock."],
  },
  {
    tag: "Exhibit C", mark: "C", title: "Day 1: max 1%", big: "1%",
    lines: ["On Day 1, an outbound can move up to 1% of your current bag. Day 2, 2%. Day 100, 100%.", "Then the limit is gone."],
  },
  {
    tag: "Exhibit D", mark: "D", title: "Then 24 hours", big: "24h",
    lines: ["Each outbound starts your own rolling 24-hour cooldown, so wallets never unlock all at once.", "Unused allowance never carries over."],
  },
];

export function EvidenceBoard() {
  return (
    <section id="rule" className="sec sec--night2 scroll-mt-16 overflow-hidden">
      <SceneBg src="/art/case/pattern.webp" tone="var(--night-2)" height="min(92vh, 900px)" opacity={0.5} position="center 30%" />
      <div className="wrap relative">
        <SecHead n="02" label="The rules" size="h-m" title="Four rules. No exceptions." aside="Same for every wallet. Fixed in the contract. Strongest when the market is youngest." />

        <div className="mt-16 grid border-l border-t border-[var(--line-d)] sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          {EXHIBITS.map((e, i) => {
            const card = (
            <article
              key={e.tag}
              className="group relative flex min-h-[440px] flex-col border-b border-r border-[var(--line-d)] p-7 transition-colors duration-500 hover:bg-[var(--night-3)] max-sm:min-h-0 max-sm:p-6 sm:p-8"
              data-fx="rise"
              data-fx-delay={i * 0.08}
            >
              <div className="flex items-start justify-between">
                <span className="meta text-[var(--lime)]">{e.tag}</span>
                <span className="display text-[44px] leading-none text-transparent [-webkit-text-stroke:1px_rgba(236,230,214,0.25)]">{e.mark}</span>
              </div>
              <h3 className="display mt-10 whitespace-nowrap text-[clamp(26px,2.3vw,36px)] max-sm:mt-5">{e.title}</h3>
              <p className="display mt-5 text-[clamp(56px,4.6vw,76px)] font-bold leading-[0.9] text-[var(--lime)] max-sm:mt-3">
                {e.big === "∞" ? (
                  <svg viewBox="0 0 120 60" className="inline-block h-[0.62em] w-auto align-baseline" aria-label="Unlimited">
                    <path d="M60 30 C 46 8, 12 8, 12 30 C 12 52, 46 52, 60 30 C 74 8, 108 8, 108 30 C 108 52, 74 52, 60 30 Z" fill="none" stroke="currentColor" strokeWidth="9" />
                  </svg>
                ) : (
                  e.big
                )}
              </p>
              <div className="mt-auto space-y-3 pt-10 max-sm:pt-6">
                {e.lines.map((l) => (
                  <p key={l} className="body-s text-[var(--bone)]/70">{l}</p>
                ))}
              </div>
            </article>
            );
            // the last exhibit is only held up by two pins
            return i === EXHIBITS.length - 1 ? <PinnedCard key={e.tag}>{card}</PinnedCard> : card;
          })}
        </div>

        <div className="mt-20 lg:mt-28" data-fx="rise">
          <Calculator />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 03. Whales. A booking photo and the arithmetic.                    */
/* ---------------------------------------------------------------- */
export function Wanted() {
  const rows = ["7'0\"", "6'0\"", "5'0\"", "4'0\"", "3'0\""];
  return (
    <section className="sec sec--light overflow-hidden">
      <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-24">
        <figure className="relative m-0">
          <div className="vf relative overflow-hidden bg-[var(--night)]" data-fx="img">
            <span className="vf__b" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/case/interrogation.webp" alt="The whale, in interrogation room 3." className="block aspect-[4/5] w-full object-cover object-[78%_center]" loading="lazy" />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-[12%]">
              {rows.map((r) => (
                <div key={r} className="flex items-center gap-3 px-5">
                  <span className="mono text-[11px] text-[var(--bone)]/70">{r}</span>
                  <span className="h-px flex-1 bg-[var(--bone)]/25" />
                </div>
              ))}
            </div>
          </div>
          <figcaption className="mt-px flex items-center justify-between bg-[var(--ink)] px-5 py-4 text-[var(--bone)]">
            <div>
              <p className="meta opacity-50">Holder No. 0005</p>
              <p className="display mt-1 text-[30px] leading-none">The whale</p>
            </div>
            <div className="text-right">
              <p className="meta opacity-50">Bag size</p>
              <p className="display mt-1 text-[30px] leading-none text-[var(--lime)]">5% of supply</p>
            </div>
          </figcaption>
          <span className="stamp absolute -right-3 top-6 bg-[var(--bone)] !text-[16px] max-sm:right-3 sm:!text-[20px]" data-fx="stamp" data-rot="8" data-fx-delay="0.6">
            Can&apos;t dump
          </span>
        </figure>

        <div>
          <SecHead n="03" label="Whales" size="h-m" title={<>Whales can buy.<br />Can&apos;t nuke the chart.</>} />
          <p className="body-l mt-8 max-w-[560px] opacity-80" data-fx="rise">
            A whale owning 5% of the supply does not get to dump 5% into the pool. On Day 1, its maximum next outbound is:
          </p>

          <div className="mt-8 grid max-w-[620px] grid-cols-[1fr_auto_1fr] items-end gap-4 border-y border-[var(--line-l)] py-8" data-fx="rise">
            <div>
              <p className="meta opacity-50">1% of its 5% bag</p>
              <p className="display mt-3 text-[clamp(48px,5vw,72px)] leading-none">1% × 5%</p>
            </div>
            <span className="display pb-1 text-[48px] leading-none opacity-30">=</span>
            <div className="text-right">
              <p className="meta opacity-50">of total supply</p>
              <p className="display mt-3 inline-block bg-[var(--lime)] px-2 text-[clamp(48px,5vw,72px)] leading-none">0.05%</p>
            </div>
          </div>

          <p className="body-l mt-8 max-w-[560px] opacity-80" data-fx="rise">
            Then it waits 24 hours. The next day the limit is a little higher, worked out from whatever balance remains. By the time a whale can move the whole bag, the market has had 100 days to grow up.
          </p>

          <p className="display mt-12 text-[clamp(40px,3.6vw,56px)] leading-none" data-fx="rise">Big bag? Same rules.</p>
          <ul className="mt-6 border-t border-[var(--line-l)]">
            {["No special whale rules", "No VIP wallets", "No exceptions for insiders"].map((t, i) => (
              <li key={t} className="flex items-center justify-between border-b border-[var(--line-l)] py-4" data-fx="rise" data-fx-delay={i * 0.06}>
                <span className="text-[17px] font-medium">{t}</span>
                <span className="stamp !border-2 !px-2 !py-1 !text-[11px]" data-fx="stamp" data-rot={i % 2 ? 4 : -4} data-fx-delay={0.4 + i * 0.15}>
                  Denied
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 04. The interrogation, under one lamp.                             */
/* ---------------------------------------------------------------- */
export function Interrogation() {
  return (
    <section id="why" className="sec relative scroll-mt-16 overflow-hidden bg-black !pb-[clamp(140px,15vw,230px)]">
      <Rip color="var(--bone)" seed={13} inside />
      <SceneBg src="/art/case/surveillance.webp" tone="#000" height="min(100vh, 960px)" opacity={0.42} position="center 40%" />
      {/* the room's only other light; it swings if you knock it */}
      <Lamp />
      <div className="wrap relative">
        <div className="mx-auto max-w-[1100px] text-center">
          <div className="mx-auto max-w-[520px]">
            <div className="idx meta justify-center" data-fx="rise">
              <span className="idx__rule" />
              <span className="idx__n">04</span>
              <span>The interrogation</span>
              <span className="idx__rule" />
            </div>
          </div>

          <p className="term mx-auto mt-10 text-[14px] uppercase tracking-[0.06em] text-[var(--lime)] lg:whitespace-nowrap xl:text-[15px]" data-fx="type">
            &gt; Memecoins have always rewarded diamond hands. $DIAMOND makes them the mechanism.
          </p>
          <h2 className="display h-l mx-auto mt-8 max-w-[1100px]" data-fx="lines">
            What if the contract made mass-dumping impossible?
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-[980px] gap-px bg-[var(--line-d)] sm:grid-cols-3">
          {["You can still take profit.", "You can still leave.", "You can still sell from Day 1."].map((t, i) => (
            <div key={t} className="bg-black p-6 sm:p-7" data-fx="rise" data-fx-delay={i * 0.08}>
              <span className="meta text-[var(--lime)]">Permitted</span>
              <p className="mt-3 text-[19px] leading-snug">{t}</p>
            </div>
          ))}
        </div>


        <div className="mt-24 grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <figure className="m-0">
            <div className="vf overflow-hidden" data-fx="img">
              <span className="vf__b" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/say-sell-again.webp" alt="Say sell again." className="block aspect-[16/10] w-full object-cover" loading="lazy" />
            </div>
            <figcaption className="meta mt-4 flex justify-between opacity-60">
              <span>Exhibit: &ldquo;say sell again&rdquo;</span>
              <span>Room 3</span>
            </figcaption>
          </figure>
          <div>
            <p className="display h-l" data-fx="lines">
              Selling is allowed.
              <br />
              <span className="text-[var(--red)]">Dumping isn&apos;t.</span>
            </p>
            <p className="body-l mt-8 max-w-[520px] opacity-80" data-fx="rise">
              This is not a lockup. The limit is on how fast one wallet can exit, and it eases off every single day.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-5">
              <span className="meta opacity-60" data-fx="rise">Welcome to:</span>
              <span className="stamp stamp--lime !text-[20px] sm:!text-[26px]" data-fx="stamp" data-rot="-4" data-fx-delay="0.3">
                The anti-jeet meta
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ITEMS = [
  "Buy freely",
  "Sell from day one",
  "Day 1: max 1%",
  "Day 100: max 100%",
  "Rolling 24h cooldown",
  "No whale exceptions",
  "0% tax",
  "0% team",
  "90% genesis liquidity",
  "10% reserved",
  "Read the contract",
];

export default function Ticker() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker relative z-[1] bg-[var(--lime)] py-5 text-[var(--ink)]" aria-label={ITEMS.join(". ")}>
      <div className="ticker__track" aria-hidden="true">
        {row.map((t, i) => (
          <span key={i} className="display flex items-center gap-8 pr-8 text-[clamp(28px,3.4vw,48px)] leading-none">
            {t}
            <span className="inline-block h-[0.16em] w-[0.16em] rounded-full bg-[var(--ink)]" />
          </span>
        ))}
      </div>
    </div>
  );
}

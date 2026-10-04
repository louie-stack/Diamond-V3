export const CA = "0x0000000000000000000000000000000000000000";
export const CA_SHORT = "0x0000...0000";

// Swap these for the live URLs at launch.
export const LINKS = {
  // "#buy" opens the in-page checkout (src/components/Checkout.tsx).
  buy: "#buy",
  contract: "#",
  lpLock: "#",
  dexscreener: "#",
  x: "#",
  telegram: "#",
};

// Checkout. UNCONFIRMED: paid in ETH. The teaser says "Coming to Robinhood Chain" (EVM, ETH gas).
// demoPrice is a placeholder (ETH per token) so the quote has something to show
// before launch; set live: true and replace the simulated sign step at launch.
export const CHECKOUT = {
  live: false,
  currency: "ETH",
  demoPrice: 0.00000004,
  gas: "0.0012",
};

export const NAV = [
  { label: "Teaser", href: "#teaser" },
  { label: "The 1% Rule", href: "#rule" },
  { label: "Why Diamond", href: "#why" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "Contract", href: "#contract" },
  { label: "X", href: LINKS.x, external: true },
  { label: "Telegram", href: LINKS.telegram, external: true },
];

export const FAQ = [
  {
    q: "How does the 1% rule actually work?",
    a: "Every wallet gets one successful non-zero outbound transaction per rolling 24 hours, capped at 1% of its balance immediately before that transaction.",
  },
  {
    q: "Can I sell as soon as I buy?",
    a: "Yes. Your first eligible outbound transaction is immediately available. The 24-hour cooldown begins only after you successfully make one.",
  },
  {
    q: "Does buying more reset my cooldown?",
    a: "No. Incoming $DIAMOND does not affect your cooldown.",
  },
  {
    q: "Can I save up my 1% allowance?",
    a: "No. If your maximum is 1% and you only use 0.2%, you still can only sell 1% in the next period. Nothing accumulates.",
  },
  {
    q: "Does the rule only apply to sells?",
    a: "No. Technically, it applies to outbound $DIAMOND movement from the wallet. That includes transfers as well as sells. This is to prevent manipulation of the mechanism.",
  },
  {
    q: "What about the DEX?",
    a: "The canonical $DIAMOND liquidity pair is unrestricted when sending tokens so normal buys can function. All holders remain subject to the normal outbound rule when sending $DIAMOND into the pool.",
  },
  {
    q: "Can the team change the 1% or 24-hour rule later?",
    a: "No. They are fixed in the contract.",
  },
  {
    q: "Can the team whitelist a wallet?",
    a: "No. There is no permanent holder-exemption system.",
  },
  {
    q: "Is this a honeypot?",
    a: "No. No hidden sell switch exists. Honeypots do not allow buyers to sell at all. $DIAMOND allows holders to sell a maximum of 1% of current holdings per day. Selling is deliberately restricted by the publicly disclosed 1%-per-24-hour mechanism, and that mechanism applies equally to all holders. The contract is verified. Read it.",
    cta: true,
  },
];

export const TOKENOMICS = [
  { k: "Total supply", v: "1B", s: "$DIAMOND" },
  { k: "Genesis liquidity", v: "100%", s: "of supply" },
  { k: "Team tokens", v: "0%", s: "none" },
  { k: "Presale", v: "0%", s: "none" },
  { k: "Tax", v: "0%", s: "on transfers" },
  { k: "Minting", v: "Never", s: "fixed supply" },
  { k: "Max outbound", v: "1%", s: "of current wallet balance" },
  { k: "Cooldown", v: "24h", s: "after each successful non-zero outbound" },
];

export const MEMES = [
  { src: "/art/briefcase.webp", cap: "Exhibit 01. The bag." },
  { src: "/art/boxing.webp", cap: "Exhibit 02. Rekt bears." },
  { src: "/art/matrix.webp", cap: "Exhibit 03. Dodge every sell." },
  { src: "/art/vader.webp", cap: "Exhibit 04. Sell, you will not." },
  { src: "/art/aristocrat.webp", cap: "Exhibit 05. Old money. New hands." },
  { src: "/art/fiat.webp", cap: "Exhibit 06. Fiat. Burned." },
  { src: "/art/precious.webp", cap: "Exhibit 07. My precious bag." },
  { src: "/art/gaming.webp", cap: "Exhibit 08. Mining diamonds." },
  { src: "/art/say-sell-again.webp", cap: "Exhibit 09. Say sell again." },
];

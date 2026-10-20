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
  { label: "The 100-Day Curve", href: "#curve" },
  { label: "Why Diamond", href: "#why" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "Contract", href: "#contract" },
  { label: "X", href: LINKS.x, external: true },
  { label: "Telegram", href: LINKS.telegram, external: true },
];

export const FAQ = [
  {
    q: "How does the 100-day curve actually work?",
    a: "The sell limit follows the age of the protocol. On Day 1, every wallet can move up to 1% of its current balance in one successful outbound transaction per rolling 24 hours. Day 2 is 2%, Day 3 is 3%, and so on until Day 100, which is 100%.",
  },
  {
    q: "What happens after Day 100?",
    a: "Normal holders are effectively unrestricted. $DIAMOND protects its early market, then gets out of the way and trades like any other memecoin.",
  },
  {
    q: "Is it the same percentage for everyone?",
    a: "Yes. Every normal holder runs on the same global curve for that day. No VIP wallets, no discretionary exemptions. What differs is each wallet's own 24-hour clock, so wallets never all unlock and sell at the same moment.",
  },
  {
    q: "Can I sell as soon as I buy?",
    a: "Yes. This is not a lockup. Your first eligible outbound transaction is available immediately. The 24-hour cooldown begins only after you successfully make one.",
  },
  {
    q: "Does buying more reset my cooldown?",
    a: "No. Incoming $DIAMOND does not affect your cooldown.",
  },
  {
    q: "Can I save up my allowance?",
    a: "No. If today's maximum is 5% and you only use 1%, you still can only use that day's percentage in the next period. Nothing accumulates.",
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
    q: "What is the Reserve?",
    a: "10% of the supply, set aside at launch. Whoever ends up holding it is limited to 1% of its balance per rolling 24 hours, permanently, even after Day 100. Nobody gets to be the ultimate jeet. That is all we are saying.",
  },
  {
    q: "Can the team change the curve or the 24-hour rule later?",
    a: "No. There is no adjustable curve, no insider exemption and no hidden switch. Once live, the mechanism is the mechanism.",
  },
  {
    q: "Can the team whitelist a wallet?",
    a: "No. There is no permanent holder-exemption system.",
  },
  {
    q: "Is this a honeypot?",
    a: "No. No hidden sell switch exists. Honeypots do not allow buyers to sell at all. $DIAMOND lets every holder sell from Day 1, starting at 1% of current holdings per 24 hours and rising 1% a day until Day 100, after which normal holders are unrestricted. The mechanism is publicly disclosed and applies equally to all holders. The contract is verified. Read it.",
    cta: true,
  },
];

export const TOKENOMICS = [
  { k: "Total supply", v: "1B", s: "$DIAMOND, fixed" },
  { k: "Genesis liquidity", v: "90%", s: "of supply, at launch" },
  { k: "The Reserve", v: "10%", s: "Set aside. Unclaimed." },
  { k: "Team tokens", v: "0%", s: "none" },
  { k: "Presale", v: "0%", s: "none" },
  { k: "Tax", v: "0%", s: "on transfers" },
  { k: "Max outbound", v: "1%", s: "on Day 1. 100% on Day 100." },
  { k: "Cooldown", v: "24h", s: "per wallet, after each successful outbound" },
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

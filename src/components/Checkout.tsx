"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHECKOUT, LINKS } from "@/content";
import { sfx } from "@/lib/sfx";

/**
 * Buy flow, styled as a case file you sign. Opens from any link to #buy.
 * Until launch it runs in demo mode: the quote uses CHECKOUT.demoPrice and the
 * wallet and transaction are simulated. Wire CHECKOUT.live + a router at launch.
 */
type Step = "amount" | "wallet" | "review" | "sign" | "done";
const STEPS: { id: Step; label: string }[] = [
  { id: "amount", label: "Amount" },
  { id: "wallet", label: "Wallet" },
  { id: "review", label: "Review" },
  { id: "sign", label: "Sign" },
  { id: "done", label: "Receipt" },
];
const WALLETS = ["MetaMask", "Coinbase Wallet", "Rabby", "WalletConnect"];
const PRESETS = ["0.05", "0.1", "0.25", "0.5", "1"];
const SLIPPAGE = [0.5, 1, 3];

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const hex = (n: number) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

type LenisLike = { stop: () => void; start: () => void };

export default function Checkout() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("0.25");
  const [ack, setAck] = useState(false);
  const [slip, setSlip] = useState(1);
  const [wallet, setWallet] = useState<string | null>(null);
  const [addr, setAddr] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [tx, setTx] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const eth = parseFloat(amount) || 0;
  const quote = useMemo(() => {
    const gross = eth / CHECKOUT.demoPrice;
    const impact = Math.min(0.08, eth * 0.004);
    const out = gross * (1 - impact);
    const min = out * (1 - slip / 100);
    return { out, min, impact, allowance: out * 0.01 };
  }, [eth, slip]);
  const tooLow = eth <= 0;
  const tooHigh = eth > 50;

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.();
  }, []);

  // open from any #buy link
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#buy"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      opener.current = a;
      setStep("amount");
      setStage(0);
      setOpen(true);
      sfx.flip();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // lock the page behind
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      setTimeout(() => panel.current?.querySelector<HTMLElement>("input, button")?.focus(), 60);
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape" && step !== "sign") close();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href]");
        if (!f.length) return;
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, close]);

  const connect = (name: string) => {
    setConnecting(name);
    sfx.tick();
    setTimeout(() => {
      setWallet(name);
      setAddr(`0x${hex(4).toUpperCase()}...${hex(4).toUpperCase()}`);
      setConnecting(null);
      setStep("review");
      sfx.ching();
    }, 1100);
  };

  const sign = () => {
    setStep("sign");
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 1300);
    const t2 = setTimeout(() => setStage(2), 2400);
    const t3 = setTimeout(() => {
      setTx(`0x${hex(8)}...${hex(6)}`);
      setStep("done");
      sfx.thud();
      sfx.ching();
    }, 3600);
    return () => [t1, t2, t3].forEach(clearTimeout);
  };

  const idx = STEPS.findIndex((s) => s.id === step);
  const shareText = encodeURIComponent(
    `Just bought ${fmt(quote.out)} $DIAMOND. Day 1 I can sell 1%. Day 100, all of it. I can't jeet. Diamond hands, enforced by code.`
  );

  if (!open) return null;

  return (
    <div className="checkout" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <button type="button" aria-label="Close checkout" className="checkout__scrim" onClick={() => step !== "sign" && close()} />
      <div ref={panel} className="checkout__panel" data-lenis-prevent="">
        {/* header */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line-d)] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/case/logo.png" alt="" className="h-10 w-10" />
            <div>
              <p id="checkout-title" className="display text-[26px] leading-none">Buy $DIAMOND</p>
              <p className="meta mt-1.5 !text-[10px] text-[var(--bone)]/50">
                {CHECKOUT.live ? "Live" : "Demo mode until launch"} <span className="mx-1.5 opacity-50">/</span> Form DH-1
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={step === "sign"}
            className="grid h-10 w-10 shrink-0 place-items-center border border-[var(--line-d)] transition-colors hover:border-[var(--bone)] disabled:opacity-30"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {/* steps */}
        <ol className="grid grid-cols-5 gap-1 px-6 pt-5 sm:px-8">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <span className={`block h-[2px] ${i <= idx ? "bg-[var(--lime)]" : "bg-[var(--line-d)]"}`} />
              <span className={`meta mt-2 block !text-[9.5px] !tracking-[0.12em] ${i === idx ? "text-[var(--bone)]" : "text-[var(--bone)]/35"}`}>{s.label}</span>
            </li>
          ))}
        </ol>

        <div className="flex-1 px-6 py-8 sm:px-8">
          {step === "amount" && (
            <div>
              <label className="meta block text-[var(--bone)]/50" htmlFor="buy-amount">You pay</label>
              <div className="mt-3 flex items-end gap-4">
                <input
                  id="buy-amount"
                  inputMode="decimal"
                  className="field"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  aria-describedby="buy-quote"
                />
                <span className="display pb-2 text-[30px] leading-none">{CHECKOUT.currency}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setAmount(p)} className={`chip ${amount === p ? "is-on" : ""}`}>
                    {p}
                  </button>
                ))}
              </div>

              <div id="buy-quote" className="mt-8 border border-[var(--line-d)] bg-[var(--night)] p-5">
                <p className="meta text-[var(--bone)]/50">You receive (est.)</p>
                <p className="display mt-2 text-[44px] leading-none tabular-nums">
                  {tooLow ? "0" : fmt(quote.out)} <span className="text-[20px] text-[var(--lime)]">$DIAMOND</span>
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--line-d)] pt-4">
                  <div>
                    <p className="meta !text-[10px] text-[var(--bone)]/50">Tax</p>
                    <p className="mono mt-1 text-[17px]">0%</p>
                  </div>
                  <div>
                    <p className="meta !text-[10px] text-[var(--bone)]/50">Day 1 sell limit</p>
                    <p className="mono mt-1 text-[17px]">{tooLow ? "0" : fmt(quote.allowance)}</p>
                  </div>
                </div>
              </div>

              <label className="mt-7 flex cursor-pointer items-start gap-3.5">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="checkout__check mt-0.5" />
                <span className="body-s text-[var(--bone)]/80">
                  I understand: one outbound transaction per rolling 24 hours, max 1% of my holdings on Day 1, rising 1% a day until Day 100.{" "}
                  <span className="text-[var(--bone)]">I can sell. I can&apos;t jeet.</span>
                </span>
              </label>

              {tooHigh && <p className="mono mt-4 text-[13px] text-[var(--red)]">Easy, whale. Max 50 {CHECKOUT.currency} per order.</p>}

              <button
                type="button"
                disabled={!ack || tooLow || tooHigh}
                onClick={() => {
                  setStep(wallet ? "review" : "wallet");
                  sfx.tick();
                }}
                className="btn btn--lime mt-8 w-full disabled:pointer-events-none disabled:opacity-35"
              >
                Continue <span className="btn__arrow" aria-hidden="true" />
              </button>
            </div>
          )}

          {step === "wallet" && (
            <div>
              <p className="display text-[36px] leading-none">Connect a wallet</p>
              <p className="body-s mt-3 text-[var(--bone)]/60">Pick the wallet that will hold the bag.</p>
              <div className="mt-7 border-t border-[var(--line-d)]">
                {WALLETS.map((w, i) => (
                  <button
                    key={w}
                    type="button"
                    disabled={!!connecting}
                    onClick={() => connect(w)}
                    className="group flex w-full items-center justify-between border-b border-[var(--line-d)] py-5 text-left transition-colors hover:text-[var(--lime)] disabled:opacity-60"
                  >
                    <span className="flex items-center gap-5">
                      <span className="meta text-[var(--bone)]/40">0{i + 1}</span>
                      <span className="text-[19px] font-medium">{w}</span>
                    </span>
                    <span className="meta text-[var(--bone)]/50 group-hover:text-[var(--lime)]">
                      {connecting === w ? <span className="checkout__spin" /> : "Connect"}
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep("amount")} className="meta link-u mt-7 text-[var(--bone)]/60">
                Back
              </button>
            </div>
          )}

          {step === "review" && (
            <div>
              <p className="display text-[36px] leading-none">Review the order</p>
              <dl className="mt-6 border-t border-[var(--line-d)]">
                {[
                  ["Wallet", `${wallet} · ${addr}`],
                  ["You pay", `${amount} ${CHECKOUT.currency}`],
                  ["You receive (est.)", `${fmt(quote.out)} $DIAMOND`],
                  ["Minimum received", `${fmt(quote.min)} $DIAMOND`],
                  ["Price impact", `${(quote.impact * 100).toFixed(2)}%`],
                  ["Network fee (est.)", `${CHECKOUT.gas} ${CHECKOUT.currency}`],
                  ["Tax", "0%"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-[var(--line-d)] py-3">
                    <dt className="meta !text-[10px] text-[var(--bone)]/50">{k}</dt>
                    <dd className="mono text-right text-[13px]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <p className="meta !text-[10px] text-[var(--bone)]/50">Slippage</p>
                <div className="mt-2.5 flex gap-2">
                  {SLIPPAGE.map((s) => (
                    <button key={s} type="button" onClick={() => setSlip(s)} className={`chip ${slip === s ? "is-on" : ""}`}>
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-7 border-l-2 border-[var(--lime)] bg-[var(--night)] py-4 pl-5 pr-4">
                <p className="body-s text-[var(--bone)]/85">
                  On Day 1, you can move up to <span className="text-[var(--lime)]">{fmt(quote.allowance)} $DIAMOND</span> once every 24h. The
                  limit rises every day until Day 100. No exceptions. Not even for you.
                </p>
              </div>
              <button type="button" onClick={sign} className="btn btn--lime mt-7 w-full">
                Sign &amp; buy <span className="btn__arrow" aria-hidden="true" />
              </button>
              <div className="mt-5 flex justify-between">
                <button type="button" onClick={() => setStep("amount")} className="meta link-u text-[var(--bone)]/60">
                  Edit amount
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWallet(null);
                    setStep("wallet");
                  }}
                  className="meta link-u text-[var(--bone)]/60"
                >
                  Switch wallet
                </button>
              </div>
            </div>
          )}

          {step === "sign" && (
            <div className="py-4">
              <p className="display text-[36px] leading-none">Processing</p>
              <ul className="mt-8 border-t border-[var(--line-d)]">
                {["Waiting for signature in " + wallet, "Broadcasting transaction", "Confirming on-chain"].map((t, i) => (
                  <li key={t} className="flex items-center gap-5 border-b border-[var(--line-d)] py-5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center border ${
                        stage > i ? "border-[var(--lime)] bg-[var(--lime)] text-[var(--ink)]" : stage === i ? "border-[var(--lime)] text-[var(--lime)]" : "border-[var(--line-d)] text-[var(--bone)]/30"
                      }`}
                    >
                      {stage > i ? (
                        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                      ) : stage === i ? (
                        <span className="checkout__spin" />
                      ) : (
                        <span className="mono text-[12px]">{i + 1}</span>
                      )}
                    </span>
                    <span className={`text-[17px] ${stage < i ? "text-[var(--bone)]/35" : ""}`}>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="meta mt-8 text-[var(--bone)]/40">Don&apos;t close this file.</p>
            </div>
          )}

          {step === "done" && (
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="meta text-[var(--bone)]/50">Receipt</p>
                <span className="stamp stamp--lime stamp-in !text-[13px]">Diamond hands certified</span>
              </div>
              <p className="display mt-6 text-[64px] leading-none text-[var(--lime)] tabular-nums">{fmt(quote.out)}</p>
              <p className="term mt-3 text-[16px] uppercase tracking-[0.08em] text-[var(--bone)]/80">&gt; $DIAMOND acquired.</p>
              <dl className="mt-7 border-t border-[var(--line-d)]">
                {[
                  ["Paid", `${amount} ${CHECKOUT.currency}`],
                  ["Wallet", addr],
                  ["Tx", tx],
                  ["First outbound available", "Now"],
                  ["Day 1 max outbound", `${fmt(quote.allowance)} $DIAMOND`],
                  ["After Day 100", "Unrestricted"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-[var(--line-d)] py-3">
                    <dt className="meta !text-[10px] text-[var(--bone)]/50">{k}</dt>
                    <dd className="mono text-right text-[13px]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <a href={`https://x.com/intent/tweet?text=${shareText}`} target="_blank" rel="noreferrer" className="btn btn--lime">
                  Share on X
                </a>
                <a href={LINKS.dexscreener} className="btn btn--line">Chart</a>
              </div>
              <button type="button" onClick={close} className="btn btn--line mt-3 w-full">
                Close the file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

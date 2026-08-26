import { useEffect, useMemo, useRef, useState } from "react";
import { useQuiz } from "../quiz/QuizProvider";
import { Logo } from "../components/Icons";
import {
  OFFER_COPY,
  OFFER_REVIEWS,
  PALM_SECTION,
  resolveArchetype,
  signBlurb,
} from "./copy";
import { formatEuro, moonSignFromDate, resolveTier, risingSignFromTime, sunSignFromDate } from "./pricing";

const TIMER_SEC = 510;

const ARCHETYPE_IMG: Record<string, string> = {
  relationships: "connection-reader",
  life_direction: "path-finder",
  timing: "timing-expert",
  self: "self-reader",
  patterns: "pattern-breaker",
  professional: "work-reader",
  career: "work-reader",
  all: "complete-learner",
};

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="#218c5a" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="#218c5a" strokeWidth="1.6" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.5l7 2.6v5.2c0 4.6-3 8.3-7 9.7-4-1.4-7-5.1-7-9.7V5.1l7-2.6z" fill="#7f4cf2" />
      <path d="M8.6 12.2l2.2 2.2 4.4-4.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 1c.4 4.9 5.1 9.6 10 10-4.9.4-9.6 5.1-10 10-.4-4.9-5.1-9.6-10-10 4.9-.4 9.6-5.1 10-10z"
        fill="#fff"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M0 8.16667L15.5 8.16667C14.7033 8.16667 13.7133 8.64583 12.8967 9.145C11.8075 9.81083 10.8575 10.6833 10.0625 11.6833C9.44417 12.4583 8.83333 13.3817 8.83333 14M15.5 8.16667C14.7033 8.16667 13.7125 7.6875 12.8967 7.18833C11.8075 6.52167 10.8575 5.64917 10.0625 4.65083C9.44417 3.875 8.83333 2.95 8.83333 2.33333"
        stroke="#fff"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** Exact marks from live offer (`SunMark` / `MoonMarkArt` / `RisingMark`). */
function SunSignIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden>
      {Array.from({ length: 12 }, (_, t) => {
        const r = (t * Math.PI) / 6 - Math.PI / 2;
        const n = t % 2 === 0 ? 14 : 11.5;
        return (
          <line
            key={t}
            x1={18 + 8 * Math.cos(r)}
            y1={18 + 8 * Math.sin(r)}
            x2={18 + Math.cos(r) * n}
            y2={18 + Math.sin(r) * n}
          />
        );
      })}
      <circle cx="18" cy="18" r="5.5" />
      <circle cx="18" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MoonSignIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden>
      <circle cx="18" cy="18" r="10" />
      <path d="M 22 9 a 10 10 0 1 0 0 18 a 7 10 0 1 1 0 -18 Z" fill="currentColor" stroke="none" opacity="0.85" />
      <circle cx="9" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="6" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RisingSignIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden>
      {[-30, 0, 30].map((e, t) => {
        const r = ((e - 90) * Math.PI) / 180;
        return (
          <line
            key={t}
            x1={18 + 9 * Math.cos(r)}
            y1={20 + 9 * Math.sin(r)}
            x2={18 + 13 * Math.cos(r)}
            y2={20 + 13 * Math.sin(r)}
          />
        );
      })}
      <path d="M 9 20 A 9 9 0 0 1 27 20 Z" fill="currentColor" stroke="currentColor" />
      <line x1="3" y1="20" x2="33" y2="20" />
      <path d="M 15 28 L 18 24 L 21 28" strokeWidth="1.1" />
      <line x1="18" y1="24" x2="18" y2="30" />
    </svg>
  );
}

function splitPreview(text: string): { clear: string; blur: string } {
  const primary = [" но ", " однако ", " хотя ", " but ", ", "];
  const lo = Math.floor(0.28 * text.length);
  const hi = Math.floor(0.88 * text.length);
  const mid = 0.56 * text.length;
  const cuts: number[] = [];
  for (const token of primary) {
    let from = 0;
    while (from < text.length) {
      const i = text.indexOf(token, from);
      if (i < 0) break;
      const end = i + token.trimEnd().length;
      if (end >= lo && end <= hi) cuts.push(end);
      from = i + token.length;
    }
  }
  let at =
    cuts.length > 0
      ? cuts.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0]!
      : Math.max(1, Math.min(hi, Math.round(mid)));
  return { clear: text.slice(0, at).trimEnd(), blur: text.slice(at).trimStart() };
}

function useCountdown(startSec: number) {
  const [left, setLeft] = useState(startSec);
  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, []);
  return {
    min: String(Math.floor(left / 60)).padStart(2, "0"),
    sec: String(left % 60).padStart(2, "0"),
  };
}

function TimerCell({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="offer-timer-cell">
      <span className="offer-timer-num">{value}</span>
      <span className="offer-timer-unit">{unit}</span>
    </div>
  );
}

function PricingCard({ price, compare }: { price: string; compare: string }) {
  const c = OFFER_COPY;
  return (
    <div className="offer-card">
      <div className="offer-card-head">{c.specialOffer}</div>
      <div className="offer-card-body">
        <p className="offer-card-lead">{c.personalizedReadingFor.replace("{price}", price)}</p>
        <div className="offer-card-rule" />
        <div className="offer-card-row">
          <span className="offer-card-row-strong">{c.totalToday}</span>
          <span className="offer-card-row-strong">{price}</span>
        </div>
        <div className="offer-card-row muted">
          <span>{c.includingTrial}</span>
          <span className="offer-card-prices">
            <s>{compare}</s>
            <b>{c.freeToday}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function CtaPrimary({ label, onClick, sparkle }: { label: string; onClick: () => void; sparkle?: boolean }) {
  return (
    <button type="button" className="offer-cta tap" onClick={onClick}>
      {sparkle ? <SparkIcon /> : null}
      <span>{label}</span>
      {sparkle ? <SparkIcon /> : <ArrowIcon />}
    </button>
  );
}

type PalmMark =
  | { kind: "path"; left: number; top: number; w: number; h: number; viewBox: string; d: string }
  | {
      kind: "rot";
      left: number;
      top: number;
      w: number;
      h: number;
      rot: number;
      lineW: number;
      lineH: number;
      viewBox: string;
      d: string;
    }
  | { kind: "dots"; dots: [number, number][] };

/** Live offer overlays (`tX` / `t1`) — line / dots on the shared hand art. */
const PALM_MARKS: PalmMark[] = [
  {
    kind: "path",
    left: 29,
    top: 54.9,
    w: 10.224,
    h: 29.5,
    viewBox: "0 0 12.2244 31.5004",
    d: "M1.00019 1.00019C14.0002 8.00019 12.0002 24.0002 9.00019 30.5002",
  },
  {
    kind: "path",
    left: 29,
    top: 47.9,
    w: 34,
    h: 29,
    viewBox: "0 0 36.0004 31.0004",
    d: "M1.00021 1.00021C14.5002 4.00021 31.5002 23.5002 35.0002 30.0002",
  },
  {
    kind: "rot",
    left: 54.85,
    top: 48.57,
    w: 14.436,
    h: 7.777,
    rot: 111.34,
    lineW: 2.708,
    lineH: 14.441,
    viewBox: "0 0 4.7074 16.4418",
    d: "M1.00026 1.00026C4.38423 8.86147 4.01821 10.2275 2.98712 15.4416",
  },
  {
    kind: "path",
    left: 40.5,
    top: 39.4,
    w: 27.5,
    h: 20,
    viewBox: "0 0 29.5005 22.0005",
    d: "M1.00027 1.00027C5.50027 14.5003 19.0003 19.0003 28.5003 21.0003",
  },
  {
    kind: "path",
    left: 45.5,
    top: 39.4,
    w: 1.733,
    h: 39.5,
    viewBox: "0 0 3.7329 41.5003",
    d: "M1.00024 1.00024C4.00097 13.0002 2.50114 38.5002 1.00016 40.5002",
  },
  { kind: "dots", dots: [[31, 3.9], [6, 36.9], [42, -0.1], [52, 3.9], [62, 15.9]] },
];

function PalmHand({ variant }: { variant: number }) {
  const mark = PALM_MARKS[variant % PALM_MARKS.length]!;
  return (
    <div className="offer-palm-ico">
      <img src="/images/offer/palm/hand.webp" alt="" aria-hidden />
      {mark.kind === "path" ? (
        <svg
          className="offer-palm-mark"
          viewBox={mark.viewBox}
          preserveAspectRatio="none"
          aria-hidden
          style={{ left: mark.left, top: mark.top, width: mark.w, height: mark.h }}
        >
          <path d={mark.d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      ) : null}
      {mark.kind === "rot" ? (
        <div
          className="offer-palm-mark-rot"
          style={{ left: mark.left, top: mark.top, width: mark.w, height: mark.h }}
        >
          <div style={{ transform: `rotate(${mark.rot}deg)` }}>
            <svg
              viewBox={mark.viewBox}
              preserveAspectRatio="none"
              aria-hidden
              style={{ display: "block", width: mark.lineW, height: mark.lineH, overflow: "visible" }}
            >
              <path d={mark.d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      ) : null}
      {mark.kind === "dots"
        ? mark.dots.map(([left, top], i) => (
            <span key={i} className="offer-palm-dot" style={{ left, top }} aria-hidden />
          ))
        : null}
    </div>
  );
}

export function OfferPage() {
  const { answers, datePick, timePick, reset } = useQuiz();
  const c = OFFER_COPY;
  const tier = resolveTier(answers.price);
  const arch = resolveArchetype(answers.interest);
  const timer = useCountdown(TIMER_SEC);
  const email = answers.email || "you@email.com";
  const initial = (answers.name?.[0] || email[0] || "A").toUpperCase();
  const pageRef = useRef<HTMLDivElement>(null);
  const payRef = useRef<HTMLDivElement>(null);
  const [moreReviews, setMoreReviews] = useState(false);
  const [payInView, setPayInView] = useState(true);

  const sun = useMemo(() => sunSignFromDate(datePick.d, datePick.m), [datePick.d, datePick.m]);
  const moon = useMemo(() => moonSignFromDate(datePick.d, datePick.m), [datePick.d, datePick.m]);
  const rising = useMemo(
    () => risingSignFromTime(datePick.d, datePick.m, timePick.h),
    [datePick.d, datePick.m, timePick.h],
  );

  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const targets = root.querySelectorAll("[data-payment-section]");
    if (!targets.length) return;
    const visible = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
        setPayInView(Array.from(visible.values()).some(Boolean));
      },
      { root, threshold: 0.12 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollPay = () => payRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const onPay = () => {
    window.alert(`${c.localNote}\n\n${tier.label} · ${tier.id}`);
  };

  const archImg = ARCHETYPE_IMG[answers.interest ?? ""] ?? "connection-reader";
  const reviews = moreReviews ? OFFER_REVIEWS : OFFER_REVIEWS.slice(0, 3);
  const preview = splitPreview(arch.whatThisMeans);

  const placements = [
    { role: "sun" as const, label: c.sunLabel, name: sun, icon: <SunSignIcon /> },
    { role: "moon" as const, label: c.moonLabel, name: moon, icon: <MoonSignIcon /> },
    ...(answers.knowTime === "yes"
      ? [{ role: "rising" as const, label: c.risingLabel, name: rising, icon: <RisingSignIcon /> }]
      : []),
  ];

  return (
    <div className="offer-page" ref={pageRef}>
      <header className="offer-top">
        <div className="offer-sticky-top">
          <div className="offer-timer-block">
            <p className="offer-timer-label">{c.discountExpiresIn}</p>
            <div className="offer-timer-row">
              <TimerCell value={timer.min} unit={c.min} />
              <span className="offer-timer-colon">:</span>
              <TimerCell value={timer.sec} unit={c.sec} />
            </div>
          </div>
          <button type="button" className="offer-sticky-cta tap" onClick={scrollPay}>
            {c.getMyResults}
            <ArrowIcon />
          </button>
        </div>
        <div className="offer-sticky-user">
          <div className="offer-sticky-user-bg" aria-hidden>
            <div className="offer-sticky-user-grad" />
            <img src="/images/quiz/checkpoint-bg.webp" alt="" />
            <div className="offer-sticky-user-veil" />
          </div>
          <span className="offer-logo-wrap">
            <Logo width={18} height={26} />
          </span>
          <div className="offer-sticky-user-right">
            <p className="offer-email" title={email}>
              {email}
            </p>
            <span className="offer-avatar" aria-hidden>
              {initial}
            </span>
          </div>
        </div>
      </header>

      <main className="offer-main">
        <section className="offer-pay-section" ref={payRef} data-payment-section>
          <h1 className="offer-title">{c.pageTitle}</h1>
          <PricingCard price={tier.label} compare={tier.compare} />
          <p className="offer-secure">
            <LockIcon />
            {c.guaranteedSecurity}
          </p>
          <h2 className="offer-subhead">{c.trialSubhead.replace("{price}", tier.label)}</h2>
          <p className="offer-legal">{c.subscriptionTerms.replace("{monthly}", formatEuro(5900))}</p>
          <CtaPrimary label={c.getMyReading} onClick={onPay} sparkle />
        </section>

        <section className="offer-arch">
          <div className="offer-arch-head">
            <p className="offer-kicker">{c.archetypeNameLabel}</p>
            <h2 className="offer-arch-name">{arch.name}</h2>
            <p className="offer-kicker">{c.coreEmotionLabel}</p>
            <blockquote className="offer-quote">«{arch.coreEmotion}»</blockquote>
          </div>
          <img
            className="offer-arch-img"
            src={`/images/offer/archetypes/${archImg}.webp`}
            alt=""
            aria-hidden
          />
          <div className="offer-signs">
            <div className="offer-signs-bg" aria-hidden>
              <div className="offer-signs-grad" />
              <img src="/images/quiz/checkpoint-bg.webp" alt="" />
              <div className="offer-signs-veil" />
            </div>
            <div className="offer-signs-inner">
              {placements.map((p) => (
                <div key={p.role} className="offer-sign">
                  <div className="offer-sign-side">
                    <div className="offer-sign-ico">{p.icon}</div>
                    <p className="offer-sign-label">{p.label}</p>
                  </div>
                  <div className="offer-sign-body">
                    <h3>{p.name}</h3>
                    <p>{signBlurb(p.role, p.name)}</p>
                  </div>
                </div>
              ))}

              <div className="offer-means">
                <div className="offer-means-pill">
                  <span>{c.whatThisMeansLabel}</span>
                  <span aria-hidden>📖</span>
                </div>
                <div className="offer-means-copy">
                  <p>
                    {preview.clear}…{" "}
                    {preview.blur ? (
                      <span className="offer-means-blur" aria-hidden>
                        {preview.blur}
                      </span>
                    ) : null}
                  </p>
                  <p className="offer-means-blur" aria-hidden>
                    {arch.whatItCosts}
                  </p>
                  <p className="offer-means-blur" aria-hidden>
                    {arch.whatAstrologistShows}
                  </p>
                </div>
              </div>

              <div className="offer-signs-diamond" aria-hidden>
                <span className="offer-signs-diamond-line" />
                <span className="offer-signs-diamond-dot" />
              </div>
            </div>
          </div>
        </section>

        <section className="offer-palm">
          <h2 className="offer-section-title">{PALM_SECTION.title}</h2>
          <p className="offer-palm-sub">{PALM_SECTION.subtitle}</p>
          <ul className="offer-palm-list">
            {PALM_SECTION.items.map((item, i) => (
              <li key={item.title}>
                <PalmHand variant={i} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="offer-reviews">
          <p className="offer-reviews-badge">
            <span aria-hidden>★★★★★</span> {c.reviewsEyebrow}
          </p>
          <h2 className="offer-section-title">{c.reviewsTitle}</h2>
          <div className="offer-review-list">
            {reviews.map((r) => (
              <article key={r.name} className="offer-review">
                <p className="offer-stars" aria-hidden>
                  ★★★★★
                </p>
                <p>{r.quote}</p>
                <footer>- {r.name}</footer>
              </article>
            ))}
          </div>
          {!moreReviews ? (
            <button type="button" className="offer-more tap" onClick={() => setMoreReviews(true)}>
              {c.showMoreReviews}
            </button>
          ) : null}
        </section>

        <section className="offer-bottom-pay" data-payment-section>
          <PricingCard price={tier.label} compare={tier.compare} />
          <p className="offer-secure">
            <LockIcon />
            {c.guaranteedSecurity}
          </p>
          <h2 className="offer-subhead">{c.trialSubhead.replace("{price}", tier.label)}</h2>
          <p className="offer-legal">{c.subscriptionTerms.replace("{monthly}", formatEuro(5900))}</p>
          <CtaPrimary label={c.getMyReading} onClick={onPay} sparkle />
        </section>

        <section className="offer-guarantee">
          <div className="offer-guarantee-bg" aria-hidden>
            <div className="offer-sticky-user-grad" />
            <img src="/images/quiz/checkpoint-bg.webp" alt="" />
            <div className="offer-sticky-user-veil" />
          </div>
          <div className="offer-guarantee-inner">
            <span className="offer-guarantee-ico" aria-hidden>
              <ShieldCheckIcon />
            </span>
            <h3>{c.moneyBackTitle}</h3>
            <p className="offer-guarantee-copy">{c.moneyBackBody}</p>
            <button type="button" className="offer-again tap" onClick={reset}>
              {c.again}
            </button>
          </div>
        </section>
      </main>

      {!payInView ? (
        <div className="offer-dock">
          <button type="button" className="offer-dock-cta tap" onClick={scrollPay}>
            {c.getMyResults}
            <ArrowIcon />
          </button>
        </div>
      ) : null}
    </div>
  );
}

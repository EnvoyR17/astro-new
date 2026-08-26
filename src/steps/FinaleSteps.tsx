import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QUIZ_COPY } from "../quiz/copy";
import { accentify } from "../quiz/flow";
import { useQuiz } from "../quiz/QuizProvider";
import { Nav } from "../components/Nav";
import { Stars } from "../components/Stars";
import { PalmCamera } from "../palm/PalmCamera";
import { PalmPhoto } from "../palm/PalmPhoto";
import { detectImagePts } from "../palm/tracker";
import { fallbackLandmarks } from "../palm/geometry";
import { OfferPage } from "../offer/OfferPage";

export function Q21Step() {
  const { setPalmCapture, go } = useQuiz();
  const s = QUIZ_COPY.step21;
  const fileRef = useRef<HTMLInputElement>(null);
  const [cam, setCam] = useState(false);
  const [fileError, setFileError] = useState("");
  const [showSkip, setShowSkip] = useState(false);

  const skipPalm = () => {
    setPalmCapture(null, null);
    setCam(false);
    go("q24a");
  };

  const applyFile = async (file: File) => {
    setFileError("");
    if (!file.type.startsWith("image/") || file.size === 0) {
      setFileError("Не удалось прочитать изображение");
      return;
    }
    if (file.size > 0xf00000) {
      setFileError("Файл слишком большой");
      return;
    }
    const url = URL.createObjectURL(file);
    setPalmCapture(url, null);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("load"));
        img.src = url;
      });
      if (!(img.naturalWidth > 0 && img.naturalHeight > 0)) {
        setFileError("Не удалось прочитать изображение");
        return;
      }
      const pts = await detectImagePts(img);
      setPalmCapture(url, pts);
      go("q23");
    } catch {
      setPalmCapture(url, null);
      go("q23");
    }
  };

  const tips = [
    { icon: "check" as const, label: s.tips.flat },
    { icon: "check" as const, label: s.tips.spread },
    { icon: "check" as const, label: s.tips.lighting },
    { icon: "cross" as const, label: s.tips.shadows },
  ];

  const wrongs = [
    "scale(1.55) translate(-6%, 6%)",
    "rotate(180deg)",
    "rotate(-45deg)",
  ];

  return (
    <section className="page lilac">
      {cam ? (
        <PalmCamera
          onCancel={() => {
            setShowSkip(true);
            setCam(false);
          }}
          onDenied={() => {
            setShowSkip(true);
          }}
          onSkip={skipPalm}
          onCapture={(blob, landmarks) => {
            const url = URL.createObjectURL(blob);
            setPalmCapture(url, landmarks.length === 21 ? landmarks : fallbackLandmarks());
            setCam(false);
            go("q23");
          }}
        />
      ) : null}
      <div className="quiz-col palm-guide">
        <Nav />
        <div className="palm-guide-mid">
          <h2 className="q q-palm-guide">{s.title}</h2>
          <div className="palm-guide-examples">
            <div className="palm-guide-ok">
              <div className="palm-guide-hand-box palm-guide-hand-ok">
                <img src="/images/quiz/q21-hand.webp" alt="" />
              </div>
              <div className="palm-guide-ok-label">
                <span className="palm-guide-check-badge" aria-hidden>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#37b24d" />
                    <path
                      d="M6.5 12.3l3.2 3.2L17 8.7"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{s.correct}</span>
              </div>
            </div>
            <div className="palm-guide-wrongs">
              {wrongs.map((transform) => (
                <div key={transform} className="palm-guide-hand-box palm-guide-hand-wrong">
                  <img src="/images/quiz/q21-hand.webp" alt="" style={{ transform }} />
                  <span className="palm-guide-x-badge" aria-hidden>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="12" fill="#fa5252" />
                      <path
                        d="M8 8l8 8M16 8l-8 8"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="palm-guide-sheet">
          <div className="palm-guide-sheet-bg" aria-hidden>
            <div className="palm-guide-sheet-grad" />
            <img src="/images/quiz/checkpoint-bg.webp" alt="" />
            <div className="palm-guide-sheet-veil" />
          </div>
          <div className="palm-guide-tips">
            <p className="palm-guide-tips-title">{s.tipsTitle}</p>
            <div className="palm-guide-tips-list">
              {tips.map((tip) => (
                <div key={tip.label} className="palm-guide-tip">
                  {tip.icon === "cross" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M7 7l10 10M17 7L7 17"
                        stroke="#fa5252"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 12.5l4.2 4.2L19 7"
                        stroke="#37b24d"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <p>{tip.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="palm-guide-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void applyFile(f);
              }}
            />
            <button
              type="button"
              className="palm-guide-upload tap"
              onClick={() => fileRef.current?.click()}
            >
              {s.upload}
            </button>
            {fileError ? (
              <p className="palm-guide-error" role="alert">
                {fileError}
              </p>
            ) : null}
            <button type="button" className="palm-guide-cta tap" onClick={() => setCam(true)}>
              <span>{s.button}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 8.5a2 2 0 012-2h1.2l.9-1.4A1 1 0 019 4.6h6a1 1 0 01.85.5l.9 1.4H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12.5" r="3.2" stroke="#fff" strokeWidth="1.6" />
              </svg>
            </button>
            {showSkip ? (
              <button type="button" className="palm-guide-skip tap" onClick={skipPalm}>
                {s.skip}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}


function SlidingPhrase({ text }: { text: string }) {
  const [current, setCurrent] = useState(text);
  const [exiting, setExiting] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const skipEntrance = useRef(true);

  useEffect(() => {
    if (text === current) return;
    if (exiting) {
      pendingRef.current = text;
      return;
    }
    setExiting(current);
  }, [text, current, exiting]);

  const finishExit = () => {
    if (!exiting) return;
    const next = pendingRef.current ?? text;
    pendingRef.current = null;
    skipEntrance.current = false;
    setExiting(null);
    setCurrent(next);
  };

  return (
    <div className="slide-phrase">
      {exiting ? (
        <p key={`out-${exiting}`} className="slide-phrase-el slide-phrase-out" onAnimationEnd={finishExit}>
          {exiting}
        </p>
      ) : (
        <p
          key={`in-${current}`}
          className={`slide-phrase-el${skipEntrance.current ? "" : " slide-phrase-in"}`}
          role="status"
          aria-live="polite"
        >
          {current}
        </p>
      )}
    </div>
  );
}

const ANALYSIS_MS = 12_000;
const ANALYSIS_QUESTIONS = [
  { triggerAt: 20, storeAs: "readerPatterns" as const, question: QUIZ_COPY.step26.questions.patterns.question },
  { triggerAt: 48, storeAs: "readerSense" as const, question: QUIZ_COPY.step26.questions.sense.question },
  { triggerAt: 76, storeAs: "readerOpenUp" as const, question: QUIZ_COPY.step26.questions.openUp.question },
];

const TRIAL_TIERS = [
  { id: "trial1", cents: 500 },
  { id: "trial2", cents: 900 },
  { id: "trial3", cents: 1300 },
  { id: "trial4", cents: 1767 },
].map((t) => ({
  ...t,
  label: `${(t.cents / 100).toFixed(2).replace(".", ",")} €`,
}));

export function Q23Step() {
  const { go, skipTimedAdvance, palmUrl, palmLandmarks } = useQuiz();
  const phrases = Object.values(QUIZ_COPY.step23.phrases);
  const src = palmUrl || "/images/quiz/q21-hand.webp";
  const [i, setI] = useState(skipTimedAdvance ? phrases.length - 1 : 0);
  const lineCount = skipTimedAdvance ? 4 : Math.min(4, i + 1);

  useEffect(() => {
    if (skipTimedAdvance) return;
    if (i >= phrases.length - 1) {
      const t = window.setTimeout(() => go("q24"), 1600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setI((x) => x + 1), 2200);
    return () => window.clearTimeout(t);
  }, [i, go, phrases.length, skipTimedAdvance]);

  return (
    <section className="page ckpt">
      <Stars />
      <div className="quiz-col">
        <Nav />
        <div className="analyze palm-analyze">
          <PalmPhoto src={src} landmarks={palmLandmarks} visibleCount={lineCount} animate={!skipTimedAdvance} />
          <img className="spiral" src="/images/quiz/q23-spiral.webp" alt="" />
          <SlidingPhrase text={phrases[skipTimedAdvance ? phrases.length - 1 : i]} />
          {skipTimedAdvance ? (
            <button type="button" className="cta-ckpt tap" onClick={() => go("q24")}>
              Продолжить
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function Q24Step() {
  const { go, skipTimedAdvance, palmUrl, palmLandmarks } = useQuiz();
  const s = QUIZ_COPY.step24;
  const src = palmUrl || "/images/quiz/q21-hand.webp";

  useEffect(() => {
    if (skipTimedAdvance) return;
    const t = window.setTimeout(() => go("q24a"), 3200);
    return () => window.clearTimeout(t);
  }, [go, skipTimedAdvance]);

  return (
    <section className="page ckpt">
      <Stars />
      <div className="quiz-col">
        <Nav />
        <div className="analyze palm-analyze">
          <PalmPhoto src={src} landmarks={palmLandmarks} visibleCount={4} animate={false} />
          <h2 className="q">{s.title}</h2>
          <img className="spiral" src="/images/quiz/q24-spiral.webp" alt="" />
          <p className="sub">{s.subtitle}</p>
          {skipTimedAdvance ? (
            <button type="button" className="cta-ckpt tap" onClick={() => go("q24a")}>
              Продолжить
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function Q24aStep() {
  const { answers, setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step24a;
  const ph = s.namePlaceholder[answers.gender ?? "female"];
  const [name, setName] = useState(answers.name ?? "");
  const ready = name.trim().length > 0;

  return (
    <section className="page lilac">
      <div className="quiz-col name-col">
        <Nav />
        <div className="name-body">
          <h2 className="q q-name">{s.question}</h2>
          <p className="sub sub-name">{s.subtext}</p>
          <label className="name-field" htmlFor="lm-input-name">
            <span className="name-label">{s.nameLabel}</span>
            <input
              id="lm-input-name"
              className="name-input"
              value={name}
              placeholder={ph}
              autoComplete="name"
              autoCapitalize="words"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ready) {
                  e.preventDefault();
                  setAnswer("name", name.trim());
                  go("q24b");
                }
              }}
            />
          </label>
          <div className="name-spacer" />
          <button
            type="button"
            className="name-cta tap"
            disabled={!ready}
            onClick={() => {
              if (!ready) return;
              setAnswer("name", name.trim());
              go("q24b");
            }}
          >
            Продолжить
          </button>
        </div>
      </div>
    </section>
  );
}

export function Q24bStep() {
  const { go } = useQuiz();
  const s = QUIZ_COPY.step24b;
  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-expert">
          <div className="expert-hero">
            <img className="expert-hero-img" src="/images/quiz/q24b-main.webp" alt="" />
            <div className="expert-card">
              <img className="expert-avatar" src="/images/quiz/q24b-expert.webp" alt="" />
              <div className="expert-card-text">
                <span className="expert-badge">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <circle cx="8" cy="8" r="7" fill="#1f8a5f" />
                    <path
                      d="M5 8.2 L7 10.2 L11 6"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {s.badge}
                </span>
                <span className="expert-name">Sophie Novak</span>
                <span className="expert-role">{s.role}</span>
              </div>
            </div>
          </div>
          <h2
            className="q q-expert"
            dangerouslySetInnerHTML={{ __html: accentify(s.title) }}
          />
          <p className="sub sub-expert">{s.body}</p>
        </div>
        <div className="expert-cta-wrap">
          <button type="button" className="expert-cta tap" onClick={() => go("q24c")}>
            Продолжить
          </button>
        </div>
      </div>
    </section>
  );
}

export function Q24cStep() {
  const { go } = useQuiz();
  const s = QUIZ_COPY.step24c;
  const chips = Object.entries(s.chips).map(([key, label], i) => ({
    key,
    label,
    image: `/images/quiz/wall-avatar-${i}.webp`,
  }));
  const rows = Array.from({ length: 4 }, (_, row) => chips.filter((_, i) => i % 4 === row)).filter(
    (row) => row.length > 0,
  );

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-wall">
          <div className="social-wall" aria-hidden>
            {rows.map((row, n) => {
              const doubled = [...row, ...row];
              return (
                <div key={n} className="socialWallRow">
                  <div
                    className="socialWallTrack"
                    style={{
                      animation: `${n % 2 === 0 ? "driftL" : "driftR"} ${28 + 6 * n}s linear infinite`,
                    }}
                  >
                    {doubled.map((c, i) => (
                      <span key={`${n}-${i}`} className="chip-person">
                        <img src={c.image} alt="" />
                        <span>{c.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="wall-copy">
            <h2
              className="q q-wall"
              dangerouslySetInnerHTML={{ __html: accentify(s.title) }}
            />
            <p className="sub sub-wall">{s.subtitle}</p>
          </div>
        </div>
        <div className="wall-cta-wrap">
          <button type="button" className="wall-cta tap" onClick={() => go("q25")}>
            Продолжить
          </button>
        </div>
      </div>
    </section>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Q25Step() {
  const { answers, setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step25;
  const [email, setEmail] = useState(answers.email ?? "");
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState("");
  const ready = !!email.trim() && consent;

  const submit = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError(s.validEmail);
      return;
    }
    if (!consent) return;
    setError("");
    setAnswer("email", email.trim());
    go("q26");
  };

  return (
    <section className="page ckpt email-page">
      <div className="email-page-bg" aria-hidden>
        <div className="email-page-grad" />
        <img src="/images/quiz/checkpoint-bg.webp" alt="" />
        <div className="email-page-veil" />
      </div>
      <div className="quiz-col email-col">
        <Nav />
        <form
          className="email-body"
          id="lm-email-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h1 className="q-email">{s.title}</h1>
          <label className="email-field" htmlFor="lm-email">
            <span className="email-label">{s.emailLabel}</span>
            <input
              id="lm-email"
              className={`email-input${error ? " bad" : ""}`}
              type="email"
              autoComplete="email"
              value={email}
              placeholder={s.emailPlaceholder}
              aria-invalid={!!error}
              aria-describedby={error ? "lm-email-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
            {error ? (
              <span id="lm-email-error" className="email-error" role="alert">
                {error}
              </span>
            ) : null}
          </label>
          <div className="email-consent-wrap">
            <label className="email-consent">
              <input
                type="checkbox"
                checked={consent}
                aria-label="Даю согласие на обработку адреса электронной почты для сохранения результатов и отправки информации об аккаунте"
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Даю согласие на обработку адреса электронной почты для сохранения результатов и отправки информации об аккаунте. Подробнее - в{" "}
                <a href="/privacy" className="email-privacy-link">
                  политике конфиденциальности
                </a>
                .
              </span>
            </label>
          </div>
          <p className="email-secure">
            <span aria-hidden>🔒</span>
            {s.secure}
          </p>
          <div className="email-spacer" />
          <button type="submit" className="email-cta tap" disabled={!ready}>
            {s.button}
          </button>
        </form>
      </div>
    </section>
  );
}

export function Q26Step() {
  const { go, skipTimedAdvance, setAnswer } = useQuiz();
  const phrases = Object.values(QUIZ_COPY.step26.phrases);
  const [progress, setProgress] = useState(skipTimedAdvance ? 100 : 0);
  const [pausedQ, setPausedQ] = useState<number | null>(null);
  const [modalOut, setModalOut] = useState(false);
  const [answered, setAnswered] = useState(() => ANALYSIS_QUESTIONS.map(() => false));
  const statusRef = useRef<"running" | "paused" | "done">(skipTimedAdvance ? "done" : "running");
  const frameStartRef = useRef(0);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (skipTimedAdvance) return;
    if (statusRef.current !== "running") return;
    let raf = 0;
    const tick = (now: number) => {
      if (statusRef.current !== "running") return;
      if (!frameStartRef.current) frameStartRef.current = now;
      const elapsed = elapsedRef.current + (now - frameStartRef.current);
      const p = Math.min(elapsed / ANALYSIS_MS, 1);
      const pct = Math.floor(100 * p);
      setProgress(pct);
      const qi = ANALYSIS_QUESTIONS.findIndex((q, i) => !answered[i] && pct >= q.triggerAt);
      if (qi !== -1) {
        statusRef.current = "paused";
        elapsedRef.current = elapsed;
        frameStartRef.current = 0;
        setModalOut(false);
        setPausedQ(qi);
        return;
      }
      if (p >= 1) {
        statusRef.current = "done";
        if (!doneRef.current) {
          doneRef.current = true;
          go("q27");
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pausedQ, answered, go, skipTimedAdvance]);

  const phraseIdx = Math.min(Math.floor((progress / 100) * phrases.length), phrases.length - 1);

  const closeModal = () => {
    setPausedQ(null);
    setModalOut(false);
    statusRef.current = "running";
    frameStartRef.current = 0;
  };

  const answerModal = (value: "yes" | "no") => {
    if (pausedQ === null || modalOut) return;
    const q = ANALYSIS_QUESTIONS[pausedQ];
    setAnswer(q.storeAs, value);
    setAnswered((prev) => {
      const next = [...prev];
      next[pausedQ] = true;
      return next;
    });
    setModalOut(true);
  };

  useEffect(() => {
    if (!modalOut) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      closeModal();
      return;
    }
    const t = window.setTimeout(closeModal, 280);
    return () => window.clearTimeout(t);
  }, [modalOut]);

  return (
    <section className="page ckpt analysis-page">
      <div className="email-page-bg" aria-hidden>
        <div className="email-page-grad" />
        <img src="/images/quiz/checkpoint-bg.webp" alt="" />
        <div className="email-page-veil" />
      </div>
      <div className="quiz-col analysis-col">
        <Nav />
        <div className="analysis-body">
          <img
            className={`analysis-spiral${skipTimedAdvance ? "" : " spin"}`}
            src="/images/quiz/q24-spiral.webp"
            alt=""
            aria-hidden
          />
          <div className="analysis-phrase-slot">
            <SlidingPhrase text={phrases[skipTimedAdvance ? phrases.length - 1 : phraseIdx]} />
          </div>
          {skipTimedAdvance ? (
            <button type="button" className="email-cta tap" onClick={() => go("q27")}>
              Продолжить
            </button>
          ) : null}
        </div>
      </div>
      {pausedQ !== null
        ? createPortal(
            <div
              className={`analysis-modal${modalOut ? " is-out" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={ANALYSIS_QUESTIONS[pausedQ].question}
            >
              <div className="analysis-modal-card">
                <div className="analysis-modal-bg" aria-hidden>
                  <div className="email-page-grad" />
                  <img src="/images/quiz/checkpoint-bg.webp" alt="" />
                  <div className="analysis-modal-veil" />
                </div>
                <div className="analysis-modal-art" aria-hidden>
                  <img className="analysis-modal-orbit spin-slow" src="/images/quiz/q25-orbit.webp" alt="" />
                  <img className="analysis-modal-q" src="/images/quiz/q25-question.webp" alt="" />
                </div>
                <p className="analysis-modal-qtext">{ANALYSIS_QUESTIONS[pausedQ].question}</p>
                <div className="analysis-modal-actions">
                  <button type="button" className="analysis-modal-btn tap" onClick={() => answerModal("yes")}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path
                        d="M4 10.5 L8 14.5 L16 6"
                        stroke="#00AFA3"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Да
                  </button>
                  <button type="button" className="analysis-modal-btn tap" onClick={() => answerModal("no")}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path
                        d="M5.5 5.5 L14.5 14.5 M14.5 5.5 L5.5 14.5"
                        stroke="#e5484d"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Нет
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

export function Q27Step() {
  const { answers, setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step27;
  const tiers = TRIAL_TIERS;
  const fullPrice = tiers[tiers.length - 1].label;
  const initial =
    typeof answers.price === "string" && tiers.some((t) => t.id === answers.price)
      ? answers.price
      : tiers[tiers.length - 1].id;
  const [tier, setTier] = useState(initial);

  return (
    <section className="page lilac trial-page">
      <div className="quiz-col trial-col">
        <Nav />
        <div className="trial-body">
          <p className="trial-brand">TheAstrologist</p>
          <div className="trial-title-block">
            <h1 className="trial-title">{s.title}</h1>
            <div className="trial-divider" aria-hidden>
              <span />
              <i />
              <span />
            </div>
          </div>
          <div className="trial-copy">
            <div className="trial-block">
              <p className="trial-label">{s.eyebrow}</p>
              <p className="trial-text" dangerouslySetInnerHTML={{ __html: accentify(s.intro) }} />
            </div>
            <div className="trial-block">
              <p className="trial-label">{s.cardEyebrow}</p>
              <p className="trial-text">{s.cardBody.replace("{price}", fullPrice)}</p>
            </div>
          </div>
          <div className="trial-prices-wrap">
            <div className="trial-prices">
              {tiers.map((t) => {
                const on = t.id === tier;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`trial-price tap${on ? " on" : ""}`}
                    aria-pressed={on}
                    onClick={() => setTier(t.id)}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="trial-note">{s.note.replace("{price}", fullPrice)}</p>
          </div>
        </div>
        <div className="trial-cta-wrap">
          <button
            type="button"
            className="trial-cta tap"
            onClick={() => {
              setAnswer("price", tier);
              go("done");
            }}
          >
            <span>{s.button}</span>
            <svg className="trial-cta-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M0 8.16667L15.5 8.16667C14.7033 8.16667 13.7133 8.64583 12.8967 9.145C11.8075 9.81083 10.8575 10.6833 10.0625 11.6833C9.44417 12.4583 8.83333 13.3817 8.83333 14M15.5 8.16667C14.7033 8.16667 13.7125 7.6875 12.8967 7.18833C11.8075 6.52167 10.8575 5.64917 10.0625 4.65083C9.44417 3.875 8.83333 2.95 8.83333 2.33333"
                stroke="#ffffff"
                strokeWidth="1.4"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export function DoneStep() {
  return <OfferPage />;
}

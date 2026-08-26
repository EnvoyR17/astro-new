import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { QUIZ_COPY } from "../quiz/copy";
import { ICONS4, ICONS6, ICONS9, ICONS11, ICONS13, CKPT_LABEL_POS, GLYPH_POS, LABEL_POS } from "../quiz/flow";
import { useQuiz } from "../quiz/QuizProvider";
import { Nav } from "../components/Nav";
import { Chev } from "../components/Icons";
import { PicSelectStep, TextSelectStep } from "./SelectTemplates";
import type { CSSProperties } from "react";

const Q7_SYMBOLS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/images/quiz/q7-sym-${n}.webp`);

function TimedFillBar({ durationMs = 4000 }: { durationMs?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="timed-bar" aria-hidden>
      <div className="timed-bar-track">
        <div className={`timed-bar-fill ${on ? "on" : ""}`} style={{ transitionDuration: `${durationMs}ms` }} />
      </div>
    </div>
  );
}

export function Q3Step() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step3;
  return (
    <PicSelectStep
      question={s.question}
      options={s.options}
      imagePrefix="q3-card"
      onPick={(k) => {
        setAnswer("q3", k);
        go("q4");
      }}
    />
  );
}

export function Q4Step() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step4;
  return (
    <TextSelectStep
      question={s.question}
      entries={Object.entries(s.options).map(([k, v]) => [k, v.label])}
      icons={ICONS4}
      onPick={(k) => {
        setAnswer("interest", k);
        go("q5");
      }}
    />
  );
}

type CkptBlock = { title: string; subtitle: string; labels: Record<string, string> };

export function Q5Step() {
  const { answers, go } = useQuiz();
  const s = QUIZ_COPY.step5;
  const interest = answers.interest ?? "all";
  const block: CkptBlock =
    interest in s && interest !== "button"
      ? (s[interest as Exclude<keyof typeof s, "button">] as CkptBlock)
      : (s.all as CkptBlock);
  const labels = Object.values(block.labels);

  return (
    <section className="page ckpt">
      <img className="ckpt-bg" src="/images/quiz/checkpoint-bg.webp" alt="" />
      <div className="quiz-col">
        <Nav />
        <div className="ckpt-head">
          <h2 className="q">{block.title}</h2>
          <p className="sub">{block.subtitle}</p>
        </div>
        <div className="ckpt-art-wrap">
          <img className="ckpt-art" src="/images/quiz/checkpoint-central.webp" alt="" />
          {labels.map((l, n) => {
            const p = LABEL_POS[n] as {
              left?: string;
              right?: string;
              top?: string;
              rotate: number;
              opacity: number;
              dur: number;
              delay: number;
            } | undefined;
            if (!p) return null;
            const pos: CSSProperties = {
              ...(p.left != null ? { left: p.left } : {}),
              ...(p.right != null ? { right: p.right } : {}),
              ...(p.top != null ? { top: p.top } : {}),
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            };
            const bg = `linear-gradient(200deg, rgba(41,35,79,${p.opacity}) 4%, rgba(67,47,125,${p.opacity}) 47%, rgba(40,33,78,${p.opacity}) 95%)`;
            return (
              <div key={n} className="float-tag" style={pos}>
                <div
                  className="float-tag-inner"
                  style={{ transform: `rotate(${p.rotate}deg)`, background: bg }}
                >
                  {l}
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="cta-ckpt tap" onClick={() => go("q6")}>
          Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </section>
  );
}

export function Q6Step() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step6;
  return (
    <TextSelectStep
      question={s.question}
      entries={Object.entries(s.options).map(([k, v]) => [k, v.label])}
      icons={ICONS6}
      onPick={(k) => {
        setAnswer("goal", k);
        go("q7");
      }}
    />
  );
}

export function Q7Step() {
  const { go, skipTimedAdvance } = useQuiz();
  const s = QUIZ_COPY.step7;
  const symbols = [...Q7_SYMBOLS, ...Q7_SYMBOLS];
  const loopPx = 95 * Q7_SYMBOLS.length;

  useEffect(() => {
    if (skipTimedAdvance) return;
    let done = false;
    const t = window.setTimeout(() => {
      if (done) return;
      done = true;
      go("q8");
    }, 4000);
    return () => {
      done = true;
      window.clearTimeout(t);
    };
  }, [go, skipTimedAdvance]);

  return (
    <section className="page ckpt">
      <img className="ckpt-bg" src="/images/quiz/checkpoint-bg.webp" alt="" />
      <div className="quiz-col">
        <Nav />
        <div className="ckpt-head">
          <h2 className="q">{s.title}</h2>
          <p className="sub">{s.subtitle}</p>
        </div>
        <div className="ckpt-art-wrap">
          <img className="ckpt-art" src="/images/quiz/checkpoint2-central.webp" alt="" />
          <div className="sym-marquee" aria-hidden>
            <div className="sym-marquee-track" style={{ ["--loop" as string]: `${loopPx}px`, animationDuration: `${3.6 * Q7_SYMBOLS.length}s` }}>
              {symbols.map((src, i) => (
                <div key={`${src}-${i}`} className="sym-tile">
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {skipTimedAdvance ? (
          <button type="button" className="cta-ckpt tap" onClick={() => go("q8")}>
            Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
          </button>
        ) : (
          <TimedFillBar durationMs={4000} />
        )}
      </div>
    </section>
  );
}

export function Q8Step() {
  const { answers, setAnswers, go } = useQuiz();
  const s = QUIZ_COPY.step8;
  const keys = Object.keys(s.states) as (keyof typeof s.states)[];
  const max = keys.length - 1;
  const v = Math.min(max, Math.max(0, answers.relIdx ?? 2));
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setIdx = (i: number) => {
    const clamped = Math.min(max, Math.max(0, i));
    setAnswers({ relIdx: clamped, rel: keys[clamped] as string });
  };

  const idxFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return v;
    const rect = el.getBoundingClientRect();
    const pad = 20;
    const usable = Math.max(1, rect.width - pad * 2);
    const x = Math.min(usable, Math.max(0, clientX - rect.left - pad));
    return Math.round((x / usable) * max);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIdx(idxFromClientX(e.clientX));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setIdx(idxFromClientX(e.clientX));
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const pct = max > 0 ? (v / max) * 100 : 0;
  const label = s.states[keys[v]];

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="slider-head">
          <h2 className="q q-slider">
            Какими обычно бывают твои
            <br />
            отношения с другими людьми?
          </h2>
        </div>
        <div className="slider-body">
          <div className="fig-stage">
            {[1, 2, 3, 4, 5].map((n) => (
              <img key={n} className={n - 1 === v ? "on" : ""} src={`/images/quiz/q8-fig-${n}.webp`} alt="" />
            ))}
          </div>
          <div className="tap-slider-wrap">
            <div className="tap-slider-bubble">
              <span>{label}</span>
            </div>
            <div
              ref={trackRef}
              className="tap-slider tap"
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={v}
              aria-valuetext={label}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") setIdx(v + 1);
                if (e.key === "ArrowLeft" || e.key === "ArrowDown") setIdx(v - 1);
              }}
            >
              <div className="tap-slider-line" />
              <div
                className="tap-slider-fill"
                style={{ width: `calc((100% - 40px) * ${pct / 100})` }}
              />
              {keys.map((k, i) => {
                const t = max > 0 ? i / max : 0;
                return (
                  <span
                    key={k}
                    className={`tap-slider-dot${i <= v ? " on" : ""}`}
                    style={{ left: `calc(20px + (100% - 40px) * ${t})` }}
                  />
                );
              })}
              <span
                className="tap-slider-thumb"
                style={{ left: `calc(20px + (100% - 40px) * ${pct / 100})` }}
              />
            </div>
          </div>
        </div>
        <div className="slider-cta">
          <button
            type="button"
            className="cta-ckpt tap"
            onClick={() => {
              setAnswers({ rel: keys[v] as string, relIdx: v });
              go("q9");
            }}
          >
            Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Q9Step() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step9;
  return (
    <TextSelectStep
      question={s.question}
      entries={Object.entries(s.options).map(([k, v]) => [k, v.label])}
      icons={ICONS9}
      onPick={(k) => {
        setAnswer("help", k);
        go("q10");
      }}
    />
  );
}

export function Q10Step() {
  const { go } = useQuiz();
  const s = QUIZ_COPY.step10;
  const concepts = [
    { key: "moon", anim: "pulse" },
    { key: "transits", anim: "rotate" },
    { key: "houses", anim: "pulse" },
    { key: "rising", anim: "pulse" },
    { key: "sun", anim: "rotate" },
    { key: "planets", anim: "rotate" },
    { key: "wheel", anim: "rotate" },
    { key: "aspects", anim: "pulse" },
  ] as const;

  return (
    <section className="page ckpt">
      <img className="ckpt-bg" src="/images/quiz/checkpoint-bg.webp" alt="" />
      <div className="quiz-col">
        <Nav />
        <div className="ckpt-head">
          <h2 className="q">{s.title}</h2>
          <p className="sub">{s.subtitle}</p>
        </div>
        <div className="ckpt-art-wrap">
          <img className="ckpt-art concepts-art" src="/images/quiz/q10-central.webp" alt="" />
          {concepts.map((c, n) => {
            const p = CKPT_LABEL_POS[n] as {
              left?: string;
              right?: string;
              top?: string;
              bottom?: string;
              rotate: number;
              dur: number;
              delay: number;
            } | undefined;
            if (!p) return null;
            const pos: CSSProperties = {
              ...(p.left != null ? { left: p.left } : {}),
              ...(p.right != null ? { right: p.right } : {}),
              ...(p.top != null ? { top: p.top } : {}),
              ...(p.bottom != null ? { bottom: p.bottom } : {}),
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            };
            return (
              <div key={c.key} className="float-tag" style={pos}>
                <div className="float-tag-inner concept" style={{ transform: `rotate(${p.rotate}deg)` }}>
                  <span>{s.concepts[c.key]}</span>
                  <img
                    className={c.anim}
                    src={`/images/quiz/q10-ic-${c.key}.webp`}
                    alt=""
                    aria-hidden
                  />
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="cta-ckpt tap" onClick={() => go("q11")}>
          Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </section>
  );
}

export function Q11Step() {
  const { sel, pick, setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step11;
  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-chips">
          <div className="q-head">
            <h2 className="q q-chip">{s.question}</h2>
          </div>
          <div className="chips" role="radiogroup" aria-label={s.question}>
            {Object.entries(s.options).map(([k, v]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={sel === k}
                className={`chip tap ${sel === k ? "on" : ""}`}
                onClick={() =>
                  pick(k, () => {
                    setAnswer("learn", k);
                    go("q12");
                  })
                }
              >
                <span className="chip-ico" aria-hidden>
                  {ICONS11[k] || ""}
                </span>
                <span className="chip-lbl">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Q12Step() {
  const { sel, pick, setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step12;
  const points = [
    { value: "strongly_disagree", icon: "👎", emphasis: "strong" },
    { value: "disagree", icon: "👎", emphasis: "soft" },
    { value: "neutral", icon: "🤷", emphasis: "strong" },
    { value: "agree", icon: "👍", emphasis: "soft" },
    { value: "strongly_agree", icon: "👍", emphasis: "strong" },
  ] as const;

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-likert">
          <div className="q-head q-head-likert">
            <h2 className="q q-likert">
              Согласишься ли ты с этим
              <br />
              утверждением?
            </h2>
            <p className="sub sub-likert">
              Я часто замечаю закономерности в поведении людей, чувствах
              <br />
              и жизненных событиях ещё до того, как могу их объяснить.
            </p>
          </div>
          <div className="likert-block">
            <div className="likert-scale" role="radiogroup" aria-label={s.question}>
              {points.map((p, i) => {
                const on = sel === i;
                return (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p.value}
                    className={`tap likert-cell${on ? " on" : ""}`}
                    onClick={() =>
                      pick(i, () => {
                        setAnswer("likert", i);
                        go("q13");
                      })
                    }
                  >
                    <span className={`likert-ico ${p.emphasis}`} aria-hidden>
                      {p.icon}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="likert-labels">
              <span>{s.minLabel}</span>
              <span>{s.maxLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Q13Step() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step13;
  return (
    <TextSelectStep
      question={s.question}
      entries={Object.entries(s.options).map(([k, v]) => [k, v.label])}
      icons={ICONS13}
      onPick={(k) => {
        setAnswer("guide", k);
        go("q14");
      }}
    />
  );
}

export function Q14Step() {
  const { go, skipTimedAdvance } = useQuiz();
  const s = QUIZ_COPY.step14;
  const glyphs = ["sun", "moon", "chiron", "prism", "aries", "scorpio", "caduceus", "venus"] as const;
  const durationMs = 5500;

  useEffect(() => {
    if (skipTimedAdvance) return;
    let done = false;
    const t = window.setTimeout(() => {
      if (done) return;
      done = true;
      go("q15");
    }, durationMs);
    return () => {
      done = true;
      window.clearTimeout(t);
    };
  }, [go, skipTimedAdvance]);

  return (
    <section className="page ckpt">
      <img className="ckpt-bg" src="/images/quiz/checkpoint-bg.webp" alt="" />
      <div className="quiz-col">
        <Nav />
        <div className="ckpt-head">
          <h2 className="q">{s.title}</h2>
          <p className="sub">{s.subtitle}</p>
        </div>
        <div className="ckpt-art-wrap">
          <img className="ckpt-art concepts-art glyphs-art" src="/images/quiz/q14-central.webp" alt="" />
          {glyphs.map((g, n) => {
            const p = GLYPH_POS[n];
            if (!p) return null;
            const pos: CSSProperties = {
              ...("left" in p ? { left: p.left } : {}),
              ...("right" in p ? { right: p.right } : {}),
              top: p.top,
              width: p.size,
              height: p.size,
              animationDuration: `${p.bobDur}s`,
              animationDelay: `${p.bobDelay}s`,
            };
            return (
              <div key={g} className="glyph-float" style={pos}>
                <img
                  className="glyph-spin"
                  src={`/images/quiz/q14-gl-${g}.webp`}
                  alt=""
                  aria-hidden
                  style={{
                    animationDuration: `${p.rotDur}s`,
                    animationDirection: p.dir < 0 ? "reverse" : "normal",
                  }}
                />
              </div>
            );
          })}
        </div>
        {skipTimedAdvance ? (
          <button type="button" className="cta-ckpt tap" onClick={() => go("q15")}>
            Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
          </button>
        ) : (
          <TimedFillBar durationMs={durationMs} />
        )}
      </div>
    </section>
  );
}

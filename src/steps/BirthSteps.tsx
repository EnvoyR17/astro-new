import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { QUIZ_COPY } from "../quiz/copy";
import { DATE_MIN_YEAR, MONTHS_FULL, accentify } from "../quiz/flow";
import { searchPlaces, FALLBACK_PLACE, type PlaceHit } from "../quiz/searchPlaces";
import { DEFAULT_TIME } from "../quiz/persist";
import { useQuiz } from "../quiz/QuizProvider";
import { Nav } from "../components/Nav";
import { Chev } from "../components/Icons";
import { TextSelectStep } from "./SelectTemplates";

const ITEM_H = 40;

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

function WheelCol({
  items,
  selected,
  onSelect,
  width,
  radius,
  ariaLabel,
  placeholder,
  touched = true,
  onTouch,
}: {
  items: string[];
  selected: number;
  onSelect: (i: number) => void;
  width: number;
  radius: string;
  ariaLabel: string;
  placeholder?: string;
  touched?: boolean;
  onTouch?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const itemH = useRef(ITEM_H);
  const raf = useRef(0);
  const settle = useRef(0);
  const skipScroll = useRef(true);
  const touchedRef = useRef(touched);
  const selectedRef = useRef(selected);
  const [visual, setVisual] = useState(selected);
  touchedRef.current = touched;
  selectedRef.current = selected;

  const measureItemH = () => {
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>(".witem");
    const h = first?.offsetHeight ?? 0;
    if (h > 0) itemH.current = h;
    return itemH.current;
  };

  const pinTo = (index: number) => {
    const el = ref.current;
    if (!el) return;
    const h = measureItemH();
    skipScroll.current = true;
    el.scrollTop = h * index;
    setVisual(index);
  };

  // Pin wheel to the default index before paint so placeholders
  // sit on those values (15 / июнь / 2000, or 12 / 30 for time).
  useLayoutEffect(() => {
    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    pinTo(selected);
    // Re-pin after layout/snap so scrollTop doesn't drift (e.g. 30 → 33).
    raf1 = requestAnimationFrame(() => {
      if (cancelled) return;
      pinTo(selected);
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        pinTo(selected);
        skipScroll.current = false;
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // pinTo reads fresh DOM; only re-run when selection / list length change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, items.length]);

  const markTouch = () => {
    touchedRef.current = true;
    if (!touched) onTouch?.();
  };

  const indexFromScroll = (el: HTMLDivElement) => {
    const h = itemH.current || ITEM_H;
    return Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / h)));
  };

  const onScroll = () => {
    if (skipScroll.current) return;
    const el = ref.current;
    if (!el) return;

    // Until the user interacts, ignore snap/layout drift and keep the mask on `selected`.
    if (!touchedRef.current) {
      const h = measureItemH();
      const target = h * selectedRef.current;
      if (Math.abs(el.scrollTop - target) > 1) {
        skipScroll.current = true;
        el.scrollTop = target;
        requestAnimationFrame(() => {
          skipScroll.current = false;
        });
      }
      return;
    }

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      setVisual(indexFromScroll(el));
    });
    if (settle.current) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      if (skipScroll.current) return;
      const i = indexFromScroll(el);
      onSelect(i);
      const h = itemH.current || ITEM_H;
      if (Math.abs(el.scrollTop - h * i) > 1) {
        skipScroll.current = true;
        el.scrollTo({ top: h * i, behavior: "smooth" });
        window.setTimeout(() => {
          skipScroll.current = false;
        }, 220);
      }
    }, 140);
  };

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (settle.current) window.clearTimeout(settle.current);
    },
    [],
  );

  return (
    <div className="wheel-col-wrap" style={{ width, borderRadius: radius }}>
      <div className="wheel-col-hl" aria-hidden />
      <div
        ref={ref}
        className="wheel-col"
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onScroll={onScroll}
        onPointerDown={markTouch}
        onWheel={markTouch}
        onTouchStart={markTouch}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          markTouch();
          const h = itemH.current || ITEM_H;
          const next = Math.max(
            0,
            Math.min(items.length - 1, visual + (e.key === "ArrowDown" ? 1 : -1)),
          );
          ref.current?.scrollTo({ top: h * next, behavior: "smooth" });
        }}
      >
        {items.map((it, i) => {
          // Until the user interacts, keep highlight + mask on the default
          // value, not on whatever scrollTop briefly reports.
          const active = touched ? visual : selected;
          const dist = Math.abs(i - active);
          const on = i === active;
          const label = on && !touched && placeholder ? placeholder : it;
          return (
            <div
              key={`${it}-${i}`}
              role="option"
              aria-selected={on}
              className={`witem${on ? " on" : ""}`}
              style={{ opacity: dist >= 2 ? 0.5 : 1 }}
              onClick={() => {
                markTouch();
                const h = itemH.current || ITEM_H;
                ref.current?.scrollTo({ top: h * i, behavior: "smooth" });
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Q15Step() {
  const { datePick, setDatePick, setAnswer, answers, go } = useQuiz();
  const s = QUIZ_COPY.step15;
  const maxYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: maxYear - DATE_MIN_YEAR + 1 }, (_, i) => String(DATE_MIN_YEAR + i)),
    [maxYear],
  );
  const yearVal = DATE_MIN_YEAR + datePick.y;
  const daysInMonth = new Date(yearVal, datePick.m + 1, 0).getDate();
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")),
    [daysInMonth],
  );

  const hadDate = Boolean(answers.date);
  const [touchedD, setTouchedD] = useState(hadDate);
  const [touchedM, setTouchedM] = useState(hadDate);
  const [touchedY, setTouchedY] = useState(hadDate);
  const ready = touchedD && touchedM && touchedY;

  useEffect(() => {
    if (datePick.d > daysInMonth - 1) setDatePick({ d: daysInMonth - 1 });
  }, [daysInMonth, datePick.d, setDatePick]);

  const zo = ["aries", "taurus", "gemini", "cancer", "libra"] as const;

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-date">
          <div className="date-stack">
            <div className="date-head">
              <h2 className="q q-date">{s.question}</h2>
              <p className="sub sub-date">{s.subtitle}</p>
            </div>
            <div className="zo-row">
              {zo.map((z, i) => (
                <div key={z} className={`zo-tile${i % 2 === 1 ? " down" : " up"}`}>
                  <img src={`/images/quiz/q15-zo-${z}.webp`} alt="" />
                </div>
              ))}
            </div>
          </div>
          <div className="date-wheels">
            <WheelCol
              items={days}
              selected={Math.min(datePick.d, days.length - 1)}
              onSelect={(d) => setDatePick({ d })}
              width={83}
              radius="8px 0 0 8px"
              ariaLabel="День"
              placeholder="День"
              touched={touchedD}
              onTouch={() => setTouchedD(true)}
            />
            <WheelCol
              items={MONTHS_FULL}
              selected={datePick.m}
              onSelect={(m) => setDatePick({ m })}
              width={169}
              radius="0"
              ariaLabel="Месяц"
              placeholder="Месяц"
              touched={touchedM}
              onTouch={() => setTouchedM(true)}
            />
            <WheelCol
              items={years}
              selected={datePick.y}
              onSelect={(y) => setDatePick({ y })}
              width={83}
              radius="0 8px 8px 0"
              ariaLabel="Год"
              placeholder="Год"
              touched={touchedY}
              onTouch={() => setTouchedY(true)}
            />
          </div>
        </div>
        <div className="date-cta-wrap">
          <button
            type="button"
            className="cta-ckpt tap"
            disabled={!ready}
            style={{ opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "default" }}
            onClick={() => {
              if (!ready) return;
              const day = Math.min(datePick.d, daysInMonth - 1) + 1;
              const y = DATE_MIN_YEAR + datePick.y;
              setAnswer("date", `${day} ${MONTHS_FULL[datePick.m]} ${y}`);
              go("q16");
            }}
          >
            Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Q16Step() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step16;
  return (
    <TextSelectStep
      question={s.question}
      subtitle={s.subtitle}
      entries={[
        ["yes", s.options.yes.label],
        ["no", s.options.no.label],
      ]}
      icons={{ yes: "👍", no: "👎" }}
      onPick={(k) => {
        setAnswer("knowTime", k as "yes" | "no");
        go(k === "yes" ? "q17" : "q18");
      }}
    />
  );
}

export function Q17Step() {
  const { timePick, setTimePick, setAnswer, answers, go } = useQuiz();
  const s = QUIZ_COPY.step17;
  const hh = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")), []);
  const mm = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")), []);
  const hadTime = Boolean(answers.time);
  const [touchedH, setTouchedH] = useState(hadTime);
  const [touchedM, setTouchedM] = useState(hadTime);
  const ready = touchedH && touchedM;

  // Clear snap-drifted wheel values (30→33) if time was never confirmed.
  useLayoutEffect(() => {
    if (!answers.time) setTimePick(DEFAULT_TIME);
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-time">
          <div className="date-stack time-stack">
            <div className="date-head">
              <h2 className="q q-date">{s.question}</h2>
              <p className="sub sub-date">{s.subtitle}</p>
            </div>
            <div className="date-wheels time">
              <WheelCol
                items={hh}
                selected={timePick.h}
                onSelect={(h) => setTimePick({ h })}
                width={160}
                radius="8px 0 0 8px"
                ariaLabel="Час"
                placeholder="Час"
                touched={touchedH}
                onTouch={() => setTouchedH(true)}
              />
              <WheelCol
                items={mm}
                selected={timePick.min}
                onSelect={(min) => setTimePick({ min })}
                width={160}
                radius="0 8px 8px 0"
                ariaLabel="Минута"
                placeholder="Минута"
                touched={touchedM}
                onTouch={() => setTouchedM(true)}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="cta-ckpt tap"
          disabled={!ready}
          style={{ opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "default" }}
          onClick={() => {
            if (!ready) return;
            setAnswer(
              "time",
              `${String(timePick.h).padStart(2, "0")}:${String(timePick.min).padStart(2, "0")}`,
            );
            go("q18a");
          }}
        >
          Продолжить <Chev color="#fff" style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </section>
  );
}

export function Q18Step() {
  const { go, skipTimedAdvance } = useQuiz();
  const s = QUIZ_COPY.step18;
  const durationMs = 4000;

  useEffect(() => {
    if (skipTimedAdvance) return;
    let done = false;
    const t = window.setTimeout(() => {
      if (done) return;
      done = true;
      go("q18a");
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
        <div className="reveal-body">
          <div className="ckpt-head">
            <h2 className="q">{s.title}</h2>
            <p className="sub sub-q18">
              {s.subtitleLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </div>
          <div className="reveal-clock">
            <img src="/images/quiz/q18-clock-base.webp" alt="" />
            <img className="ring" src="/images/quiz/q18-clock-ring.webp" alt="" />
          </div>
        </div>
        {skipTimedAdvance ? (
          <button type="button" className="cta-ckpt tap" onClick={() => go("q18a")}>
            Продолжить
          </button>
        ) : (
          <TimedFillBar durationMs={durationMs} />
        )}
      </div>
    </section>
  );
}

export function Q18aStep() {
  const { setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step18a;
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [selected, setSelected] = useState<PlaceHit | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || selected?.name === q) {
      setHits([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      setSearching(true);
      setSearched(false);
      try {
        const results = await searchPlaces(q, ac.signal);
        setHits(results);
        setSearched(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error(e);
          setHits([]);
          setSearched(true);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [query, selected]);

  const pick = (p: PlaceHit) => {
    setSelected(p);
    setQuery(p.name);
    setHits([]);
    setSearched(false);
  };

  const noResults = searched && !searching && hits.length === 0 && !selected && query.trim().length >= 2;

  return (
    <section className="page lilac">
      <div className="quiz-col place-col">
        <Nav />
        <div className="place-body">
          <h2 className="q q-place">{s.question}</h2>
          <p className="sub sub-place">{s.subtext}</p>
          <div className="place-field-wrap">
            <input
              className="place-field"
              type="text"
              value={query}
              autoComplete="off"
              placeholder={s.placeholder}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (selected && v !== selected.name) setSelected(null);
              }}
            />
            {hits.length > 0 && (
              <ul className="place-dropdown" role="listbox">
                {hits.map((p, i) => (
                  <li key={`${p.lat}-${p.lon}-${i}`}>
                    <button type="button" className="place-option tap" onClick={() => pick(p)}>
                      <span className="place-option-name">{p.name}</span>
                      <span className="place-option-meta">
                        {p.tz} · {p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searching && <p className="place-status">Ищем…</p>}
            {noResults && (
              <div className="place-empty">
                <p className="place-status">Совпадений нет</p>
                <button
                  type="button"
                  className="place-skip tap"
                  onClick={() => {
                    setAnswer("city", FALLBACK_PLACE.name);
                    go("q19");
                  }}
                >
                  Пропустить
                </button>
              </div>
            )}
            {selected && (
              <p className="place-status">
                Выбрано: <span className="place-selected-name">{selected.name} · {selected.tz}</span>
              </p>
            )}
          </div>
          <div className="place-spacer" />
          <button
            type="button"
            className="place-cta tap"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              setAnswer("city", selected.name);
              go("q19");
            }}
          >
            Продолжить
          </button>
        </div>
      </div>
    </section>
  );
}

export function Q19Step() {
  const { answers, datePick, go, skipTimedAdvance } = useQuiz();
  const s = QUIZ_COPY.step19;
  const durationMs = 4000;

  const dateLabel = useMemo(() => {
    const y = DATE_MIN_YEAR + datePick.y;
    const d = datePick.d + 1;
    const dt = new Date(y, datePick.m, d);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dt);
  }, [datePick]);

  const raw = answers.time
    ? s.titleWithTime.replace("{date}", dateLabel).replace("{time}", answers.time)
    : s.titleNoTime.replace("{date}", dateLabel);

  useEffect(() => {
    if (skipTimedAdvance) return;
    let done = false;
    const t = window.setTimeout(() => {
      if (done) return;
      done = true;
      go("q21");
    }, durationMs);
    return () => {
      done = true;
      window.clearTimeout(t);
    };
  }, [go, skipTimedAdvance]);

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid mid-natal">
          <div className="natal-head">
            <h2 className="q q-natal" dangerouslySetInnerHTML={{ __html: accentify(raw) }} />
            <p
              className="sub sub-natal"
              dangerouslySetInnerHTML={{ __html: s.subtitle }}
            />

          </div>
          <div className="galaxy">
            <img className="galaxy-core" src="/images/quiz/q19-galaxy.webp" alt="" />
            <img className="orb" src="/images/quiz/q19-orbits.webp" alt="" />
          </div>
        </div>
        {skipTimedAdvance ? (
          <button type="button" className="cta-ckpt tap" onClick={() => go("q21")}>
            Продолжить
          </button>
        ) : (
          <TimedFillBar durationMs={durationMs} />
        )}
      </div>
    </section>
  );
}


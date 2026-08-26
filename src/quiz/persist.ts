import { DATE_MIN_YEAR, MONTHS_FULL, ORDER, TIMED_STEPS } from "./flow";
import type { QuizAnswers, QuizState, StepId } from "./types";

export const STORAGE_KEY = "quiz-funnel-state-v1";

const VALID_STEPS = new Set<StepId>([...ORDER, "done"]);

export const STEP_ANSWER: Partial<Record<StepId, keyof QuizAnswers>> = {
  gender: "gender",
  q3: "q3",
  q4: "interest",
  q6: "goal",
  q8: "relIdx",
  q9: "help",
  q11: "learn",
  q12: "likert",
  q13: "guide",
  q16: "knowTime",
  q27: "price",
};

const MARKETING = /^(utm_|gclid$|fbclid$|yclid$|ttclid$|msclkid$|_ga$)/i;

export type QuizSnapshot = {
  history: StepId[];
  answers: QuizAnswers;
  datePick: QuizState["datePick"];
  timePick: QuizState["timePick"];
};

export function isMarketingParam(key: string): boolean {
  return MARKETING.test(key);
}

export function marketingFromSearch(search: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  search.forEach((value, key) => {
    if (isMarketingParam(key)) out.set(key, value);
  });
  return out;
}

function sanitizeHistory(history: StepId[] | undefined): StepId[] {
  if (!history?.length) return ["gender"];
  const next = history.filter((id) => VALID_STEPS.has(id));
  return next.length ? next : ["gender"];
}

export function parseDatePick(date?: string): QuizState["datePick"] | null {
  if (!date) return null;
  const parts = date.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = Number(parts[0]);
  const m = MONTHS_FULL.indexOf(parts[1]);
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || day < 1 || m < 0 || !Number.isFinite(year)) return null;
  return { d: day - 1, m, y: year - DATE_MIN_YEAR };
}

export function parseTimePick(time?: string): QuizState["timePick"] | null {
  if (!time) return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

export function historyToStep(step: StepId, answers: QuizAnswers): StepId[] {
  const hist: StepId[] = [];
  const sequence: StepId[] = [...ORDER, "done"];
  for (const id of sequence) {
    if (id === "q17" && answers.knowTime === "no") continue;
    if (id === "q18" && answers.knowTime === "yes") continue;
    // Timed intermediates aren't back targets unless we're currently on them.
    if (TIMED_STEPS.has(id) && id !== step) continue;
    hist.push(id);
    if (id === step) break;
  }
  if (!hist.length) return ["gender"];
  if (hist[hist.length - 1] !== step) hist.push(step);
  return hist;
}

export function restoredSel(step: StepId, answers: QuizAnswers): string | number | null {
  const key = STEP_ANSWER[step];
  if (!key) return null;
  const value = answers[key];
  if (value == null) return null;
  return value;
}

export function buildSearch(marketing: URLSearchParams): string {
  const p = new URLSearchParams();
  marketing.forEach((value, key) => p.set(key, value));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function writeLocation(_step: StepId, _answers: QuizAnswers, snapshot: QuizSnapshot, mode: "push" | "replace") {
  if (typeof window === "undefined") return;
  const marketing = marketingFromSearch(new URLSearchParams(window.location.search));
  const url = `${window.location.pathname}${buildSearch(marketing)}${window.location.hash}`;
  const state = { quiz: snapshot };
  if (mode === "push") window.history.pushState(state, "", url);
  else window.history.replaceState(state, "", url);
  persistStorage(snapshot);
}

export function persistStorage(snapshot: QuizSnapshot) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota / private mode */
  }
}

function readStorage(): QuizSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizSnapshot;
    if (!Array.isArray(parsed.history) || !parsed.history.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

const DEFAULT_DATE = { d: 14, m: 5, y: 80 };
const DEFAULT_TIME = { h: 12, min: 30 };

export function loadInitial(): QuizSnapshot {
  const stored = typeof window !== "undefined" ? readStorage() : null;
  const answers: QuizAnswers = stored?.answers ?? {};
  const history = sanitizeHistory(stored?.history);
  const fromDate = parseDatePick(answers.date);
  const fromTime = parseTimePick(answers.time);

  return {
    history,
    answers,
    datePick: fromDate ?? stored?.datePick ?? DEFAULT_DATE,
    // Ignore stale wheel scroll (e.g. snap drift 30→33) unless time was confirmed.
    timePick: fromTime ?? DEFAULT_TIME,
  };
}

export { DEFAULT_DATE, DEFAULT_TIME };

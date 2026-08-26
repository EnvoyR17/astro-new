import type { StepId } from "./types";

export const ORDER: StepId[] = [
  "gender",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
  "q17",
  "q18",
  "q18a",
  "q19",
  "q21",
  "q23",
  "q24",
  "q24a",
  "q24b",
  "q24c",
  "q25",
  "q26",
  "q27",
];

export const DOME_STEPS = new Set<StepId>([
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q18",
  "q19",
  "q24b",
  "q24c",
]);

export const TIMED_STEPS = new Set<StepId>([
  "q7",
  "q14",
  "q18",
  "q19",
  "q23",
  "q24",
  "q26",
]);

export function isTimedStep(id: StepId): boolean {
  return TIMED_STEPS.has(id);
}

/** Drop trailing timed steps so back lands on a real interactive screen. */
export function trimTimedTail(history: StepId[]): StepId[] {
  const next = [...history];
  while (next.length > 1 && isTimedStep(next[next.length - 1]!)) {
    next.pop();
  }
  return next.length ? next : ["gender"];
}
export const MONTHS = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

export const MONTHS_FULL = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export const DATE_MIN_YEAR = 1920;

export const CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград",
  "Краснодар",
  "Саратов",
  "Тюмень",
  "Сочи",
  "Минск",
  "Алматы",
  "Киев",
];

/** Floating concept chips on interest checkpoint (from live `il` positions). */
export const CKPT_LABEL_POS = [
  { left: "2%", top: "4%", rotate: -4, opacity: 0.82, dur: 6.4, delay: 0 },
  { left: "39%", top: "0%", rotate: 5, opacity: 0.82, dur: 7.2, delay: 0.5 },
  { right: "2%", top: "14%", rotate: -3, opacity: 0.82, dur: 6.8, delay: 1 },
  { left: "2%", top: "30%", rotate: 6, opacity: 0.82, dur: 7.6, delay: 0.3 },
  { right: "2%", top: "46%", rotate: 4, opacity: 0.82, dur: 6.6, delay: 0.9 },
  { left: "2%", top: "49%", rotate: -5, opacity: 0.82, dur: 7.4, delay: 1.3 },
  { left: "5%", bottom: "2%", rotate: -4, opacity: 0.82, dur: 6.9, delay: 0.6 },
  { right: "4%", bottom: "3%", rotate: 13, opacity: 0.82, dur: 7.8, delay: 1.1 },
] as const;

/** Floating glyph positions on trust checkpoint (`is` from live). */
export const GLYPH_POS = [
  { left: "2%", top: "5%", size: 58, rotDur: 26, dir: 1, bobDur: 6.2, bobDelay: 0 },
  { right: "5%", top: "1%", size: 54, rotDur: 30, dir: -1, bobDur: 7, bobDelay: 0.5 },
  { left: "-2%", top: "25%", size: 60, rotDur: 24, dir: -1, bobDur: 6.6, bobDelay: 1 },
  { right: "-2%", top: "29%", size: 56, rotDur: 28, dir: 1, bobDur: 7.4, bobDelay: 0.3 },
  { left: "0%", top: "57%", size: 58, rotDur: 27, dir: 1, bobDur: 6.4, bobDelay: 0.9 },
  { right: "1%", top: "60%", size: 54, rotDur: 32, dir: -1, bobDur: 7.2, bobDelay: 1.3 },
  { left: "11%", top: "82%", size: 56, rotDur: 25, dir: -1, bobDur: 6.9, bobDelay: 0.6 },
  { right: "12%", top: "84%", size: 60, rotDur: 29, dir: 1, bobDur: 7.8, bobDelay: 1.1 },
] as const;

/** Decorative symbol orbit (legacy). */
export const LABEL_POS = [
  { left: "1%", top: "11%", rotate: -9, opacity: 0.85, dur: 6, delay: 0 },
  { right: "1%", top: "9%", rotate: 6, opacity: 0.8, dur: 7, delay: 0.6 },
  { left: "2%", top: "34%", rotate: 9, opacity: 0.9, dur: 6.5, delay: 1.1 },
  { right: "2%", top: "38%", rotate: -8, opacity: 0.62, dur: 7.5, delay: 0.3 },
  { left: "2%", top: "64%", rotate: -15, opacity: 0.5, dur: 6.2, delay: 0.9 },
  { right: "1%", top: "62%", rotate: -4, opacity: 0.42, dur: 7.2, delay: 1.4 },
  { left: "4%", top: "80%", rotate: 10, opacity: 0.32, dur: 6.8, delay: 0.5 },
  { right: "5%", top: "82%", rotate: 17, opacity: 0.22, dur: 7.8, delay: 1.2 },
] as const;

export const ICONS4: Record<string, string> = {
  relationships: "💞",
  life_direction: "🧭",
  timing: "⏳",
  self: "🪞",
  patterns: "🔁",
  career: "💼",
  all: "✨",
};
export const ICONS6: Record<string, string> = {
  read: "📊",
  understand: "🧠",
  help: "👀",
  intuition: "💭",
  skill: "💡",
  path: "🫀",
  daily: "🗓️",
};
export const ICONS9: Record<string, string> = {
  myself: "🌞",
  close_circle: "👫",
  anyone: "🧠",
  clients: "🧔",
  students: "🧑‍🎓",
  unsure: "🫶",
};
export const ICONS11: Record<string, string> = {
  practice: "✍️",
  guidance: "🧭",
  visual: "🎥",
  examples: "👁️",
  explore: "🌙",
  intuition: "✨",
  theory: "📚",
  simple: "🧠",
};
export const ICONS13: Record<string, string> = {
  feeling: "🍃",
  logic: "🧠",
  read_people: "👁️",
  protect: "🧿",
  foresight: "🔮",
  paralyzed: "🤔",
};

export const STARS = Array.from({ length: 46 }, (_, t) => {
  const shine = t % 7 === 0;
  return {
    top: (17.73 * t) % 100,
    left: (39.31 * t + (t % 3) * 7) % 100,
    size: shine ? 2.4 : 0.8 + (t % 3) * 0.5,
    shine,
    delay: (t * 0.37) % 4,
    dur: 2.6 + (t % 5) * 0.4,
    b: shine ? 0.9 : 0.45,
  };
});

export function progressFor(step: StepId): number {
  const i = Math.max(0, ORDER.indexOf(step));
  return (i + 1) / ORDER.length;
}

export function accentify(s: string): string {
  return s.replace(/<accent>/g, '<span class="accent">').replace(/<\/accent>/g, "</span>");
}

import { ORDER } from "./flow";
import type { QuizAnswers, StepId } from "./types";

const CKPT = "/images/quiz/checkpoint-bg.webp";

const Q10_ICONS = ["moon", "transits", "houses", "rising", "sun", "planets", "wheel", "aspects"] as const;
const Q14_GLYPHS = ["sun", "moon", "chiron", "prism", "aries", "scorpio", "caduceus", "venus"] as const;
const Q15_ZO = ["aries", "taurus", "gemini", "cancer", "libra"] as const;

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

const warmed = new Set<string>();
let palmWarm: Promise<unknown> | null = null;

function numbered(prefix: string, count: number, start = 1): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + start}.webp`);
}

function assetsFor(step: StepId, answers: QuizAnswers): string[] {
  switch (step) {
    case "gender":
      return ["/images/quiz/gender-female.webp", "/images/quiz/gender-male.webp"];
    case "q3":
      return numbered("/images/quiz/q3-card-", 6);
    case "q5":
      return [CKPT, "/images/quiz/checkpoint-central.webp"];
    case "q7":
      return [CKPT, "/images/quiz/checkpoint2-central.webp", ...numbered("/images/quiz/q7-sym-", 8)];
    case "q8":
      return numbered("/images/quiz/q8-fig-", 5);
    case "q10":
      return [CKPT, "/images/quiz/q10-central.webp", ...Q10_ICONS.map((k) => `/images/quiz/q10-ic-${k}.webp`)];
    case "q14":
      return [CKPT, "/images/quiz/q14-central.webp", ...Q14_GLYPHS.map((k) => `/images/quiz/q14-gl-${k}.webp`)];
    case "q15":
      return Q15_ZO.map((z) => `/images/quiz/q15-zo-${z}.webp`);
    case "q18":
      return [CKPT, "/images/quiz/q18-clock-base.webp", "/images/quiz/q18-clock-ring.webp"];
    case "q19":
      return ["/images/quiz/q19-galaxy.webp", "/images/quiz/q19-orbits.webp"];
    case "q21":
      return [CKPT, "/images/quiz/q21-hand.webp"];
    case "q23":
      return ["/images/quiz/q21-hand.webp", "/images/quiz/q23-spiral.webp"];
    case "q24":
      return ["/images/quiz/q21-hand.webp", "/images/quiz/q24-spiral.webp"];
    case "q24b":
      return ["/images/quiz/q24b-main.webp", "/images/quiz/q24b-expert.webp"];
    case "q24c":
      return numbered("/images/quiz/wall-avatar-", 24, 0);
    case "q25":
      return [CKPT];
    case "q26":
      return [CKPT, "/images/quiz/q24-spiral.webp", "/images/quiz/q25-orbit.webp", "/images/quiz/q25-question.webp"];
    case "done": {
      const file = ARCHETYPE_IMG[answers.interest ?? "all"] ?? ARCHETYPE_IMG.all;
      return [CKPT, `/images/offer/archetypes/${file}.webp`, "/images/offer/palm/hand.webp"];
    }
    default:
      return [];
  }
}

function linearNext(step: StepId, answers: QuizAnswers): StepId | null {
  if (step === "done") return null;
  if (step === "q16" && answers.knowTime === "no") return "q18";
  if (step === "q27") return "done";
  const i = ORDER.indexOf(step);
  if (i < 0) return "q3";
  return ORDER[i + 1] ?? "done";
}

function upcoming(step: StepId, answers: QuizAnswers, depth = 2): StepId[] {
  const ids: StepId[] = [];
  let cur = step;
  for (let n = 0; n < depth; n++) {
    const next = linearNext(cur, answers);
    if (!next) break;
    ids.push(next);
    cur = next;
  }
  if (step === "q16" && answers.knowTime !== "yes" && !ids.includes("q18")) ids.push("q18");
  if (step === "q21" && !ids.includes("q24a")) ids.push("q24a");
  return ids;
}

function warmImages(urls: string[]) {
  for (const url of urls) {
    if (!url || warmed.has(url)) continue;
    warmed.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    void img.decode().catch(() => {
      /* decode optional — src still fills HTTP cache */
    });
  }
}

function warmPalm() {
  if (palmWarm) return;
  palmWarm = import("../palm/tracker")
    .then((m) => m.getImageLandmarker())
    .catch(() => {
      palmWarm = null;
    });
}

function saveData(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return nav.connection?.saveData === true;
}

export function schedulePreload(step: StepId, answers: QuizAnswers): () => void {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    const targets = saveData() ? upcoming(step, answers, 1) : upcoming(step, answers, 2);
    const urls = targets.flatMap((id) => assetsFor(id, answers));
    warmImages(urls);
    const palmSoon = [step, ...targets].some((id) => id === "q18a" || id === "q19" || id === "q21");
    if (palmSoon && !saveData()) warmPalm();
  };

  const ric = window.requestIdleCallback;
  if (typeof ric === "function") {
    const id = ric(run, { timeout: 450 });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(id);
    };
  }
  const t = window.setTimeout(run, 80);
  return () => {
    cancelled = true;
    window.clearTimeout(t);
  };
}

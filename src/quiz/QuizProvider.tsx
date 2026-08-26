import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DATE,
  DEFAULT_TIME,
  loadInitial,
  persistStorage,
  restoredSel,
  writeLocation,
  type QuizSnapshot,
} from "./persist";
import { isTimedStep, trimTimedTail } from "./flow";
import { schedulePreload } from "./preload";
import type { QuizAnswers, QuizState, StepId } from "./types";

type QuizContextValue = {
  step: StepId;
  history: StepId[];
  answers: QuizAnswers;
  palmUrl: string | null;
  palmLandmarks: { x: number; y: number }[] | null;
  sel: string | number | null;
  datePick: QuizState["datePick"];
  timePick: QuizState["timePick"];
  skipTimedAdvance: boolean;
  go: (id: StepId) => void;
  back: () => void;
  setAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  setAnswers: (patch: Partial<QuizAnswers>) => void;
  setPalmUrl: (url: string | null) => void;
  setPalmCapture: (url: string | null, landmarks: { x: number; y: number }[] | null) => void;
  setSel: (sel: string | number | null) => void;
  setDatePick: (patch: Partial<QuizState["datePick"]>) => void;
  setTimePick: (patch: Partial<QuizState["timePick"]>) => void;
  pick: (key: string | number, then: () => void) => void;
  reset: () => void;
};

const QuizContext = createContext<QuizContextValue | null>(null);

function snapshotOf(
  history: StepId[],
  answers: QuizAnswers,
  datePick: QuizState["datePick"],
  timePick: QuizState["timePick"],
): QuizSnapshot {
  return { history, answers, datePick, timePick };
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const boot = useMemo(() => loadInitial(), []);
  const [history, setHistory] = useState<StepId[]>(boot.history);
  const [answers, setAnswersState] = useState<QuizAnswers>(boot.answers);
  const [palmUrl, setPalmUrl] = useState<string | null>(null);
  const [palmLandmarks, setPalmLandmarks] = useState<{ x: number; y: number }[] | null>(null);
  const [sel, setSel] = useState<string | number | null>(null);
  const [datePick, setDatePickState] = useState(boot.datePick);
  const [timePick, setTimePickState] = useState(boot.timePick);
  const [skipTimedAdvance, setSkipTimedAdvance] = useState(() => boot.history.length > 1);
  const pickTimer = useRef<number | null>(null);
  const pushedCount = useRef(0);

  const historyRef = useRef(history);
  const answersRef = useRef(answers);
  const datePickRef = useRef(datePick);
  const timePickRef = useRef(timePick);
  historyRef.current = history;
  answersRef.current = answers;
  datePickRef.current = datePick;
  timePickRef.current = timePick;

  const applySnapshot = useCallback((snap: QuizSnapshot, timedSkip: boolean) => {
    let history = snap.history;
    if (timedSkip) {
      history = trimTimedTail(history);
    }
    const next = { ...snap, history };
    historyRef.current = next.history;
    answersRef.current = next.answers;
    datePickRef.current = next.datePick;
    timePickRef.current = next.timePick;
    setHistory(next.history);
    setAnswersState(next.answers);
    setDatePickState(next.datePick);
    setTimePickState(next.timePick);
    setSel(null);
    setSkipTimedAdvance(timedSkip);
    return next;
  }, []);

  useEffect(() => {
    writeLocation(
      boot.history.at(-1) ?? "gender",
      boot.answers,
      boot,
      "replace",
    );
  }, [boot]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const snap = (e.state as { quiz?: QuizSnapshot } | null)?.quiz;
      if (!snap?.history?.length) return;
      pushedCount.current = Math.max(0, pushedCount.current - 1);
      const next = applySnapshot(snap, true);
      persistStorage(next);
      if (next.history.at(-1) !== snap.history.at(-1)) {
        writeLocation(
          next.history.at(-1) ?? "gender",
          next.answers,
          next,
          "replace",
        );
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [applySnapshot]);

  const go = useCallback((id: StepId) => {
    setSel(null);
    setSkipTimedAdvance(false);
    const cur = historyRef.current.at(-1);
    const leavingTimed = cur != null && isTimedStep(cur);
    const nextHist = leavingTimed
      ? [...historyRef.current.slice(0, -1), id]
      : [...historyRef.current, id];
    historyRef.current = nextHist;
    setHistory(nextHist);
    const snap = snapshotOf(nextHist, answersRef.current, datePickRef.current, timePickRef.current);
    if (leavingTimed) {
      writeLocation(id, answersRef.current, snap, "replace");
    } else {
      writeLocation(id, answersRef.current, snap, "push");
      pushedCount.current += 1;
    }
  }, []);

  const back = useCallback(() => {
    if (historyRef.current.length <= 1) return;
    setSel(null);
    setSkipTimedAdvance(true);
    if (pushedCount.current > 0) {
      window.history.back();
      return;
    }
    const nextHist = trimTimedTail(historyRef.current.slice(0, -1));
    historyRef.current = nextHist;
    setHistory(nextHist);
    writeLocation(
      nextHist.at(-1) ?? "gender",
      answersRef.current,
      snapshotOf(nextHist, answersRef.current, datePickRef.current, timePickRef.current),
      "replace",
    );
  }, []);

  const replaceAnswers = useCallback((next: QuizAnswers) => {
    answersRef.current = next;
    setAnswersState(next);
    const hist = historyRef.current;
    writeLocation(
      hist.at(-1) ?? "gender",
      next,
      snapshotOf(hist, next, datePickRef.current, timePickRef.current),
      "replace",
    );
  }, []);

  const setAnswer = useCallback(<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    replaceAnswers({ ...answersRef.current, [key]: value });
  }, [replaceAnswers]);

  const setAnswers = useCallback((patch: Partial<QuizAnswers>) => {
    replaceAnswers({ ...answersRef.current, ...patch });
  }, [replaceAnswers]);

  const setDatePick = useCallback((patch: Partial<QuizState["datePick"]>) => {
    const next = { ...datePickRef.current, ...patch };
    datePickRef.current = next;
    setDatePickState(next);
    persistStorage(snapshotOf(historyRef.current, answersRef.current, next, timePickRef.current));
  }, []);

  const setTimePick = useCallback((patch: Partial<QuizState["timePick"]>) => {
    const next = { ...timePickRef.current, ...patch };
    timePickRef.current = next;
    setTimePickState(next);
    persistStorage(snapshotOf(historyRef.current, answersRef.current, datePickRef.current, next));
  }, []);

  const setPalmCapture = useCallback((url: string | null, landmarks: { x: number; y: number }[] | null) => {
    setPalmUrl(url);
    setPalmLandmarks(landmarks);
  }, []);

  const pick = useCallback((key: string | number, then: () => void) => {
    setSel(key);
    if (pickTimer.current) window.clearTimeout(pickTimer.current);
    pickTimer.current = window.setTimeout(then, 200);
  }, []);

  const reset = useCallback(() => {
    const snap: QuizSnapshot = {
      history: ["gender"],
      answers: {},
      datePick: DEFAULT_DATE,
      timePick: DEFAULT_TIME,
    };
    applySnapshot(snap, false);
    setPalmUrl(null);
    setPalmLandmarks(null);
    pushedCount.current = 0;
    writeLocation("gender", {}, snap, "replace");
  }, [applySnapshot]);

  const step = history.at(-1) ?? "gender";
  const displaySel = sel ?? restoredSel(step, answers);

  useEffect(() => schedulePreload(step, answers), [step, answers.interest, answers.knowTime]);

  const value = useMemo<QuizContextValue>(
    () => ({
      step,
      history,
      answers,
      palmUrl,
      palmLandmarks,
      sel: displaySel,
      datePick,
      timePick,
      skipTimedAdvance,
      go,
      back,
      setAnswer,
      setAnswers,
      setPalmUrl,
      setPalmCapture,
      setSel,
      setDatePick,
      setTimePick,
      pick,
      reset,
    }),
    [
      step,
      history,
      answers,
      palmUrl,
      palmLandmarks,
      displaySel,
      datePick,
      timePick,
      skipTimedAdvance,
      go,
      back,
      setAnswer,
      setAnswers,
      setDatePick,
      setPalmCapture,
      setTimePick,
      pick,
      reset,
    ],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

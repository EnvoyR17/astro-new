import { useLayoutEffect, useState } from "react";
import { progressFor } from "../quiz/flow";
import { useQuiz } from "../quiz/QuizProvider";

/** Same quadratic as the dome fill: M0 60 Q187.5 -12 375 60 */
const TRACK = "M0 60 Q187.5 -12 375 60";

const ARC_LUT = (() => {
  const y = (t: number) => 60 * ((1 - t) ** 2 + t ** 2) - 24 * t * (1 - t);
  const acc = [0];
  for (let i = 1; i <= 64; i++) {
    acc.push(acc[i - 1] + Math.hypot(5.859375, y(i / 64) - y((i - 1) / 64)));
  }
  return acc.map((v) => v / acc[64]);
})();

const STARS = [
  { x: 40, y: 52, r: 1.1, o: 0.7 },
  { x: 96, y: 64, r: 0.8, o: 0.5 },
  { x: 150, y: 48, r: 1.3, o: 0.8 },
  { x: 205, y: 60, r: 0.9, o: 0.6 },
  { x: 250, y: 50, r: 1.1, o: 0.75 },
  { x: 300, y: 62, r: 0.8, o: 0.5 },
  { x: 338, y: 54, r: 1.2, o: 0.7 },
  { x: 120, y: 58, r: 0.7, o: 0.45 },
  { x: 272, y: 66, r: 0.7, o: 0.5 },
];

function dashAlong(a: number) {
  const t = 64 * Math.max(0, Math.min(1, a));
  const n = Math.min(63, Math.floor(t));
  return ARC_LUT[n] + (ARC_LUT[n + 1] - ARC_LUT[n]) * (t - n);
}

function domeAmount(progress: number) {
  return 0.08 + 0.84 * Math.pow(Math.max(0, Math.min(1, progress)), 0.7);
}

/** Survives remounts so the moon can tween between steps. */
let lastAmount: number | null = null;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function MoonIcon() {
  return (
    <svg className="qpa-moon" width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.34467 1.868C6.1875 1.99173 5.08896 2.44037 4.17601 3.16208C3.26306 3.88379 2.57297 4.84911 2.18548 5.94647C1.79799 7.04383 1.72894 8.22843 1.98628 9.36338C2.24363 10.4983 2.81689 11.5373 3.63979 12.3602C4.4627 13.1831 5.50166 13.7564 6.63661 14.0137C7.77156 14.2711 8.95617 14.202 10.0535 13.8145C11.1509 13.427 12.1162 12.7369 12.8379 11.824C13.5596 10.911 14.0083 9.8125 14.132 8.65533C13.7096 9.19204 13.1782 9.63314 12.5729 9.94954C11.9676 10.2659 11.3022 10.4505 10.6204 10.491C9.93857 10.5314 9.25594 10.427 8.61746 10.1844C7.97898 9.94187 7.39915 9.56675 6.9162 9.0838C6.43324 8.60085 6.05813 8.02102 5.81558 7.38254C5.57303 6.74406 5.46856 6.06142 5.50904 5.37962C5.54953 4.69783 5.73405 4.03235 6.05046 3.42706C6.36686 2.82177 6.80795 2.29041 7.34467 1.868ZM0.833333 8C0.833333 4.042 4.042 0.833333 8 0.833333C8.478 0.833333 8.71666 1.214 8.758 1.51733C8.79733 1.80933 8.68933 2.18067 8.354 2.38333C7.85596 2.68391 7.43287 3.09388 7.11676 3.58221C6.80065 4.07053 6.59983 4.62439 6.5295 5.20183C6.45917 5.77927 6.52118 6.36514 6.71083 6.91506C6.90048 7.46499 7.21281 7.96453 7.62413 8.37586C8.03546 8.78719 8.53501 9.09951 9.08493 9.28916C9.63486 9.47882 10.2207 9.54083 10.7982 9.4705C11.3756 9.40017 11.9295 9.19934 12.4178 8.88324C12.9061 8.56713 13.3161 8.14403 13.6167 7.646C13.8193 7.31066 14.1907 7.20267 14.4827 7.242C14.786 7.28333 15.1667 7.522 15.1667 8C15.1667 11.958 11.958 15.1667 8 15.1667C4.042 15.1667 0.833333 11.958 0.833333 8Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function ProgressDome() {
  const { step } = useQuiz();
  const target = domeAmount(progressFor(step));
  const [a, setA] = useState(() => lastAmount ?? target);

  useLayoutEffect(() => {
    const dest = target;
    const from = lastAmount ?? dest;
    if (Math.abs(from - dest) < 0.0008) {
      lastAmount = dest;
      setA(dest);
      return;
    }
    setA(from);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lastAmount = dest;
      setA(dest);
      return;
    }
    const dur = 620;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const v = from + (dest - from) * easeOutCubic(t);
      lastAmount = v;
      setA(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else lastAmount = dest;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const y = 60 * ((1 - a) ** 2 + a ** 2) - 24 * a * (1 - a);
  const filled = dashAlong(a);

  return (
    <div className="progress-dome" aria-hidden>
      <svg viewBox="0 0 375 72" preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <linearGradient id="qpaDome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241048" />
            <stop offset="1" stopColor="#150a2e" />
          </linearGradient>
          <filter id="qpaGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M0 60 Q187.5 -12 375 60 L375 72 L0 72 Z" fill="url(#qpaDome)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.o} />
        ))}
        <path
          d={TRACK}
          fill="none"
          stroke="rgba(58,37,102,0.45)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="qpa-arc-fill"
          d={TRACK}
          fill="none"
          stroke="#b57dff"
          strokeWidth="2.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={100}
          strokeDasharray={100}
          style={{ strokeDashoffset: 100 * (1 - filled) }}
          filter="url(#qpaGlow)"
        />
      </svg>
      <div
        className="qpa-moon-wrap"
        style={{
          left: `${a * 100}%`,
          top: `${(y / 72) * 100}%`,
        }}
      >
        <MoonIcon />
      </div>
    </div>
  );
}

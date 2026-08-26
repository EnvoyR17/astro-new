import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Pt = { x: number; y: number; r: number; focal?: boolean };

const GOLD = "#f1cf7c";
const LILAC = "#c9b1ff";
const DUR = 13000;
const STAR =
  "M12 1.6c.55 5.2 2.4 7.05 7.6 7.6 -5.2.55 -7.05 2.4 -7.6 7.6 -.55 -5.2 -2.4 -7.05 -7.6 -7.6 5.2 -.55 7.05 -2.4 7.6 -7.6z";

const H: Pt = { x: 120, y: 110, r: 2.6 };
const MAIN: Pt[] = [
  H,
  { x: 185, y: 128, r: 2.2 },
  { x: 240, y: 148, r: 4, focal: true },
  { x: 285, y: 172, r: 2.2 },
  { x: 395, y: 205, r: 2.4 },
  { x: 470, y: 222, r: 2 },
  { x: 530, y: 232, r: 2.2 },
  { x: 610, y: 228, r: 2 },
  { x: 685, y: 205, r: 2.4 },
  { x: 745, y: 172, r: 2.2 },
  { x: 790, y: 135, r: 2 },
  { x: 818, y: 95, r: 3.6, focal: true },
  { x: 852, y: 108, r: 2.6 },
];
const N: Pt = { x: 105, y: 55, r: 2.8 };
const S: Pt = { x: 60, y: 70, r: 2.4 };

function curve(pts: Pt[], t = 0.04): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i - 1] ?? pts[i];
    const r = pts[i];
    const l = pts[i + 1];
    const o = pts[i + 2] ?? l;
    const c1x = r.x + (l.x - a.x) * t;
    const c1y = r.y + (l.y - a.y) * t;
    const c2x = l.x - (o.x - r.x) * t;
    const c2y = l.y - (o.y - r.y) * t;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${l.x} ${l.y}`;
  }
  return d;
}

const PATHS = [
  { d: curve([N, H]), from: 0.04, to: 0.15 },
  { d: curve([S, H]), from: 0.06, to: 0.17 },
  { d: curve(MAIN), from: 0.12, to: 0.44 },
];

const STARS: { star: Pt; pop: number }[] = [
  { star: N, pop: 0.15 },
  { star: S, pop: 0.17 },
  ...MAIN.map((star, i) => ({
    star,
    pop: 0.12 + (i / (MAIN.length - 1)) * 0.32,
  })),
];

const LAYERS = [
  { w: 5.2, stroke: GOLD, op: 0.22 },
  { w: 1.4, stroke: "url(#qiStroke)", op: 0.9 },
];

const LOOP: KeyframeAnimationOptions = {
  duration: DUR,
  iterations: Infinity,
  easing: "linear",
};

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

export function Constel() {
  const reduce = useReducedMotion();
  const sceneRef = useRef<SVGGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGGElement | null)[]>([]);
  const focalRefs = useRef<(SVGPathElement | null)[]>([]);

  useLayoutEffect(() => {
    pathRefs.current.forEach((el) => {
      if (!el) return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = reduce ? "0" : `${len}`;
      el.dataset.len = String(len);
    });
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const anims: Animation[] = [];

    anims.push(
      scene.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 1, offset: 0.04 },
          { opacity: 1, offset: 0.93 },
          { opacity: 0, offset: 1 },
        ],
        LOOP,
      ),
    );

    PATHS.forEach((path, i) => {
      for (let li = 0; li < LAYERS.length; li++) {
        const el = pathRefs.current[i * LAYERS.length + li];
        if (!el) continue;
        const len = Number(el.dataset.len || el.getTotalLength());
        anims.push(
          el.animate(
            [
              { strokeDashoffset: len, offset: 0 },
              { strokeDashoffset: len, offset: path.from },
              { strokeDashoffset: 0, offset: path.to },
              { strokeDashoffset: 0, offset: 1 },
            ],
            LOOP,
          ),
        );
      }
    });

    let focalI = 0;
    let dotI = 0;
    STARS.forEach(({ star, pop }) => {
      const appear = Math.max(pop - 0.03, 0.001);
      const frames: Keyframe[] = [
        { opacity: 0, transform: "scale(0.22)", offset: 0 },
        { opacity: 0, transform: "scale(0.22)", offset: appear },
        { opacity: 1, transform: "scale(1.08)", offset: pop },
        { opacity: 1, transform: "scale(1)", offset: Math.min(pop + 0.04, 0.9) },
        { opacity: 1, transform: "scale(1)", offset: 0.93 },
        { opacity: 0, transform: "scale(1)", offset: 1 },
      ];
      if (star.focal) {
        const el = focalRefs.current[focalI++];
        if (el) anims.push(el.animate(frames, LOOP));
      } else {
        const el = dotRefs.current[dotI++];
        if (el) anims.push(el.animate(frames, LOOP));
      }
    });

    const onVis = () => {
      anims.forEach((a) => (document.hidden ? a.pause() : a.play()));
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      anims.forEach((a) => a.cancel());
    };
  }, [reduce]);

  return (
    <div className="qiConstelWrap" aria-hidden>
      <svg
        viewBox="0 0 900 280"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        className="qiConstelSvg"
      >
        <defs>
          <linearGradient id="qiStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e7d6ff" />
            <stop offset="0.5" stopColor={LILAC} />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
        </defs>

        <g ref={sceneRef} style={reduce ? undefined : { opacity: 0 }}>
          {PATHS.flatMap((path, pi) =>
            LAYERS.map((layer, li) => {
              const idx = pi * LAYERS.length + li;
              return (
                <path
                  key={`${pi}-${li}`}
                  ref={(el) => {
                    pathRefs.current[idx] = el;
                  }}
                  d={path.d}
                  fill="none"
                  stroke={layer.stroke}
                  strokeWidth={layer.w}
                  strokeOpacity={reduce ? 0.85 * layer.op : layer.op}
                  strokeLinecap="round"
                />
              );
            }),
          )}

          {STARS.map(({ star }, i) => {
            if (star.focal) {
              const scale = (6.2 * star.r) / 24;
              const focalIdx = STARS.slice(0, i).filter((s) => s.star.focal).length;
              return (
                <g
                  key={i}
                  transform={`translate(${star.x} ${star.y}) scale(${scale}) translate(-12 -12)`}
                >
                  <path
                    ref={(el) => {
                      focalRefs.current[focalIdx] = el;
                    }}
                    d={STAR}
                    fill={GOLD}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "center",
                      ...(reduce ? {} : { opacity: 0, transform: "scale(0.22)" }),
                    }}
                  />
                </g>
              );
            }
            const dotIdx = STARS.slice(0, i).filter((s) => !s.star.focal).length;
            return (
              <g key={i} transform={`translate(${star.x} ${star.y})`}>
                <g
                  ref={(el) => {
                    dotRefs.current[dotIdx] = el;
                  }}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    ...(reduce ? undefined : { opacity: 0, transform: "scale(0.22)" }),
                  }}
                >
                  <circle cx={0} cy={0} r={star.r} fill="#fffdf7" />
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

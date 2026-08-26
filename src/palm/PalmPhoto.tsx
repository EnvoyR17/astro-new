import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  fallbackLandmarks,
  PALM_LINE_COLORS,
  PALM_LINE_KEYS,
  palmSvgPaths,
  type PalmLineKey,
  type Pt,
} from "./geometry";

export function PalmPhoto({
  src,
  landmarks,
  visibleCount,
  animate = false,
}: {
  src: string;
  landmarks: Pt[] | null;
  visibleCount: number;
  animate?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState({ sw: 0, sh: 0 });

  const measure = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    setSize({ sw: img.naturalWidth, sh: img.naturalHeight });
  };

  useEffect(() => {
    measure();
  }, [src]);

  const lm = landmarks && landmarks.length >= 21 ? landmarks : fallbackLandmarks();

  return (
    <div className="palm-shot">
      <img ref={imgRef} src={src} alt="" onLoad={measure} />
      <PalmLines landmarks={lm} visibleCount={visibleCount} animate={animate} size={size} />
    </div>
  );
}

function PalmLines({
  landmarks,
  visibleCount,
  animate,
  size,
}: {
  landmarks: Pt[];
  visibleCount: number;
  animate: boolean;
  size: { sw: number; sh: number };
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((n) => n + 1);
  }, [visibleCount]);

  if (!size.sw) return null;
  const paths = palmSvgPaths(landmarks, size.sw, size.sh);
  if (!paths) return null;
  const keys = PALM_LINE_KEYS.slice(0, Math.max(0, visibleCount));

  return (
    <svg className="palm-shot-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {keys.map((key, i) => {
        const draw = animate && i === keys.length - 1;
        return (
          <PalmStroke
            key={`${key}-${draw ? tick : "done"}`}
            d={paths[key as PalmLineKey]}
            color={PALM_LINE_COLORS[key as PalmLineKey]}
            draw={draw}
          />
        );
      })}
    </svg>
  );
}

function PalmStroke({ d, color, draw }: { d: string; color: string; draw: boolean }) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLen(el.getTotalLength());
  }, [d]);

  const drawing = draw && len != null && len > 0;

  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="1.12"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={
        draw && len == null
          ? { opacity: 0 }
          : drawing
            ? {
                strokeDasharray: len,
                strokeDashoffset: len,
                animation: "palmLineDraw 2100ms ease-out forwards",
              }
            : undefined
      }
    />
  );
}

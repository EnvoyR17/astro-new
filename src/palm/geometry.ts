export type Pt = { x: number; y: number };

export const PALM_LINE_KEYS = ["heart", "mind", "life", "money"] as const;
export type PalmLineKey = (typeof PALM_LINE_KEYS)[number];

export const PALM_LINE_COLORS: Record<PalmLineKey, string> = {
  heart: "#36d399",
  mind: "#4da6ff",
  money: "#c77dff",
  life: "#f6b73c",
};

/** Live quiz templates (`tm` in legacy/js/7.js). */
const TEMPLATES: Record<PalmLineKey, [number, number][]> = {
  heart: [
    [0.3, -0.48],
    [0.42, -0.05],
    [0.4, 0.42],
  ],
  mind: [
    [0.19, 0.37],
    [0.16, 0.02],
    [0.01, -0.32],
  ],
  life: [
    [0.12, 0.47],
    [-0.2, 0.59],
    [-0.52, 0.27],
  ],
  money: [
    [-0.44, 0],
    [0, 0.02],
    [0.46, -0.02],
  ],
};

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

const TIPS = new Set([4, 8, 12, 16, 20]);

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, s: number): Pt => ({ x: a.x * s, y: a.y * s });
const norm = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};

export const ASPECT = 4 / 3;

export function fitPoint(
  nx: number,
  ny: number,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  mode: "cover" | "contain",
): Pt {
  const scale =
    mode === "cover" ? Math.max(dstW / srcW, dstH / srcH) : Math.min(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return {
    x: (dstW - dw) / 2 + nx * dw,
    y: (dstH - dh) / 2 + ny * dh,
  };
}

export function coverPoint(nx: number, ny: number, srcW: number, srcH: number, dstW: number, dstH: number): Pt {
  return fitPoint(nx, ny, srcW, srcH, dstW, dstH, "cover");
}

export function remapToFitted(
  pts: Pt[],
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  mode: "cover" | "contain",
): Pt[] {
  return pts.map((p) => {
    const q = fitPoint(p.x, p.y, srcW, srcH, dstW, dstH, mode);
    return { x: q.x / dstW, y: q.y / dstH };
  });
}

export function coverDrawImage(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcW: number,
  srcH: number,
) {
  const dstW = ctx.canvas.width;
  const dstH = ctx.canvas.height;
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  ctx.drawImage(src, (dstW - dw) / 2, (dstH - dh) / 2, dw, dh);
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  srcW: number,
  srcH: number,
) {
  if (pts.length < 21 || !srcW || !srcH) return;
  const dstW = ctx.canvas.width;
  const dstH = ctx.canvas.height;
  const mapped = pts.map((p) => coverPoint(p.x, p.y, srcW, srcH, dstW, dstH));
  ctx.lineWidth = Math.max(1, dstW * 0.002);
  ctx.strokeStyle = "#7ee8ff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.moveTo(mapped[a].x, mapped[a].y);
    ctx.lineTo(mapped[b].x, mapped[b].y);
  }
  ctx.stroke();
  for (let i = 0; i < mapped.length; i++) {
    const tip = TIPS.has(i);
    const r = tip ? Math.max(2.4, dstW * 0.005) : Math.max(1.8, dstW * 0.0036);
    ctx.beginPath();
    ctx.arc(mapped[i].x, mapped[i].y, r, 0, Math.PI * 2);
    ctx.fillStyle = tip ? "#7ee8ff" : "#ffffff";
    ctx.fill();
    ctx.lineWidth = Math.max(0.6, dstW * 0.001);
    ctx.strokeStyle = tip ? "#ffffff" : "rgba(11,26,40,.55)";
    ctx.stroke();
  }
}

export type CoverLayout = { dw: number; dh: number; ox: number; oy: number };

/** Scale to fill box (cover by the smaller side — portrait phone shots fill width). Optional focus keeps the palm in view. */
export function coverLayout(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focus?: Pt | null,
): CoverLayout {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  let ox = (dstW - dw) / 2;
  let oy = (dstH - dh) / 2;
  if (focus) {
    ox = dstW / 2 - focus.x * dw;
    oy = dstH / 2 - focus.y * dh;
    ox = Math.min(0, Math.max(dstW - dw, ox));
    oy = Math.min(0, Math.max(dstH - dh, oy));
  }
  return { dw, dh, ox, oy };
}

export function palmFocus(lm: Pt[]): Pt {
  const pts = [lm[0], lm[5], lm[9], lm[13], lm[17]].filter(Boolean);
  const n = pts.length || 1;
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / n,
    y: pts.reduce((s, p) => s + p.y, 0) / n,
  };
}

export function mapPtsToCover(lm: Pt[], layout: CoverLayout, dstW: number, dstH: number): Pt[] {
  return lm.map((p) => ({
    x: (layout.ox + p.x * layout.dw) / dstW,
    y: (layout.oy + p.y * layout.dh) / dstH,
  }));
}

/** Original quiz: map image-normalized landmarks into a 4:3 contain frame. */
export function fitToAspectBox(p: Pt, imageAspect: number, boxAspect = ASPECT): Pt {
  if (imageAspect > boxAspect) {
    const n = boxAspect / imageAspect;
    return { x: p.x, y: (1 - n) / 2 + p.y * n };
  }
  const n = imageAspect / boxAspect;
  return { x: (1 - n) / 2 + p.x * n, y: p.y };
}

/** Screen-space draw direction, matching the live quiz. */
const rnd = (n: number) => Math.round(n * 100) / 100;

function splinePath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${rnd(pts[0].x)} ${rnd(pts[0].y)} L ${rnd(pts[1].x)} ${rnd(pts[1].y)}`;
  let d = `M ${rnd(pts[0].x)} ${rnd(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${rnd(c1.x)} ${rnd(c1.y)} ${rnd(c2.x)} ${rnd(c2.y)} ${rnd(p2.x)} ${rnd(p2.y)}`;
  }
  return d;
}

/** Live-site `ty()`: landmarks already mapped into a 4:3 contain box (0–1). */
function ty(lm: Pt[]): Record<PalmLineKey, string> | null {
  if (lm.length !== 21) return null;
  const toA = (p: Pt): Pt => ({ x: p.x * ASPECT, y: p.y });
  const fromA = (p: Pt): Pt => ({ x: p.x / ASPECT, y: p.y });
  const wrist = toA(lm[0]);
  const thumb = toA(lm[2]);
  const iMcp = toA(lm[5]);
  const mMcp = toA(lm[9]);
  const rMcp = toA(lm[13]);
  const pMcp = toA(lm[17]);
  const knuckle = {
    x: (iMcp.x + mMcp.x + rMcp.x + pMcp.x) / 4,
    y: (iMcp.y + mMcp.y + rMcp.y + pMcp.y) / 4,
  };
  const origin = {
    x: wrist.x + (knuckle.x - wrist.x) * 0.5,
    y: wrist.y + (knuckle.y - wrist.y) * 0.5,
  };
  const up = norm(sub(knuckle, wrist));
  let right = { x: -up.y, y: up.x };
  if ((thumb.x - origin.x) * right.x + (thumb.y - origin.y) * right.y < 0) {
    right = { x: -right.x, y: -right.y };
  }
  const len = Math.hypot(knuckle.x - wrist.x, knuckle.y - wrist.y);
  const width = Math.hypot(iMcp.x - pMcp.x, iMcp.y - pMcp.y);
  const out = {} as Record<PalmLineKey, string>;
  for (const key of PALM_LINE_KEYS) {
    const world = TEMPLATES[key].map(([u, v]) => add(origin, add(mul(up, u * len), mul(right, v * width))));
    let svg = world.map((p) => {
      const n = fromA(p);
      return { x: 100 * n.x, y: 100 * n.y };
    });
    if (key === "mind") svg = svg.slice().reverse();
    out[key] = splinePath(svg);
  }
  return out;
}

export function palmSvgPaths(lm: Pt[], srcW: number, srcH: number): Record<PalmLineKey, string> | null {
  if (lm.length < 21 || !srcW || !srcH) return null;
  const layout = coverLayout(srcW, srcH, ASPECT, 1);
  const fitted = mapPtsToCover(lm.slice(0, 21), layout, ASPECT, 1);
  return ty(fitted);
}

export function fallbackLandmarks(): Pt[] {
  const t = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  t[0] = { x: 0.5, y: 0.82 };
  t[2] = { x: 0.7, y: 0.58 };
  t[5] = { x: 0.58, y: 0.4 };
  t[9] = { x: 0.5, y: 0.37 };
  t[13] = { x: 0.42, y: 0.4 };
  t[17] = { x: 0.36, y: 0.46 };
  return t;
}

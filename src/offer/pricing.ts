export const TRIAL_PRICES: Record<string, { cents: number; compareCents: number }> = {
  trial1: { cents: 500, compareCents: 5900 },
  trial2: { cents: 900, compareCents: 5900 },
  trial3: { cents: 1300, compareCents: 5900 },
  trial4: { cents: 1767, compareCents: 5900 },
};

export function formatEuro(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export function resolveTier(price?: string) {
  const id = price && price in TRIAL_PRICES ? price : "trial4";
  const p = TRIAL_PRICES[id];
  return {
    id,
    label: formatEuro(p.cents),
    compare: formatEuro(p.compareCents),
    cents: p.cents,
  };
}

const ZODIAC = [
  "Козерог",
  "Водолей",
  "Рыбы",
  "Овен",
  "Телец",
  "Близнецы",
  "Рак",
  "Лев",
  "Дева",
  "Весы",
  "Скорпион",
  "Стрелец",
] as const;

/** Approximate sun sign from month/day (tropical). */
export function sunSignFromDate(d: number, m: number): string {
  const day = d + 1;
  const month = m + 1;
  const cuts: [number, number, number][] = [
    [1, 20, 0],
    [2, 19, 1],
    [3, 20, 2],
    [4, 20, 3],
    [5, 21, 4],
    [6, 21, 5],
    [7, 22, 6],
    [8, 23, 7],
    [9, 23, 8],
    [10, 23, 9],
    [11, 22, 10],
    [12, 22, 11],
  ];
  for (let i = 0; i < cuts.length; i++) {
    const [mo, da, idx] = cuts[i];
    if (month === mo && day <= da) return ZODIAC[idx];
    if (month === mo) return ZODIAC[(idx + 1) % 12];
  }
  return ZODIAC[0];
}

export function moonSignFromDate(d: number, m: number): string {
  // Deterministic stand-in (no ephemeris): offset from sun
  const sun = sunSignFromDate(d, m);
  const i = ZODIAC.indexOf(sun as (typeof ZODIAC)[number]);
  return ZODIAC[(i + 4) % 12];
}

/** Rough rising stand-in: near sunrise (~6h) rising ≈ sun sign. */
export function risingSignFromTime(d: number, m: number, hour = 12): string {
  const sun = sunSignFromDate(d, m);
  const i = ZODIAC.indexOf(sun as (typeof ZODIAC)[number]);
  const offset = Math.round((((hour % 24) - 6 + 24) % 24) / 2) % 12;
  return ZODIAC[(i + offset) % 12];
}

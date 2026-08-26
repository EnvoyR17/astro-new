import tzlookup from "tz-lookup";

export type PlaceHit = {
  name: string;
  lat: number;
  lon: number;
  tz: string;
};

const CYR_TO_LAT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "'",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Cities / towns only — cuts OSM cafés & street codes for short nonsense queries. */
const PLACE_TYPES = new Set([
  "city",
  "town",
  "village",
  "hamlet",
  "municipality",
  "administrative",
]);

function translit(s: string): string {
  let out = "";
  const lowerFull = s.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const lower = ch.toLowerCase();
    // soft sign + vowel → BGN-ish: ье → 'ye (Zarech'ye)
    if (lower === "ь" && i + 1 < s.length) {
      const next = lowerFull[i + 1];
      const softVowel: Record<string, string> = {
        е: "ye",
        ё: "yo",
        ю: "yu",
        я: "ya",
        и: "yi",
      };
      if (next in softVowel) {
        out += "'" + softVowel[next];
        i += 1;
        continue;
      }
    }
    if (lower in CYR_TO_LAT) {
      const lat = CYR_TO_LAT[lower];
      out += ch === lower ? lat : lat.charAt(0).toUpperCase() + lat.slice(1);
    } else {
      out += ch;
    }
  }
  return out;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "");
}

/** Reject fuzzy OSM junk (e.g. "выф" → Namibia house codes). */
export function nameMatchesQuery(placeName: string, query: string): boolean {
  const q = query.trim();
  if (q.length < 2) return false;
  const nRaw = placeName.trim();
  const nq = norm(q);
  const nn = norm(nRaw);
  const nqt = norm(translit(q));
  const nnt = norm(translit(nRaw));
  if (!nq && !nqt) return false;
  return (
    (!!nq && (nn.startsWith(nq) || nnt.startsWith(nq))) ||
    (!!nqt && (nn.startsWith(nqt) || nnt.startsWith(nqt)))
  );
}

function anyNameMatches(candidates: string[], query: string): boolean {
  return candidates.some((c) => c && nameMatchesQuery(c, query));
}

function formatLabel(englishOrLatin: string, country?: string): string {
  const hasCyr = /[а-яё]/i.test(englishOrLatin);
  const name = hasCyr ? translit(englishOrLatin) : englishOrLatin;
  if (country && country !== name) return `${name}, ${country}`;
  return name;
}

type NominatimItem = {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  type?: string;
  class?: string;
  namedetails?: Record<string, string>;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function primaryFrom(item: NominatimItem): string {
  const a = item.address ?? {};
  return (
    item.name ||
    a.city ||
    a.town ||
    a.village ||
    a.hamlet ||
    a.municipality ||
    a.suburb ||
    a.county ||
    a.state ||
    (item.display_name ?? "").split(",")[0]?.trim() ||
    "Unknown"
  );
}

function nameCandidates(item: NominatimItem): string[] {
  const nd = item.namedetails ?? {};
  const a = item.address ?? {};
  return [
    item.name,
    nd["name:en"],
    nd.name,
    nd["name:ru"],
    nd["name:uk"],
    nd.int_name,
    a.city,
    a.town,
    a.village,
    a.hamlet,
    a.municipality,
    (item.display_name ?? "").split(",")[0]?.trim(),
  ].filter((x): x is string => !!x && x.trim().length > 0);
}

function englishLabel(item: NominatimItem): string {
  const nd = item.namedetails ?? {};
  const en = nd["name:en"] || nd.int_name;
  if (en) return en;
  const primary = primaryFrom(item);
  if (/[а-яё]/i.test(primary)) return translit(primary);
  return primary;
}

export function parseNominatim(items: NominatimItem[], query: string): PlaceHit[] {
  const out: PlaceHit[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (item.class && item.class !== "place" && item.class !== "boundary") continue;
    if (item.type && !PLACE_TYPES.has(item.type)) continue;

    const candidates = nameCandidates(item);
    if (!anyNameMatches(candidates, query)) continue;

    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const name = formatLabel(englishLabel(item), item.address?.country);
    const key = `${name}|${lat.toFixed(2)}|${lon.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let tz = "UTC";
    try {
      tz = tzlookup(lat, lon);
    } catch {
      /* keep UTC */
    }
    out.push({ name, lat, lon, tz });
    if (out.length >= 4) break;
  }

  return out;
}

export const FALLBACK_PLACE: PlaceHit = {
  name: "Moscow, Russia",
  lat: 55.7558,
  lon: 37.6173,
  tz: "Europe/Moscow",
};

/** City autocomplete — English labels, strict match, max 4. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const local = `/api/birth-profile/search-places?q=${encodeURIComponent(q)}`;

  const res = await fetch(local, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`place search failed: ${res.status}`);

  const data = (await res.json()) as { results?: PlaceHit[]; items?: NominatimItem[] };

  if (Array.isArray(data.results)) {
    return data.results
      .filter((r) => nameMatchesQuery(r.name.split(",")[0] ?? r.name, q))
      .slice(0, 4);
  }

  if (Array.isArray(data.items)) return parseNominatim(data.items, q);

  return [];
}

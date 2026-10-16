// Shared helpers. Pure ESM without Node imports, so the browser demo can load the same files.

export const nl = {
  int: (n) => Math.round(n).toLocaleString("nl-BE"),
  dec: (n, d = 1) => n.toLocaleString("nl-BE", { minimumFractionDigits: d, maximumFractionDigits: d }),
  pct: (n, d = 1) => `${(n * 100).toLocaleString("nl-BE", { minimumFractionDigits: d, maximumFractionDigits: d })}%`,
  eur: (n) => `€${Math.round(n).toLocaleString("nl-BE")}`,
};

export function median(values) {
  const v = [...values].sort((a, b) => a - b);
  if (!v.length) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export const sum = (values) => values.reduce((a, b) => a + b, 0);
export const mean = (values) => (values.length ? sum(values) / values.length : 0);

/** Timestamps in the data have no zone ("2026-10-12T08:00"); read them as UTC everywhere so Node, CI and browsers agree. */
export function parse(s) {
  if (s instanceof Date) return s;
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : s.length === 10 ? `${s}T00:00Z` : `${s}Z`);
}

export function hoursBetween(a, b) {
  return (parse(b) - parse(a)) / 3_600_000;
}

export function addHours(iso, hours) {
  return new Date(parse(iso).getTime() + hours * 3_600_000).toISOString().slice(0, 16);
}

export function daysBetween(a, b) {
  return Math.round((parse(b) - parse(a)) / 86_400_000);
}

/** Deterministic id for idempotency keys (FNV-1a, hex). Not a security hash. */
export function stableKey(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

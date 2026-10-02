// Number formatting shared by every tool. Pure, so it is safe in node tests.

export function num(x, digits = 0) {
  if (x == null || !Number.isFinite(x)) return '-';
  return x.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function money(x, digits = 0) {
  if (x == null || !Number.isFinite(x)) return '-';
  const sign = x < 0 ? '-' : '';
  return `${sign}$${Math.abs(x).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

/** $1.2B, $340K, 24M style. */
export function compact(x, { currency = false, digits = 1 } = {}) {
  if (x == null || !Number.isFinite(x)) return '-';
  const abs = Math.abs(x);
  const units = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  let out = null;
  for (const [v, u] of units) {
    if (abs >= v) {
      const n = abs / v;
      out = `${n.toFixed(n >= 100 ? 0 : digits).replace(/\.0+$/, '')}${u}`;
      break;
    }
  }
  if (!out) out = abs.toFixed(abs < 10 && abs % 1 ? 2 : 0).replace(/\.00$/, '');
  return `${x < 0 ? '-' : ''}${currency ? '$' : ''}${out}`;
}

function trimZeros(s) {
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

/** Fraction -> percent string. pct(0.312) => "31.2%". */
export function pct(x, digits = 1) {
  if (x == null || !Number.isFinite(x)) return '-';
  return `${trimZeros((x * 100).toFixed(digits))}%`;
}

/** Signed percent, for lifts. */
export function signedPct(x, digits = 1) {
  if (x == null || !Number.isFinite(x)) return '-';
  return `${x > 0 ? '+' : ''}${pct(x, digits)}`;
}

/** Absolute change in percentage points: 0.086 => "+8.6 pts". */
export function pts(x, digits = 1) {
  if (x == null || !Number.isFinite(x)) return '-';
  return `${x > 0 ? '+' : ''}${(x * 100).toFixed(digits)} pts`;
}

export function toNumber(v, fallback = 0) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = parseFloat(String(v ?? '').replace(/[$,%\s]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export function toBool(v) {
  if (typeof v === 'boolean') return v;
  return /^(y|yes|true|1|x)$/i.test(String(v ?? '').trim());
}

export function todayISO(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

export function daysBetween(fromISO, toISO) {
  const a = Date.parse(fromISO);
  const b = Date.parse(toISO);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function splitList(s) {
  return String(s ?? '')
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

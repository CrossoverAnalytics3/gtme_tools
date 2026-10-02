// Small, dependency-free statistics helpers used across tools.
// Everything here is pure so it runs in the browser and in `node --test`.

// Standard normal CDF via the Abramowitz & Stegun 7.1.26 erf approximation
// (max error ~1.5e-7, plenty for marketing tests).
export function normCdf(z) {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

// Inverse standard normal CDF (Acklam's rational approximation).
export function normInv(p) {
  if (p <= 0 || p >= 1) throw new RangeError('p must be between 0 and 1');
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Two-proportion z-test. Group A is the control / baseline, B the treatment.
 * Returns rates, absolute and relative lift, a two-sided p-value and a 95% CI
 * on the absolute difference (unpooled standard error).
 */
export function twoProportionTest(xA, nA, xB, nB, alpha = 0.05) {
  if (!(nA > 0 && nB > 0)) return null;
  const pA = xA / nA;
  const pB = xB / nB;
  const pooled = (xA + xB) / (nA + nB);
  const sePooled = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));
  const z = sePooled > 0 ? (pB - pA) / sePooled : 0;
  const pValue = sePooled > 0 ? 2 * (1 - normCdf(Math.abs(z))) : 1;
  const seDiff = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
  const zc = normInv(1 - alpha / 2);
  const diff = pB - pA;
  return {
    pA,
    pB,
    diff,
    relLift: pA > 0 ? diff / pA : null,
    z,
    pValue,
    ciLow: diff - zc * seDiff,
    ciHigh: diff + zc * seDiff,
    significant: pValue < alpha,
  };
}

/**
 * Visitors needed per group to detect a relative lift `relMde` on a baseline
 * conversion rate `p1` with a two-sided test.
 */
export function sampleSizePerGroup(p1, relMde, alpha = 0.05, power = 0.8) {
  const p2 = p1 * (1 + relMde);
  if (!(p1 > 0 && p1 < 1 && p2 > 0 && p2 < 1) || p1 === p2) return null;
  const za = normInv(1 - alpha / 2);
  const zb = normInv(power);
  const pBar = (p1 + p2) / 2;
  const num = za * Math.sqrt(2 * pBar * (1 - pBar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil((num * num) / ((p2 - p1) * (p2 - p1)));
}

export function fmtP(p) {
  return p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`;
}

/** Plain-language verdict for a test result. */
export function verdict(test, alpha = 0.05) {
  if (!test) return { label: 'Not enough data', tone: 'warn' };
  if (test.pValue < alpha) {
    return test.diff > 0
      ? { label: `Significant lift (${fmtP(test.pValue)})`, tone: 'good' }
      : { label: `Significant drop (${fmtP(test.pValue)})`, tone: 'bad' };
  }
  if (test.pValue < 0.2) return { label: `Directional only (${fmtP(test.pValue)})`, tone: 'warn' };
  return { label: `No evidence of change (${fmtP(test.pValue)})`, tone: 'warn' };
}

export function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

export function sum(arr, fn = (x) => x) {
  return arr.reduce((acc, x) => acc + (Number(fn(x)) || 0), 0);
}

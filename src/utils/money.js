import { MAX_INPUT } from './constants.js';

/**
 * Money = integer paisa (Rs x 100). Qty = integer hundredths.
 * Uses BigInt to prevent any floating-point decimal rounding errors.
 */
export function lineAmount(qty, rate) {
  // qty(1/100) * rate(paisa) / 100, half-up rounding
  return Number((BigInt(qty) * BigInt(rate) + 50n) / 100n);
}

export function parseDecimal(text) {
  const s = String(text).replace(/,/g, '').trim();
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const p = s.split('.');
  const frac = (p[1] || '').padEnd(3, '0');
  const v = Number(p[0] || 0) * 100 + Number(frac.slice(0, 2)) + (frac[2] >= '5' ? 1 : 0);
  return v > MAX_INPUT ? null : v;
}

export const n0 = (c) => Math.round(c / 100).toLocaleString('en-US');

export const n2 = (c) => (c / 100).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const nq = (c) => (c / 100).toLocaleString('en-US', {
  maximumFractionDigits: 2
});

export const compact = (c) => 'Rs ' + (c / 100).toLocaleString('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2
});

export const pct = (x, base) => {
  const p = base ? (x / base - 1) * 100 : 0;
  return (p >= 0 ? '+' : '') + p.toFixed(1) + '%';
};


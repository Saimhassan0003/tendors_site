export const RH = 28;
export const HH = 54;
export const PAGE = 1000;
export const PER = 200;
export const OVERSCAN = 24;
export const UNDO_LIMIT = 500;
export const MAX_INPUT = 100000000000; // in 1/100 units

export const COLS = [
  { k: 'd', w: 330, l: 'Item / description' },
  { k: 'u', w: 52, l: 'Unit' },
  { k: 'q', w: 84, l: 'Qty', e: 1 },
  { k: 'r', w: 92, l: 'Rate', e: 1 },
  { k: 'a', w: 112, l: 'Amount' },
  { k: 'v0', w: 100, l: 'A · Al-Noor', e: 1 },
  { k: 'v1', w: 100, l: 'B · Hashmi', e: 1 },
  { k: 'v2', w: 100, l: 'C · Metro', e: 1 },
  { k: 'b', w: 60, l: 'Best' },
  { k: 'ba', w: 112, l: 'Best amt' },
  { k: 'df', w: 126, l: 'Δ vs budget' }
];

let totalW = 0;
export const CI = {};

COLS.forEach((c, i) => {
  c.x = totalW;
  totalW += c.w;
  CI[c.k] = i;
});

export const TOTAL_W = totalW;

export const GRID_VARS = {
  '--cols': COLS.map((c, i) => (i === COLS.length - 1 ? `minmax(${c.w}px, 1fr)` : `${c.w}px`)).join(' '),
  '--tw': `${TOTAL_W}px`
};

export const VENDORS = ['A · Al-Noor', 'B · Hashmi', 'C · Metro'];


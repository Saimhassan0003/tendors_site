import { lineAmount } from './money.js';

export function makeLine(src) {
  const va = src.v.map((v) => lineAmount(src.q, v));
  let bi = 0;
  va.forEach((x, i) => {
    if (x < va[bi]) bi = i;
  });
  const a = lineAmount(src.q, src.r);
  return {
    ...src,
    a,
    va,
    bi,
    ba: va[bi],
    d: va[bi] - a
  };
}

export function rollup(node, children) {
  let a = 0;
  let ba = 0;
  let r = 0;
  const va = [0, 0, 0];
  const v = [0, 0, 0];

  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    a += c.a;
    ba += c.ba;
    va[0] += c.va[0];
    va[1] += c.va[1];
    va[2] += c.va[2];
    if (c.r !== undefined) r += c.r;
    if (c.v) {
      v[0] += c.v[0];
      v[1] += c.v[1];
      v[2] += c.v[2];
    }
  }

  let bi = 0;
  va.forEach((x, i) => {
    if (x < va[bi]) bi = i;
  });

  const res = {
    ...node,
    a,
    ba,
    va,
    r,
    v,
    q: children[0] ? children[0].q : (node.q || 0),
    bi,
    d: ba - a
  };

  if (node.lines) res.lines = children;
  if (node.items) res.items = children;

  return res;
}

export const getField = (node, k) => {
  if (!node) return 0;
  if (k === 'q') return node.q || 0;
  if (k === 'r') return node.r || 0;
  if (k.startsWith('v')) {
    const vi = +k[1];
    return node.v ? node.v[vi] || 0 : (node.va ? node.va[vi] || 0 : 0);
  }
  return 0;
};

export function withField(ln, k, val) {
  if (k === 'q') return makeLine({ ...ln, q: val });
  if (k === 'r') return makeLine({ ...ln, r: val });
  const v = ln.v.slice();
  v[+k[1]] = val;
  return makeLine({ ...ln, v });
}

export function updateTree(cats, loc, k, val) {
  return cats.map((cat, ci) => {
    if (ci !== loc[0]) return cat;

    const items = cat.items.map((it, ii) => {
      if (ii !== loc[1]) return it;

      // Direct Sub-item edit [ci, ii]
      if (loc.length === 2) {
        if (k === 'q') {
          const newLines = it.lines.map((ln) => withField(ln, 'q', val));
          return rollup({ ...it, q: val }, newLines);
        }
        if (k === 'r') {
          const oldTotalR = it.lines.reduce((s, l) => s + l.r, 0) || 1;
          const ratio = val / oldTotalR;
          const newLines = it.lines.map((ln) => withField(ln, 'r', Math.round(ln.r * ratio)));
          return rollup({ ...it, r: val }, newLines);
        }
        if (k.startsWith('v')) {
          const vi = +k[1];
          const oldTotalV = it.lines.reduce((s, l) => s + l.v[vi], 0) || 1;
          const ratio = val / oldTotalV;
          const newLines = it.lines.map((ln) => {
            const newV = Math.round(ln.v[vi] * ratio);
            return withField(ln, k, newV);
          });
          return rollup(it, newLines);
        }
      }

      // Line item edit [ci, ii, li]
      const newLines = it.lines.map((ln, li) => (li === loc[2] ? withField(ln, k, val) : ln));
      return rollup(it, newLines);
    });

    return rollup(cat, items);
  });
}

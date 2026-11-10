import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PAGE, PER } from '../utils/constants';
import { NT } from '../data/generateData';

function flatten(cats, open, loaded) {
  const out = [];
  for (let c = 0; c < cats.length; c++) {
    const cat = cats[c];
    if (cat.start >= loaded) break;
    out.push({ k: cat.id, t: 'c', o: cat });
    if (!open.has(cat.id)) continue;

    for (let i = 0; i < cat.items.length; i++) {
      const it = cat.items[i];
      if (it.g >= loaded) break;
      out.push({ k: it.id, t: 'i', o: it });
      if (open.has(it.id)) {
        for (let l = 0; l < it.lines.length; l++) {
          out.push({ k: it.lines[l].id, t: 'l', o: it.lines[l] });
        }
      }
    }
  }
  if (loaded < NT) out.push({ k: 'more', t: 's', o: null });
  return out;
}

export function useTree(cats) {
  const [open, setOpen] = useState(() => {
    const ids = new Set();
    // Expand categories
    cats.forEach((c) => ids.add(c.id));
    // Pre-expand initial sub-items so Material and Labor rows are directly visible immediately
    cats.slice(0, 4).forEach((c) => {
      c.items.forEach((i) => ids.add(i.id));
    });
    return ids;
  });

  const [loaded, setLoaded] = useState(PAGE);

  const rows = useMemo(() => flatten(cats, open, loaded), [cats, open, loaded]);

  const toggle = useCallback((id) => {
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const setLevel = useCallback((lv) => {
    const ids = [];
    if (lv >= 2) {
      cats.forEach((c) => {
        ids.push(c.id);
        if (lv >= 3) {
          c.items.forEach((i) => ids.push(i.id));
        }
      });
    }
    setOpen(new Set(ids));
  }, [cats]);

  const expandTo = useCallback((loc) => {
    const g = loc[0] * PER + loc[1];
    setLoaded((x) => Math.max(x, Math.min(NT, Math.ceil((g + 1) / PAGE) * PAGE)));
    setOpen((s) => new Set(s).add('c' + loc[0]).add('i' + g));
  }, []);

  const loadMore = useCallback((targetCount) => {
    setLoaded((curr) => {
      if (curr >= NT) return curr;
      const step = targetCount && targetCount > curr
        ? Math.min(NT, Math.max(curr + PAGE, Math.ceil(targetCount / 200) * 200))
        : Math.min(NT, curr + PAGE);
      return Math.max(curr, step);
    });
  }, []);

  return {
    rows,
    open,
    loaded,
    loading: false,
    toggle,
    setLevel,
    expandTo,
    loadMore
  };
}
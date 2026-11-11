import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RH, HH, OVERSCAN, COLS, CI, GRID_VARS } from '../utils/constants.js';
import { parseDecimal } from '../utils/money.js';
import { NT } from '../data/generateData.js';
import { Header } from './Header.jsx';
import { Row } from './Row.jsx';
import { CellEditor } from './CellEditor.jsx';

const isEditable = (row, c) => !!row && (row.t === 'l' || row.t === 'i') && !!COLS[CI[c]]?.e;

export function Grid(p) {
  const { sheet, tree } = p;
  const rows = tree.rows;
  const scRef = useRef(null);
  const pending = useRef(null);
  const raf = useRef(0);

  const [top, setTop] = useState(0);
  const [vh, setVh] = useState(600);
  const [act, setAct] = useState(null);
  const [edit, setEdit] = useState(null);

  const index = useMemo(() => {
    const m = new Map();
    rows.forEach((r, i) => {
      m.set(r.k, i);
    });
    return m;
  }, [rows]);

  const real = rows.length - (rows.length && rows[rows.length - 1].t === 's' ? 1 : 0);

  useEffect(() => {
    const el = scRef.current;
    if (!el) return;
    const f = () => {
      setVh(el.clientHeight - HH);
    };
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Infinite scroll trigger
  useEffect(() => {
    if (top + vh > rows.length * RH - 3500) {
      tree.loadMore();
    }
  }, [top, vh, rows.length, tree.loadMore]);

  const reveal = (ri, c) => {
    const el = scRef.current;
    if (!el) return;
    const y = ri * RH;
    const st = el.scrollTop;
    const view = el.clientHeight - HH;
    if (y < st) el.scrollTop = y;
    else if (y + RH > st + view) el.scrollTop = y + RH - view;

    const col = COLS[CI[c]];
    if (c !== 'd' && c !== 'df') {
      const fl = COLS[0].w;
      const fr = COLS[COLS.length - 1].w;
      if (col.x < el.scrollLeft + fl) {
        el.scrollLeft = col.x - fl;
      } else if (col.x + col.w > el.scrollLeft + el.clientWidth - fr) {
        el.scrollLeft = col.x + col.w - el.clientWidth + fr;
      }
    }
  };

  const go = (ri, c) => {
    if (!rows[ri]) return;
    setAct({ k: rows[ri].k, c });
    reveal(ri, c);
  };

  const nav = (dx, dy) => {
    if (!act || !index.has(act.k)) return go(0, 'd');
    go(
      Math.max(0, Math.min(real - 1, index.get(act.k) + dy)),
      COLS[Math.max(0, Math.min(COLS.length - 1, CI[act.c] + dx))].k
    );
  };

  // Undo/redo: jump to changed cell
  useEffect(() => {
    if (!sheet.last) return;
    const loc = sheet.last.loc;
    tree.expandTo(loc);
    const key =
      loc.length === 3
        ? 'l' + (loc[0] * 200 + loc[1]) + '.' + loc[2]
        : 'i' + (loc[0] * 200 + loc[1]);
    pending.current = {
      k: key,
      c: sheet.last.k
    };
  }, [sheet.last, tree]);

  useEffect(() => {
    const pd = pending.current;
    if (!pd || !index.has(pd.k)) return;
    pending.current = null;
    setAct(pd);
    reveal(index.get(pd.k), pd.c);
  }, [index]);

  const startEdit = (seed) => {
    const r = act && rows[index.get(act.k)];
    if (isEditable(r, act && act.c)) {
      setEdit({ k: act.k, c: act.c, seed });
    }
  };

  const done = (text, move) => {
    const e = edit;
    if (!e) return;
    const r = rows[index.get(e.k)];
    setEdit(null);

    if (text !== null && r && r.o && r.o.loc) {
      const v = parseDecimal(text);
      if (v !== null) {
        sheet.edit(r.o.loc, e.c, v);
      }
    }

    if (scRef.current) scRef.current.focus();
    if (move) nav(move[0], move[1]);
  };

  const onKeyDown = (e) => {
    if (edit || e.target.tagName === 'INPUT') return;
    const k = e.key;
    const m = e.ctrlKey || e.metaKey;

    if (m && /^[zy]$/i.test(k)) {
      e.preventDefault();
      k.toLowerCase() === 'y' || e.shiftKey ? sheet.redo() : sheet.undo();
      return;
    }

    if (m || e.altKey) return;

    const mv = {
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      PageDown: [0, 18],
      PageUp: [0, -18],
      Tab: [e.shiftKey ? -1 : 1, 0]
    }[k];

    if (mv) {
      e.preventDefault();
      nav(mv[0], mv[1]);
      return;
    }

    if (!act || !index.has(act.k)) return;
    const r = rows[index.get(act.k)];

    if (k === 'Enter' || k === 'F2') {
      e.preventDefault();
      if (isEditable(r, act.c)) {
        startEdit();
      } else if (act.c === 'd' && r.t !== 's' && r.t !== 'l') {
        tree.toggle(r.k);
      }
    } else if (k === ' ' && act.c === 'd' && r.t !== 'l') {
      e.preventDefault();
      tree.toggle(r.k);
    } else if (/^[0-9.]$/.test(k) && isEditable(r, act.c)) {
      e.preventDefault();
      startEdit(k);
    }
  };

  const onClick = (e) => {
    // If clicking inside the active editing input, let native input handle it!
    if (e.target.tagName === 'INPUT') return;

    const g = e.target.closest('[data-tg]');
    if (g) {
      tree.toggle(g.dataset.tg);
      return;
    }

    const c = e.target.closest('[data-r]');
    if (c) {
      const rowKey = c.dataset.r;
      const colKey = c.dataset.c;
      const r = rows[index.get(rowKey)];
      const a = { k: rowKey, c: colKey };
      setAct(a);

      if (isEditable(r, colKey)) {
        setEdit(a);
      } else {
        if (colKey === 'd' && r && r.t !== 'l' && r.t !== 's') {
          tree.toggle(rowKey);
        }
        if (scRef.current) scRef.current.focus();
      }
    }
  };

  const onDouble = (e) => {
    if (e.target.tagName === 'INPUT') return;
    const c = e.target.closest('[data-r]');
    if (!c) return;
    const r = rows[index.get(c.dataset.r)];
    const a = { k: c.dataset.r, c: c.dataset.c };
    setAct(a);
    if (isEditable(r, a.c)) {
      setEdit(a);
    } else if (a.c === 'd' && r.t !== 'l') {
      tree.toggle(r.k);
    }
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    const st = el.scrollTop;
    setTop(st);

    // Instant lazy-loading ahead of scroll position
    const buffer = 4000;
    if (st + vh > rows.length * RH - buffer) {
      const estRows = Math.ceil((st + vh + buffer) / RH);
      tree.loadMore(estRows);
    }
  };

  const a = Math.max(0, Math.floor(top / RH) - OVERSCAN);
  const b = Math.min(rows.length, Math.ceil((top + vh) / RH) + OVERSCAN);
  const vis = [];

  for (let i = a; i < b; i++) {
    const r = rows[i];
    vis.push(
      <Row
        key={r.k}
        row={r}
        top={i * RH}
        act={act && act.k === r.k ? act.c : null}
        open={tree.open.has(r.k)}
        loading={r.t === 's' && tree.loading}
      />
    );
  }

  const er = edit && rows[index.get(edit.k)];
  const ar = act && rows[index.get(act.k)];
  const label =
    ar && ar.t !== 's'
      ? (ar.t === 'l' ? ar.o.n : ar.o.name) + ' › ' + COLS[CI[act.c]].l
      : 'No cell selected';

  return (
    <>
      <div
        id="sc"
        ref={scRef}
        tabIndex={0}
        aria-label="Cost sheet grid"
        style={GRID_VARS}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onDoubleClick={onDouble}
      >
        <div id="in">
          <Header />
          <div id="bd" style={{ height: rows.length * RH }}>
            {vis}
            {er ? (
              <CellEditor
                key={edit.k + edit.c}
                top={index.get(edit.k) * RH}
                c={edit.c}
                seed={edit.seed}
                line={er.o}
                onDone={done}
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="st">
        <span className="st-cnt">
          {Math.min(tree.loaded, NT).toLocaleString('en-US')} of {NT.toLocaleString('en-US')} items loaded
        </span>
        <span className="st-path">{label}</span>
        <span className="sp" />
        <span className="st-hints">
          <kbd>↑↓←→</kbd> move · <kbd>Enter</kbd> edit · <kbd>Esc</kbd> cancel · <kbd>Ctrl+Z/Y</kbd>
        </span>
      </div>
    </>
  );
}
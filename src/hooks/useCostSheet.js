import { useReducer, useMemo, useCallback } from 'react';
import { UNDO_LIMIT } from '../utils/constants.js';
import { getField, updateTree, rollup } from '../utils/costMath.js';
import { generateData } from '../data/generateData.js';

function sheetReducer(s, a) {
  if (a.type === 'edit') {
    const targetNode =
      a.loc.length === 3
        ? s.cats[a.loc[0]].items[a.loc[1]].lines[a.loc[2]]
        : s.cats[a.loc[0]].items[a.loc[1]];

    const old = getField(targetNode, a.k);
    if (old === a.val) return s;

    return {
      cats: updateTree(s.cats, a.loc, a.k, a.val),
      undo: s.undo.concat([{ loc: a.loc, k: a.k, o: old, n: a.val }]).slice(-UNDO_LIMIT),
      redo: [],
      last: null
    };
  }

  const from = a.type === 'undo' ? s.undo : s.redo;
  if (!from.length) return s;

  const op = from[from.length - 1];
  const rest = from.slice(0, -1);
  const val = a.type === 'undo' ? op.o : op.n;

  return {
    cats: updateTree(s.cats, op.loc, op.k, val),
    undo: a.type === 'undo' ? rest : s.undo.concat([op]),
    redo: a.type === 'undo' ? s.redo.concat([op]) : rest,
    last: { loc: op.loc, k: op.k }
  };
}

export function useCostSheet() {
  const [s, dispatch] = useReducer(sheetReducer, null, () => ({
    cats: generateData(),
    undo: [],
    redo: [],
    last: null
  }));

  const totals = useMemo(() => rollup({}, s.cats), [s.cats]);

  return {
    cats: s.cats,
    totals,
    last: s.last,
    canUndo: s.undo.length > 0,
    canRedo: s.redo.length > 0,
    edit: useCallback((loc, k, val) => {
      dispatch({ type: 'edit', loc, k, val });
    }, []),
    undo: useCallback(() => {
      dispatch({ type: 'undo' });
    }, []),
    redo: useCallback(() => {
      dispatch({ type: 'redo' });
    }, [])
  };
}
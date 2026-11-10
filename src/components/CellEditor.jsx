import React, { useState, useRef, useEffect } from 'react';
import { COLS, CI } from '../utils/constants.js';
import { getField } from '../utils/costMath.js';

export function CellEditor(props) {
  const [val, setVal] = useState(() => {
    if (props.seed !== undefined) return String(props.seed);
    const currentVal = getField(props.line, props.c);
    return String((currentVal || 0) / 100);
  });

  const inputRef = useRef(null);
  const done = useRef(false);
  const col = COLS[CI[props.c]];

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (props.seed === undefined) {
      el.select();
    } else {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [props.seed]);

  const finish = (save, move) => {
    if (done.current) return;
    done.current = true;
    props.onDone(save ? val : null, move);
  };

  return (
    <input
      ref={inputRef}
      className="ei"
      aria-label="Edit cell"
      inputMode="decimal"
      style={{ top: props.top, left: col.x, width: col.w }}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => finish(true, null)}
      onKeyDown={(e) => {
        const k = e.key;
        if (k === 'Escape') {
          e.preventDefault();
          finish(false, null);
        } else if (k === 'Enter') {
          e.preventDefault();
          finish(true, [0, e.shiftKey ? -1 : 1]);
        } else if (k === 'Tab') {
          e.preventDefault();
          finish(true, [e.shiftKey ? -1 : 1, 0]);
        } else if (k === 'ArrowDown') {
          e.preventDefault();
          finish(true, [0, 1]);
        } else if (k === 'ArrowUp') {
          e.preventDefault();
          finish(true, [0, -1]);
        }
      }}
    />
  );
}

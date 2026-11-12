import React, { useState, useRef, useEffect } from 'react';
import { COLS, CI } from '../utils/constants.js';
import { getField } from '../utils/costMath.js';

/**
 * Inline Cell Editor Component
 * -----------------------------
 * Mounts directly over an active editable cell.
 * Manages its own local text state while typing so that keystrokes
 * never trigger expensive re-renders across the rest of the 5,000-row table.
 */
export function CellEditor({ top, c, seed, line, onDone }) {
  const columnKey = c;
  const initialSeed = seed;
  const lineData = line;

  const [textValue, setTextValue] = useState(() => {
    // If opened via keyboard number press (0-9), start with that character
    if (initialSeed !== undefined && initialSeed !== null) {
      return String(initialSeed);
    }
    // Otherwise load existing numerical value divided by 100
    const rawPaisa = getField(lineData, columnKey);
    return String((rawPaisa || 0) / 100);
  });

  const inputElementRef = useRef(null);
  const isCompletedRef = useRef(false);
  const activeColumn = COLS[CI[columnKey]];

  useEffect(() => {
    const inputElement = inputElementRef.current;
    if (!inputElement) return;

    inputElement.focus();
    if (initialSeed === undefined || initialSeed === null) {
      inputElement.select(); // Highlight entire value for quick overwrite
    } else {
      inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
    }
  }, [initialSeed]);

  function handleSaveAndClose(shouldSave, navigationMove = null) {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    onDone(shouldSave ? textValue : null, navigationMove);
  }

  function handleKeyDown(event) {
    const { key, shiftKey } = event;

    if (key === 'Escape') {
      event.preventDefault();
      handleSaveAndClose(false); // Cancel edit
    } else if (key === 'Enter') {
      event.preventDefault();
      handleSaveAndClose(true, [0, shiftKey ? -1 : 1]); // Save & move down (or up with Shift)
    } else if (key === 'Tab') {
      event.preventDefault();
      handleSaveAndClose(true, [shiftKey ? -1 : 1, 0]); // Save & move right (or left with Shift)
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      handleSaveAndClose(true, [0, 1]);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      handleSaveAndClose(true, [0, -1]);
    }
  }

  return (
    <input
      ref={inputElementRef}
      className="ei"
      aria-label="Edit cell"
      inputMode="decimal"
      style={{
        top,
        left: activeColumn.x,
        width: activeColumn.width
      }}
      value={textValue}
      onChange={(e) => setTextValue(e.target.value)}
      onBlur={() => handleSaveAndClose(true, null)}
      onKeyDown={handleKeyDown}
    />
  );
}

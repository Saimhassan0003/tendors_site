import React from 'react';

/**
 * Top Application Header & Toolbar
 * --------------------------------
 * Displays tender project metadata, Undo/Redo buttons,
 * L1/L2/L3 hierarchy level toggles, and light/dark theme switch.
 */
export function Toolbar({ sheet, level, onUndo, onRedo, onLevel, onTheme }) {
  const levelDescriptions = [
    'Categories only (Level 1)',
    'Categories and sub-items (Level 2)',
    'Everything including material and labor (Level 3)'
  ];

  return (
    <header className="top">
      <div>
        <h1>Tender Cost Sheet</h1>
        <div className="sub">
          TN-2026-014 · Commercial Complex, Phase 2 · Currency: PKR
        </div>
      </div>

      <div className="sp" />

      {/* Undo Button */}
      <button
        type="button"
        className="btn"
        disabled={!sheet.canUndo}
        onClick={onUndo}
        title="Undo previous change (Ctrl+Z)"
      >
        ↶ Undo
      </button>

      {/* Redo Button */}
      <button
        type="button"
        className="btn"
        disabled={!sheet.canRedo}
        onClick={onRedo}
        title="Redo previous change (Ctrl+Y)"
      >
        ↷ Redo
      </button>

      {/* Segmented L1 | L2 | L3 Expand Levels */}
      <div className="seg" role="group" aria-label="Tree expansion levels">
        {[1, 2, 3].map((lvlNumber) => (
          <button
            key={lvlNumber}
            type="button"
            className={'btn' + (level === lvlNumber ? ' on' : '')}
            title={levelDescriptions[lvlNumber - 1]}
            onClick={() => onLevel(lvlNumber)}
          >
            {`L${lvlNumber}`}
          </button>
        ))}
      </div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        className="btn"
        aria-label="Toggle dark or light theme"
        onClick={onTheme}
        title="Toggle dark/light theme"
      >
        ◐
      </button>
    </header>
  );
}

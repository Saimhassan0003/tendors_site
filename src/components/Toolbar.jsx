import React from 'react';

export function Toolbar(p) {
  return (
    <div className="top">
      <div>
        <h1>Tender Cost Sheet</h1>
        <div className="sub">
          TN-2026-014 · Commercial Complex, Phase 2 · Currency: PKR
        </div>
      </div>
      <div className="sp" />
      <button
        className="btn"
        disabled={!p.sheet.canUndo}
        onClick={p.onUndo}
        title="Undo change"
      >
        ↶ Undo
      </button>
      <button
        className="btn"
        disabled={!p.sheet.canRedo}
        onClick={p.onRedo}
        title="Redo change"
      >
        ↷ Redo
      </button>
      <div className="seg" role="group" aria-label="Expand level">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={'btn' + (p.level === n ? ' on' : '')}
            title={
              [
                'Categories only',
                'Categories and sub-items',
                'Everything incl. material and labour'
              ][n - 1]
            }
            onClick={() => p.onLevel(n)}
          >
            {'L' + n}
          </button>
        ))}
      </div>
      <button
        className="btn"
        aria-label="Toggle light or dark theme"
        onClick={p.onTheme}
        title="Toggle dark/light theme"
      >
        ◐
      </button>
    </div>
  );
}


import React from 'react';

export function Toolbar(p) {
  return (
    <div className="top">
      <div className="brand">
        <div className="logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
        </div>
        <div>
          <div className="brand-row">
            <h1>Tender Cost Sheet</h1>
            <span className="live-pill"><span className="pulse-dot"></span> LIVE BOQ</span>
          </div>
          <div className="sub">
            TN-2026-014 · Commercial Complex, Phase 2 · Currency: <b>PKR</b>
          </div>
        </div>
      </div>

      <div className="sp" />

      <button
        className="btn"
        disabled={!p.sheet.canUndo}
        onClick={p.onUndo}
        title="Undo change (Ctrl+Z)"
      >
        ↺ Undo
      </button>
      <button
        className="btn"
        disabled={!p.sheet.canRedo}
        onClick={p.onRedo}
        title="Redo change (Ctrl+Y)"
      >
        ↻ Redo
      </button>

      <div className="seg" role="group" aria-label="Expand level">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={'btn' + (p.level === n ? ' on' : '')}
            title={
              [
                'Categories only (L1)',
                'Categories & 5,000 Sub-items (L2)',
                'Full Detail incl. Material & Labor (L3)'
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

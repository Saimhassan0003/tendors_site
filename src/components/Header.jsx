import React from 'react';
import { COLS } from '../utils/constants.js';

export function Header() {
  const groups = [
    [1, '', 'stl'],
    [1, '', ''],
    [3, 'Budget', 'ctr grp-budget'],
    [3, 'Vendor Quotes (Price Comparison)', 'ctr grp-vendors'],
    [2, 'Best Quote', 'ctr grp-best'],
    [1, 'Cost Difference', 'str ctr grp-diff']
  ];

  return (
    <div className="hd">
      <div className="hr">
        {groups.map((g, i) => (
          <div key={i} className={g[2]} style={{ gridColumn: `span ${g[0]}` }}>
            {g[1]}
          </div>
        ))}
      </div>
      <div className="hr c">
        {COLS.map((c) => (
          <div
            key={c.k}
            className={
              c.k === 'd'
                ? 'stl'
                : c.k === 'df'
                ? 'str n'
                : c.k === 'u' || c.k === 'b'
                ? 'ctr'
                : 'n'
            }
          >
            {c.l}
          </div>
        ))}
      </div>
    </div>
  );
}

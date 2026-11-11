import React from 'react';
import { COLS } from '../utils/constants.js';

export function Header() {
  const groups = [
    [1, '', 'stl'],
    [1, '', ''],
    [3, 'Budget', 'ctr grp'],
    [3, 'Vendor quotes', 'ctr grp'],
    [2, 'Best quote', 'ctr grp'],
    [1, 'Difference', 'str ctr grp']
  ];

  return (
    <div className="hd">
      <div className="hr">
        {groups.map((g, i) => (
          <div key={i} className={g[2]} style={{ gridColumn: `span ${g[0]}` }}>
            {g[1] ? <span>{g[1]}</span> : null}
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

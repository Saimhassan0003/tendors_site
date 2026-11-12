import React from 'react';
import { COLS } from '../utils/constants.js';

/**
 * 2-Tier Sticky Table Header
 * --------------------------
 * Top Row: High-level column groups (Budget, Vendor quotes, Best quote, Difference)
 * Bottom Row: Individual column titles
 */
export function Header() {
  const columnGroups = [
    { span: 1, title: '', className: 'stl' },
    { span: 1, title: '', className: '' },
    { span: 3, title: 'Budget', className: 'ctr grp' },
    { span: 3, title: 'Vendor quotes', className: 'ctr grp' },
    { span: 2, title: 'Best quote', className: 'ctr grp' },
    { span: 1, title: 'Difference', className: 'str ctr grp' }
  ];

  return (
    <div className="hd" role="rowgroup">
      {/* Tier 1: Group headers with centered labels and bottom rules */}
      <div className="hr" role="row">
        {columnGroups.map((group, index) => (
          <div
            key={index}
            className={group.className}
            style={{ gridColumn: `span ${group.span}` }}
            role="columnheader"
          >
            {group.title ? <span>{group.title}</span> : null}
          </div>
        ))}
      </div>

      {/* Tier 2: Specific column headers */}
      <div className="hr c" role="row">
        {COLS.map((column) => {
          let columnClasses = 'n';
          if (column.key === 'd') {
            columnClasses = 'stl';
          } else if (column.key === 'df') {
            columnClasses = 'str n';
          } else if (column.key === 'u' || column.key === 'b') {
            columnClasses = 'ctr';
          }

          return (
            <div key={column.key} className={columnClasses} role="columnheader">
              {column.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { VENDORS } from '../utils/constants';
import { n0, compact, pct } from '../utils/money';

export function Summary(p) {
  const T = p.totals;
  const mn = Math.min(...T.va);
  const sv = T.a - T.ba;

  const kpi = (key, label, v, good, note) => (
    <div key={key} className={'kpi' + (good ? ' g' : '')} title={'Rs ' + n0(v)}>
      <small>{label}</small>
      <b>{compact(v)}</b>
      {note ? <em>{note}</em> : null}
    </div>
  );

  return (
    <div className="sum">
      {kpi('b', 'Budget Total', T.a)}
      {VENDORS.map((n, i) =>
        kpi(
          'v' + i,
          n,
          T.va[i],
          T.va[i] === mn,
          T.va[i] === mn ? '★ Lowest Single Quote' : pct(T.va[i], T.a) + ' vs budget'
        )
      )}
      {kpi('x', 'Best of Quotes', T.ba, true, 'Cheapest line-by-line')}
      {kpi(
        's',
        sv >= 0 ? 'Potential Saving' : 'Over Budget',
        Math.abs(sv),
        sv >= 0,
        (sv / T.a * 100).toFixed(1) + '% vs budget'
      )}
    </div>
  );
}

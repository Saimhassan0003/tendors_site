import React, { memo } from 'react';
import { PAGE } from '../utils/constants';
import { n0, n2, nq, pct } from '../utils/money';

function RowComponent(props) {
  const { row, act, top, loading, open } = props;
  const { o, t } = row;

  if (t === 's') {
    return (
      <div className="r load" style={{ top }}>
        {loading ? (
          <>
            <span className="spin" />
            {'Loading the next ' + PAGE + ' items…'}
          </>
        ) : (
          'Scroll to load more items'
        )}
      </div>
    );
  }

  const isLine = t === 'l';
  const isItem = t === 'i';
  const isCat = t === 'c';
  const canEdit = isLine || isItem;

  const cell = (c, cls, child, title) => (
    <div
      key={c}
      className={cls + (act === c ? ' act' : '')}
      data-r={row.k}
      data-c={c}
      title={title}
    >
      {child}
    </div>
  );

  const label = (
    <span
      className="dd"
      style={{ paddingLeft: isCat ? 8 : isItem ? 24 : 40 }}
    >
      {isLine ? (
        <>
          <span className={'chip ' + (o.t === 'M' ? 'm' : 'l')}>
            {o.t === 'M' ? 'MAT' : 'LAB'}
          </span>
          <span className="t" title={o.n}>{o.n}</span>
        </>
      ) : (
        <>
          <button
            className={'chev' + (open ? ' o' : '')}
            data-tg={row.k}
            tabIndex={-1}
            aria-label="Expand or collapse"
            title={open ? 'Collapse row' : 'Expand row'}
          >
            ▶
          </button>
          <span className="code">{o.code}</span>
          <span className="t" title={o.name}>{o.name}</span>
          {isCat ? <span className="cnt">{o.items.length} sub-items</span> : null}
          {isItem ? <span className="cnt">{o.lines.length} lines</span> : null}
        </>
      )}
    </span>
  );

  // For rates: Line compares unit rates o.v; Sub-item and Category compare total amounts o.va
  const arr = isLine ? (o.v || [0, 0, 0]) : (o.va || [0, 0, 0]);
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);

  const cells = [
    cell('d', 'stl', label),
    cell('u', 'ctr mut', isCat ? '' : o.u),
    cell('q', 'n' + (canEdit ? ' ed' : ''), canEdit ? nq(o.q) : ''),
    cell('r', 'n' + (canEdit ? ' ed' : ''), canEdit ? n2(o.r) : ''),
    cell('a', 'n', n0(o.a))
  ];

  for (let k = 0; k < 3; k++) {
    const val = arr[k] || 0;
    const isLowest = mn < mx && val === mn;
    cells.push(
      cell(
        'v' + k,
        'n' + (canEdit ? ' ed' : '') + (isLowest ? ' bst' : ''),
        <span>{isLine ? n2(val) : n0(val)}</span>,
        pct(val, isLine ? o.r : o.a) + ' vs budget'
      )
    );
  }

  const d = o.d || 0;
  const isSingleVendor = isLine || (o.ba === (o.va && o.va[o.bi]));
  cells.push(
    cell(
      'b',
      'ctr',
      isSingleVendor && typeof o.bi === 'number' ? (
        <span className="vb">{'ABC'[o.bi]}</span>
      ) : (
        <span className="mut">mix</span>
      )
    ),
    cell('ba', 'n', n0(o.ba)),
    cell(
      'df',
      'str n',
      d > 50 ? (
        <span className="diff-pill up">▲ {n0(d)}</span>
      ) : d < -50 ? (
        <span className="diff-pill dn">▼ {n0(-d)}</span>
      ) : (
        <span className="diff-zero">–</span>
      ),
      pct(o.ba, o.a) + ' of budget' + (d < -50 ? ' (Saving)' : d > 50 ? ' (Over budget)' : '')
    )
  );

  return (
    <div
      className={'r ' + (isCat ? 'cat' : isItem ? 'item' : 'line')}
      style={{ top }}
    >
      {cells}
    </div>
  );
}

export const Row = memo(RowComponent, (prev, next) => {
  return (
    prev.row.k === next.row.k &&
    prev.row.t === next.row.t &&
    prev.row.o === next.row.o &&
    prev.top === next.top &&
    prev.act === next.act &&
    prev.open === next.open &&
    prev.loading === next.loading
  );
});

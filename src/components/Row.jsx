import React, { memo } from 'react';
import { PAGE_SIZE } from '../utils/constants.js';
import { formatRupees, formatRate, formatQuantity, formatPercentDiff } from '../utils/money.js';

/**
 * Individual Table Row Component
 * ------------------------------
 * Supports 3 nested tiers:
 * - Category: bold tinted row with sub-item count
 * - Sub-item: clean white row with line count
 * - Line item: indented Material / Labor leaf row with editable rates
 */
function RowComponent({ row, act, top, loading, open }) {
  const rowType = row.type || row.t;
  const rowData = row.data || row.o;
  const activeCol = act;
  const isExpanded = open;

  // Sentinel row displayed at the end of infinite scroll
  if (rowType === 'sentinel' || rowType === 's') {
    return (
      <div className="r load" style={{ top }}>
        {loading ? (
          <>
            <span className="spin" />
            {`Loading the next ${PAGE_SIZE} items…`}
          </>
        ) : (
          'Scroll to load more items'
        )}
      </div>
    );
  }

  const isCategory = rowType === 'category' || rowType === 'c';
  const isSubItem = rowType === 'item' || rowType === 'i';
  const isLineItem = rowType === 'line' || rowType === 'l';
  const isEditable = isLineItem || isSubItem;

  // Helper to render an individual cell
  function renderCell(columnKey, classNames, content, tooltip) {
    const isSelected = activeCol === columnKey;
    return (
      <div
        key={columnKey}
        className={classNames + (isSelected ? ' act' : '')}
        data-r={row.key || row.k}
        data-c={columnKey}
        title={tooltip}
      >
        {content}
      </div>
    );
  }

  // Row description / hierarchy label
  const indentationPadding = isCategory ? 8 : isSubItem ? 24 : 40;
  const labelContent = (
    <span className="dd" style={{ paddingLeft: indentationPadding }}>
      {isLineItem ? (
        <>
          <span className={'chip ' + (rowData.t === 'M' ? 'm' : 'l')}>
            {rowData.t === 'M' ? 'MAT' : 'LAB'}
          </span>
          <span className="t" title={rowData.name || rowData.n}>
            {rowData.name || rowData.n}
          </span>
        </>
      ) : (
        <>
          <button
            type="button"
            className={'chev' + (isExpanded ? ' o' : '')}
            data-tg={row.key || row.k}
            tabIndex={-1}
            aria-label="Expand or collapse row"
            title={isExpanded ? 'Collapse row' : 'Expand row'}
          >
            ▶
          </button>
          <span className="code">{rowData.code}</span>
          <span className="t" title={rowData.name}>
            {rowData.name}
          </span>
          {isCategory && rowData.items ? (
            <span className="cnt">{`${rowData.items.length} sub-items`}</span>
          ) : null}
          {isSubItem && rowData.lines ? (
            <span className="cnt">{`${rowData.lines.length} lines`}</span>
          ) : null}
        </>
      )}
    </span>
  );

  // Compare vendor rates on line items; compare total vendor amounts on category/sub-item rows
  const vendorValues = isLineItem 
    ? (rowData.vendorRates || rowData.v || [0, 0, 0]) 
    : (rowData.vendorAmounts || rowData.va || [0, 0, 0]);

  const minVendorValue = Math.min(...vendorValues);
  const maxVendorValue = Math.max(...vendorValues);

  const cells = [
    // 1. Description (Sticky left)
    renderCell('d', 'stl', labelContent),
    
    // 2. Unit of measurement
    renderCell('u', 'ctr mut', isCategory ? '' : (rowData.unit || rowData.u)),
    
    // 3. Quantity
    renderCell(
      'q',
      'n' + (isEditable ? ' ed' : ''),
      isEditable ? formatQuantity(rowData.quantity ?? rowData.q) : ''
    ),
    
    // 4. Budget Rate
    renderCell(
      'r',
      'n' + (isEditable ? ' ed' : ''),
      isEditable ? formatRate(rowData.rate ?? rowData.r) : ''
    ),
    
    // 5. Total Budget Amount
    renderCell('a', 'n', formatRupees(rowData.amount ?? rowData.a))
  ];

  // 6, 7, 8. Vendor Quote Columns (A, B, C)
  for (let vendorIdx = 0; vendorIdx < 3; vendorIdx++) {
    const quoteValue = vendorValues[vendorIdx] || 0;
    // Mark as lowest only if vendors have different quotes and this vendor is the minimum
    const isLowestQuote = minVendorValue < maxVendorValue && quoteValue === minVendorValue;
    const comparisonTooltip = `${formatPercentDiff(quoteValue, isLineItem ? rowData.r : rowData.a)} vs budget`;

    cells.push(
      renderCell(
        `v${vendorIdx}`,
        'n' + (isEditable ? ' ed' : '') + (isLowestQuote ? ' bst' : ''),
        <span>{isLineItem ? formatRate(quoteValue) : formatRupees(quoteValue)}</span>,
        comparisonTooltip
      )
    );
  }

  // 9. Best Vendor Column (A, B, C or mix)
  const vendorAmountsArray = rowData.vendorAmounts || rowData.va;
  const bestVendorIdx = rowData.bestVendorIndex ?? rowData.bi;
  const isSingleVendorBest = isLineItem || (rowData.ba === (vendorAmountsArray && vendorAmountsArray[bestVendorIdx]));

  const bestBadge = isSingleVendorBest && typeof bestVendorIdx === 'number' ? (
    <span className="vb">{'ABC'[bestVendorIdx]}</span>
  ) : (
    <span className="mut">mix</span>
  );

  cells.push(renderCell('b', 'ctr', bestBadge));

  // 10. Best Amount Column
  cells.push(renderCell('ba', 'n', formatRupees(rowData.bestAmount ?? rowData.ba)));

  // 11. Cost Difference Column (Δ vs Budget)
  const difference = rowData.difference ?? rowData.d ?? 0;
  let diffContent = <span className="diff-zero">–</span>;

  if (difference > 50) {
    diffContent = <span className="diff-pill up">{`▲ ${formatRupees(difference)}`}</span>;
  } else if (difference < -50) {
    diffContent = <span className="diff-pill dn">{`▼ ${formatRupees(-difference)}`}</span>;
  }

  const diffTooltip = `${formatPercentDiff(rowData.ba, rowData.a)} of budget` +
    (difference < -50 ? ' (Saving)' : difference > 50 ? ' (Over budget)' : '');

  cells.push(renderCell('df', 'str n', diffContent, diffTooltip));

  // Determine row CSS class
  const rowClass = isCategory ? 'cat' : isSubItem ? 'item' : 'line';

  return (
    <div className={`r ${rowClass}`} style={{ top }} role="row">
      {cells}
    </div>
  );
}

/**
 * Custom Memo Comparator:
 * Skips re-rendering rows whose data node reference (row.o / row.data) has not changed.
 * This ensures editing 1 cell only re-renders that single row, keeping table performance at 60 FPS.
 */
export const Row = memo(RowComponent, (prevProps, nextProps) => {
  return (
    (prevProps.row.key || prevProps.row.k) === (nextProps.row.key || nextProps.row.k) &&
    (prevProps.row.type || prevProps.row.t) === (nextProps.row.type || nextProps.row.t) &&
    (prevProps.row.data || prevProps.row.o) === (nextProps.row.data || nextProps.row.o) &&
    prevProps.top === nextProps.top &&
    prevProps.act === nextProps.act &&
    prevProps.open === nextProps.open &&
    prevProps.loading === nextProps.loading
  );
});

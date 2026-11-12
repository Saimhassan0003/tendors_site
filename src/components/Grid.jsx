import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ROW_HEIGHT, HEADER_HEIGHT, VIRTUAL_OVERSCAN, COLS, CI, GRID_VARS } from '../utils/constants.js';
import { parseDecimal } from '../utils/money.js';
import { NT } from '../data/generateData.js';
import { Header } from './Header.jsx';
import { Row } from './Row.jsx';
import { CellEditor } from './CellEditor.jsx';

// Checks if a cell is editable (only lines and sub-items on columns marked editable)
function isCellEditable(row, columnKey) {
  if (!row) return false;
  const isLineOrSubItem = row.type === 'line' || row.type === 'item' || row.t === 'l' || row.t === 'i';
  const columnIndex = CI[columnKey];
  return isLineOrSubItem && Boolean(COLS[columnIndex]?.isEditable || COLS[columnIndex]?.e);
}

/**
 * High-Performance Virtualized Grid Component
 * --------------------------------------------
 * Handles 60 FPS scrolling across 5,000+ items, keyboard cell navigation,
 * and inline cell editing with full undo/redo support.
 */
export function Grid({ sheet, tree }) {
  const allRows = tree.rows;
  const scrollContainerRef = useRef(null);
  const pendingFocusRef = useRef(null);

  // Viewport and scroll positions
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  // Active cell and inline editor state
  const [activeCell, setActiveCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  // Quick lookup map: rowKey -> rowIndex
  const rowIndexMap = useMemo(() => {
    const map = new Map();
    allRows.forEach((row, index) => {
      map.set(row.key || row.k, index);
    });
    return map;
  }, [allRows]);

  // Total count of real data rows (excluding bottom sentinel loader)
  const actualRowCount = allRows.length - (allRows.length && (allRows[allRows.length - 1].type === 'sentinel' || allRows[allRows.length - 1].t === 's') ? 1 : 0);

  // Measure scroll container height on resize
  useEffect(() => {
    const containerElement = scrollContainerRef.current;
    if (!containerElement) return;

    const updateHeight = () => {
      setViewportHeight(containerElement.clientHeight - HEADER_HEIGHT);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerElement);

    return () => resizeObserver.disconnect();
  }, []);

  // Infinite scroll trigger: loads next batch before reaching the bottom
  useEffect(() => {
    const bottomThreshold = allRows.length * ROW_HEIGHT - 3500;
    if (scrollTop + viewportHeight > bottomThreshold) {
      tree.loadMore();
    }
  }, [scrollTop, viewportHeight, allRows.length, tree]);

  /** Scrolls the container if selected cell is outside current view */
  const revealCell = useCallback((rowIndex, columnKey) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rowTop = rowIndex * ROW_HEIGHT;
    const currentScroll = container.scrollTop;
    const viewHeight = container.clientHeight - HEADER_HEIGHT;

    // Vertical auto-scroll
    if (rowTop < currentScroll) {
      container.scrollTop = rowTop;
    } else if (rowTop + ROW_HEIGHT > currentScroll + viewHeight) {
      container.scrollTop = rowTop + ROW_HEIGHT - viewHeight;
    }

    // Horizontal auto-scroll (keeping sticky columns visible)
    const targetColumn = COLS[CI[columnKey]];
    if (columnKey !== 'd' && columnKey !== 'df') {
      const stickyLeftWidth = COLS[0].width;
      const stickyRightWidth = COLS[COLS.length - 1].width;
      const leftBoundary = container.scrollLeft + stickyLeftWidth;
      const rightBoundary = container.scrollLeft + container.clientWidth - stickyRightWidth;

      if (targetColumn.x < leftBoundary) {
        container.scrollLeft = targetColumn.x - stickyLeftWidth;
      } else if (targetColumn.x + targetColumn.width > rightBoundary) {
        container.scrollLeft = targetColumn.x + targetColumn.width - container.clientWidth + stickyRightWidth;
      }
    }
  }, []);

  /** Sets the active cell and ensures it is scrolled into view */
  const selectCell = useCallback((rowIndex, columnKey) => {
    const row = allRows[rowIndex];
    if (!row) return;

    setActiveCell({ k: row.key || row.k, c: columnKey });
    revealCell(rowIndex, columnKey);
  }, [allRows, revealCell]);

  /** Navigates cell selection using keyboard arrow keys */
  const navigateSelection = useCallback((deltaColumn, deltaRow) => {
    if (!activeCell || !rowIndexMap.has(activeCell.k)) {
      return selectCell(0, 'd');
    }

    const currentRowIndex = rowIndexMap.get(activeCell.k);
    const currentColumnIndex = CI[activeCell.c];

    const nextRowIndex = Math.max(0, Math.min(actualRowCount - 1, currentRowIndex + deltaRow));
    const nextColumnIndex = Math.max(0, Math.min(COLS.length - 1, currentColumnIndex + deltaColumn));

    selectCell(nextRowIndex, COLS[nextColumnIndex].key);
  }, [activeCell, rowIndexMap, actualRowCount, selectCell]);

  // When undo/redo occurs: auto-expand and jump directly to the restored cell
  useEffect(() => {
    if (!sheet.last) return;
    const location = sheet.last.location || sheet.last.loc;
    tree.expandTo(location);

    const category = sheet.categories && sheet.categories[location[0]];
    const globalItemIndex = (category ? category.start : 0) + location[1];
    const targetKey = location.length === 3 
      ? `l${globalItemIndex}.${location[2]}` 
      : `i${globalItemIndex}`;

    pendingFocusRef.current = {
      k: targetKey,
      c: sheet.last.fieldKey || sheet.last.k
    };
  }, [sheet.last, tree, sheet.categories]);

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending || !rowIndexMap.has(pending.k)) return;

    pendingFocusRef.current = null;
    setActiveCell(pending);
    revealCell(rowIndexMap.get(pending.k), pending.c);
  }, [rowIndexMap, revealCell]);

  /** Starts inline cell editing */
  function startCellEditing(initialChar) {
    if (!activeCell) return;
    const targetRow = allRows[rowIndexMap.get(activeCell.k)];
    
    if (isCellEditable(targetRow, activeCell.c)) {
      setEditingCell({ k: activeCell.k, c: activeCell.c, seed: initialChar });
    }
  }

  /** Finishes inline editing: saves new value and optionally navigates to adjacent cell */
  function finishCellEditing(newTextValue, navigationMove) {
    const editing = editingCell;
    if (!editing) return;

    const row = allRows[rowIndexMap.get(editing.k)];
    setEditingCell(null);

    // Save edited value to state
    const nodeData = row ? (row.data || row.o) : null;
    if (newTextValue !== null && nodeData && nodeData.loc) {
      const parsedNumber = parseDecimal(newTextValue);
      if (parsedNumber !== null) {
        sheet.edit(nodeData.loc, editing.c, parsedNumber);
      }
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }
    
    if (navigationMove) {
      navigateSelection(navigationMove[0], navigationMove[1]);
    }
  }

  /** Global keyboard navigation listener */
  function handleKeyDown(event) {
    if (editingCell || event.target.tagName === 'INPUT') return;

    const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
    const isCommandKey = ctrlKey || metaKey;

    // Undo / Redo shortcuts (Ctrl+Z / Ctrl+Y)
    if (isCommandKey && /^[zy]$/i.test(key)) {
      event.preventDefault();
      if (key.toLowerCase() === 'y' || shiftKey) {
        sheet.redo();
      } else {
        sheet.undo();
      }
      return;
    }

    if (isCommandKey || altKey) return;

    // Directional navigation map
    const navigationDirections = {
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      PageDown: [0, 18],
      PageUp: [0, -18],
      Tab: [shiftKey ? -1 : 1, 0]
    };

    if (navigationDirections[key]) {
      event.preventDefault();
      const [deltaCol, deltaRow] = navigationDirections[key];
      navigateSelection(deltaCol, deltaRow);
      return;
    }

    if (!activeCell || !rowIndexMap.has(activeCell.k)) return;
    const selectedRow = allRows[rowIndexMap.get(activeCell.k)];

    if (key === 'Enter' || key === 'F2') {
      event.preventDefault();
      if (isCellEditable(selectedRow, activeCell.c)) {
        startCellEditing();
      } else if (activeCell.c === 'd' && selectedRow.type !== 'sentinel' && selectedRow.type !== 'line') {
        tree.toggle(selectedRow.key || selectedRow.k);
      }
    } else if (key === ' ' && activeCell.c === 'd' && selectedRow.type !== 'line') {
      event.preventDefault();
      tree.toggle(selectedRow.key || selectedRow.k);
    } else if (/^[0-9.]$/.test(key) && isCellEditable(selectedRow, activeCell.c)) {
      event.preventDefault();
      startCellEditing(key);
    }
  }

  /** Mouse click selection listener */
  function handleGridClick(event) {
    if (event.target.tagName === 'INPUT') return;

    // Toggle chevron click
    const toggleTarget = event.target.closest('[data-tg]');
    if (toggleTarget) {
      tree.toggle(toggleTarget.dataset.tg);
      return;
    }

    // Cell click
    const cellElement = event.target.closest('[data-r]');
    if (cellElement) {
      const rowKey = cellElement.dataset.r;
      const columnKey = cellElement.dataset.c;
      const row = allRows[rowIndexMap.get(rowKey)];
      const cellTarget = { k: rowKey, c: columnKey };

      setActiveCell(cellTarget);

      if (isCellEditable(row, columnKey)) {
        setEditingCell(cellTarget);
      } else {
        if (columnKey === 'd' && row && row.type !== 'line' && row.type !== 'sentinel') {
          tree.toggle(rowKey);
        }
        if (scrollContainerRef.current) {
          scrollContainerRef.current.focus();
        }
      }
    }
  }

  function handleDoubleClick(event) {
    if (event.target.tagName === 'INPUT') return;
    const cellElement = event.target.closest('[data-r]');
    if (!cellElement) return;

    const row = allRows[rowIndexMap.get(cellElement.dataset.r)];
    const cellTarget = { k: cellElement.dataset.r, c: cellElement.dataset.c };
    setActiveCell(cellTarget);

    if (isCellEditable(row, cellTarget.c)) {
      setEditingCell(cellTarget);
    } else if (cellTarget.c === 'd' && row.type !== 'line') {
      tree.toggle(row.key || row.k);
    }
  }

  /** High-speed scroll listener with instant lazy-loading prefetch */
  function handleScroll(event) {
    const container = event.currentTarget;
    const currentScrollTop = container.scrollTop;
    setScrollTop(currentScrollTop);

    // Pre-emptively load more items when scrolling near the bottom (4,000px buffer)
    const prefetchBuffer = 4000;
    if (currentScrollTop + viewportHeight > allRows.length * ROW_HEIGHT - prefetchBuffer) {
      const estimatedNeededRows = Math.ceil((currentScrollTop + viewportHeight + prefetchBuffer) / ROW_HEIGHT);
      tree.loadMore(estimatedNeededRows);
    }
  }

  // Calculate virtual window range (only render rows currently on screen + overscan buffer)
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const endIndex = Math.min(allRows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + VIRTUAL_OVERSCAN);
  const visibleRows = [];

  for (let idx = startIndex; idx < endIndex; idx++) {
    const row = allRows[idx];
    visibleRows.push(
      <Row
        key={row.key || row.k}
        row={row}
        top={idx * ROW_HEIGHT}
        act={activeCell && activeCell.k === (row.key || row.k) ? activeCell.c : null}
        open={tree.open.has(row.key || row.k)}
        loading={row.type === 'sentinel' && tree.loading}
      />
    );
  }

  // Selected cell label for bottom status bar
  const selectedRow = activeCell && allRows[rowIndexMap.get(activeCell.k)];
  const selectedRowData = selectedRow ? (selectedRow.data || selectedRow.o) : null;
  const statusLabel = selectedRowData
    ? `${selectedRowData.name || selectedRowData.n} › ${COLS[CI[activeCell.c]].label}`
    : 'No cell selected';

  const editingRow = editingCell && allRows[rowIndexMap.get(editingCell.k)];

  return (
    <>
      <div
        id="sc"
        ref={scrollContainerRef}
        tabIndex={0}
        aria-label="Tender cost sheet spreadsheet"
        style={GRID_VARS}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onClick={handleGridClick}
        onDoubleClick={handleDoubleClick}
      >
        <div id="in">
          <Header />
          <div id="bd" style={{ height: allRows.length * ROW_HEIGHT }}>
            {visibleRows}

            {/* Active Inline Cell Editor */}
            {editingRow ? (
              <CellEditor
                key={editingCell.k + editingCell.c}
                top={rowIndexMap.get(editingCell.k) * ROW_HEIGHT}
                c={editingCell.c}
                seed={editingCell.seed}
                line={editingRow.data || editingRow.o}
                onDone={finishCellEditing}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Enterprise Single-Line Status Bar (32px) */}
      <footer className="st">
        <span className="st-cnt">
          {`${Math.min(tree.loaded, NT).toLocaleString('en-US')} of ${NT.toLocaleString('en-US')} items loaded`}
        </span>
        <span className="st-path">{statusLabel}</span>
        <span className="sp" />
        <span className="st-hints">
          <kbd>↑↓←→</kbd> move · <kbd>Enter</kbd> edit · <kbd>Esc</kbd> cancel · <kbd>Ctrl+Z/Y</kbd> undo/redo
        </span>
      </footer>
    </>
  );
}

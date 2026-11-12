// ============================================================================
// Layout Dimensions & Grid Constants
// ============================================================================

export const ROW_HEIGHT = 32;       // Standard row height in pixels
export const HEADER_HEIGHT = 52;    // Combined 2-tier sticky header height
export const PAGE_SIZE = 1000;      // Number of sub-items loaded per batch
export const ITEMS_PER_CATEGORY = 5000; // Sub-items in the main tender BOQ category
export const VIRTUAL_OVERSCAN = 24; // Extra rows rendered above/below viewport
export const UNDO_LIMIT = 500;      // Maximum actions stored in undo history stack
export const MAX_INPUT = 100000000000; // Maximum allowed number (in 1/100 integer units)

// Backward compatibility aliases
export const RH = ROW_HEIGHT;
export const HH = HEADER_HEIGHT;
export const PAGE = PAGE_SIZE;
export const PER = ITEMS_PER_CATEGORY;
export const OVERSCAN = VIRTUAL_OVERSCAN;

// ============================================================================
// Spreadsheet Column Definitions
// ============================================================================

export const COLS = [
  { key: 'd',  width: 340, label: 'Item / description', isEditable: false },
  { key: 'u',  width: 56,  label: 'Unit',               isEditable: false },
  { key: 'q',  width: 84,  label: 'Qty',                isEditable: true  },
  { key: 'r',  width: 96,  label: 'Rate',               isEditable: true  },
  { key: 'a',  width: 112, label: 'Amount',             isEditable: false },
  { key: 'v0', width: 104, label: 'A · Al-Noor',        isEditable: true  },
  { key: 'v1', width: 104, label: 'B · Hashmi',         isEditable: true  },
  { key: 'v2', width: 104, label: 'C · Metro',          isEditable: true  },
  { key: 'b',  width: 56,  label: 'Best',               isEditable: false },
  { key: 'ba', width: 112, label: 'Best amt',           isEditable: false },
  { key: 'df', width: 124, label: 'Δ vs budget',        isEditable: false }
];

// Attach short aliases and calculate horizontal offsets
let cumulativeWidth = 0;
export const CI = {};

COLS.forEach((column, index) => {
  column.k = column.key;
  column.w = column.width;
  column.l = column.label;
  column.e = column.isEditable;
  column.x = cumulativeWidth;

  cumulativeWidth += column.width;
  CI[column.key] = index;
});

export const TOTAL_W = cumulativeWidth;

// CSS Grid template variables for sticky layout
export const GRID_VARS = {
  '--cols': COLS.map((col) => `${col.width}px`).join(' '),
  '--tw': `${TOTAL_W}px`
};

export const VENDORS = ['A · Al-Noor', 'B · Hashmi', 'C · Metro'];

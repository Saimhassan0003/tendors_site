# ERP Tender & BOQ Cost Sheet

A high-performance ERP Tender & BOQ Cost Sheet built with React, JavaScript, and pure CSS.

## Features

- **Nested Spreadsheet Table**: 3-level hierarchy (Main Category → Sub-item → Material/Labor) with expandable and collapsible rows and inline cell editing.
- **Massive Data with Infinite Scroll**: Supports 5,000+ items loaded smoothly in one continuous view using virtual windowing.
- **Compact Custom Layout**: Built with CSS Grid and Flexbox, with frozen/sticky table headers and columns that stay in place during horizontal and vertical scrolling.
- **Vendor Price Comparison**: 3 vendor quotes beside budget rates with instant automatic lowest rate detection (`LOW` badge highlight) and variance vs budget calculation.
- **Precision Financial Math**: Exact BigInt/integer arithmetic preventing floating-point rounding errors.
- **Keyboard Shortcuts**: Arrow key cell navigation, Tab/Enter cell traversal, and 500-level Undo/Redo (`Ctrl+Z` / `Ctrl+Y`).
- **Zero Pagination**: 100% continuous scroll without pagination breaks.

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```


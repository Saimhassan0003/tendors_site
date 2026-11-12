import { MAX_INPUT } from './constants.js';

/**
 * Precision Financial Engine
 * --------------------------
 * To prevent JavaScript floating-point errors (e.g. 0.1 + 0.2 = 0.30000000000000004),
 * all currency amounts are stored as integer Paisa (Rs * 100).
 * Quantities are also stored as hundredths (e.g. 15.5 bags = 1550).
 */

/**
 * Calculates line amount: quantity * unit rate.
 * Uses BigInt to prevent 64-bit integer overflow during multi-million rupee calculations.
 * Includes commercial half-up rounding (+50n).
 */
export function lineAmount(quantity, unitRate) {
  const qty = BigInt(quantity || 0);
  const rate = BigInt(unitRate || 0);
  
  // (qty * rate + 50) / 100 ensures correct half-up rounding in integer arithmetic
  return Number((qty * rate + 50n) / 100n);
}

/**
 * Converts user text input (e.g. "1,250.75") into integer paisa (125075)
 * without using parseFloat, avoiding decimal precision loss.
 */
export function parseDecimal(inputText) {
  if (inputText === null || inputText === undefined) return null;
  
  // Clean whitespace and thousand-separator commas
  const cleanString = String(inputText).replace(/,/g, '').trim();
  if (!/^(\d+\.?\d*|\.\d+)$/.test(cleanString)) {
    return null; // Invalid number format
  }

  const [integerPart, decimalPart = ''] = cleanString.split('.');
  
  // Pad decimal part to 3 digits for accurate rounding to 2 decimal places
  const paddedDecimals = decimalPart.padEnd(3, '0');
  const wholeUnits = Number(integerPart || 0) * 100;
  const cents = Number(paddedDecimals.slice(0, 2));
  const shouldRoundUp = paddedDecimals[2] >= '5' ? 1 : 0;

  const totalPaisa = wholeUnits + cents + shouldRoundUp;
  return totalPaisa > MAX_INPUT ? null : totalPaisa;
}

// ============================================================================
// Display Formatters
// ============================================================================

/** Formats integer paisa as rounded whole Rupees with commas: 5915163 -> "59,152" */
export function formatRupees(paisa) {
  if (paisa === null || paisa === undefined || isNaN(paisa)) return '0';
  return Math.round(paisa / 100).toLocaleString('en-US');
}

/** Formats integer paisa with exact 2 decimal places: 33419 -> "334.19" */
export function formatRate(paisa) {
  if (paisa === null || paisa === undefined || isNaN(paisa)) return '0.00';
  return (paisa / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/** Formats quantity units, hiding trailing zero decimals when whole: 15000 -> "150" */
export function formatQuantity(qtyHundredths) {
  if (qtyHundredths === null || qtyHundredths === undefined || isNaN(qtyHundredths)) return '0';
  return (qtyHundredths / 100).toLocaleString('en-US', {
    maximumFractionDigits: 2
  });
}

/** Compact currency representation for top KPI summary cards: 14250000000 -> "Rs 142.5M" */
export function formatCompactCurrency(paisa) {
  if (paisa === null || paisa === undefined || isNaN(paisa)) return 'Rs 0';
  return 'Rs ' + (paisa / 100).toLocaleString('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  });
}

/** Percentage difference helper: calculates variance between two numbers: "+5.2%" */
export function formatPercentDiff(value, baseValue) {
  if (!baseValue) return '0.0%';
  const differenceRatio = (value / baseValue - 1) * 100;
  const prefix = differenceRatio >= 0 ? '+' : '';
  return prefix + differenceRatio.toFixed(1) + '%';
}

// Aliases matching previous calls across the codebase
export const n0 = formatRupees;
export const n2 = formatRate;
export const nq = formatQuantity;
export const compact = formatCompactCurrency;
export const pct = formatPercentDiff;

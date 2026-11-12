import React from 'react';
import { VENDORS } from '../utils/constants.js';
import { formatRupees, formatCompactCurrency, formatPercentDiff } from '../utils/money.js';

/**
 * KPI Summary Strip
 * -----------------
 * Renders 6 flat enterprise metric cards calculating:
 * Budget Total, Vendor Quote Totals, Best of Quotes, and Potential Savings.
 */
export function Summary({ totals }) {
  const budgetAmount = totals.amount ?? totals.a ?? 0;
  const bestQuotesAmount = totals.bestAmount ?? totals.ba ?? 0;
  const vendorAmounts = totals.vendorAmounts ?? totals.va ?? [0, 0, 0];
  
  // Find the lowest vendor quote total among the 3 vendors
  const lowestVendorTotal = Math.min(...vendorAmounts);
  const totalSavings = budgetAmount - bestQuotesAmount;

  function renderCard(cardKey, label, amountValue, isHighlighted, subtitle) {
    return (
      <div
        key={cardKey}
        className={'kpi' + (isHighlighted ? ' g' : '')}
        title={`Rs ${formatRupees(amountValue)}`}
      >
        <small>{label}</small>
        <b>{formatCompactCurrency(amountValue)}</b>
        {subtitle ? <em>{subtitle}</em> : null}
      </div>
    );
  }

  const isUnderBudget = totalSavings >= 0;
  const savingsPercent = budgetAmount ? (Math.abs(totalSavings) / budgetAmount * 100).toFixed(1) : '0.0';

  return (
    <section className="sum" aria-label="Cost sheet KPI summary">
      {/* 1. Overall Budget Total */}
      {renderCard('budget', 'Budget total', budgetAmount)}

      {/* 2, 3, 4. Vendor A, B, C Totals */}
      {VENDORS.map((vendorName, vendorIndex) => {
        const vendorTotal = vendorAmounts[vendorIndex];
        const isCheapestVendor = vendorTotal === lowestVendorTotal;
        const note = isCheapestVendor 
          ? 'Lowest single quote' 
          : `${formatPercentDiff(vendorTotal, budgetAmount)} vs budget`;

        return renderCard(`vendor-${vendorIndex}`, vendorName, vendorTotal, isCheapestVendor, note);
      })}

      {/* 5. Best of Quotes (combining lowest quote per row) */}
      {renderCard('best-quotes', 'Best of quotes', bestQuotesAmount, true, 'Cheapest rate per line')}

      {/* 6. Potential Savings vs Over Budget */}
      {renderCard(
        'savings',
        isUnderBudget ? 'Potential saving' : 'Over budget',
        Math.abs(totalSavings),
        isUnderBudget,
        `${savingsPercent}% of budget`
      )}
    </section>
  );
}

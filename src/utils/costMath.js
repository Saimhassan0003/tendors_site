import { lineAmount } from './money.js';

/**
 * Constructs a fully calculated leaf line item (Material or Labor).
 * Computes the total budget amount, all vendor quote totals, identifies
 * the lowest bidder, and calculates the cost variance vs budget.
 */
export function makeLine(sourceLine) {
  const quantity = sourceLine.quantity ?? sourceLine.q ?? 0;
  const budgetRate = sourceLine.rate ?? sourceLine.r ?? 0;
  const vendorRates = sourceLine.vendorRates ?? sourceLine.v ?? [0, 0, 0];

  // Calculate total amount for each vendor (quantity * vendor rate)
  const vendorAmounts = vendorRates.map((rate) => lineAmount(quantity, rate));

  // Determine the index of the cheapest vendor (0 = Vendor A, 1 = Vendor B, 2 = Vendor C)
  let bestVendorIndex = 0;
  for (let i = 1; i < vendorAmounts.length; i++) {
    if (vendorAmounts[i] < vendorAmounts[bestVendorIndex]) {
      bestVendorIndex = i;
    }
  }

  const budgetAmount = lineAmount(quantity, budgetRate);
  const bestAmount = vendorAmounts[bestVendorIndex];
  
  // Cost difference: negative = savings (under budget), positive = over budget
  const difference = bestAmount - budgetAmount;

  return {
    ...sourceLine,
    // Descriptive names
    quantity,
    rate: budgetRate,
    amount: budgetAmount,
    vendorRates,
    vendorAmounts,
    bestVendorIndex,
    bestAmount,
    difference,
    // Short aliases for table rendering
    q: quantity,
    r: budgetRate,
    a: budgetAmount,
    v: vendorRates,
    va: vendorAmounts,
    bi: bestVendorIndex,
    ba: bestAmount,
    d: difference
  };
}

/**
 * Aggregates child rows (lines into sub-items, or sub-items into categories).
 * Accurately sums quantities, amounts, vendor quotes, and finds the best cumulative quote.
 */
export function rollup(parentNode, childNodes) {
  let totalBudgetAmount = 0;
  let totalBestAmount = 0;
  let cumulativeRate = 0;
  const totalVendorAmounts = [0, 0, 0];
  const cumulativeVendorRates = [0, 0, 0];

  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    const childAmount = child.amount ?? child.a ?? 0;
    const childBest = child.bestAmount ?? child.ba ?? 0;
    const childRates = child.vendorRates ?? child.v;
    const childAmounts = child.vendorAmounts ?? child.va;

    totalBudgetAmount += childAmount;
    totalBestAmount += childBest;

    if (childAmounts) {
      totalVendorAmounts[0] += childAmounts[0];
      totalVendorAmounts[1] += childAmounts[1];
      totalVendorAmounts[2] += childAmounts[2];
    }

    if (child.rate !== undefined || child.r !== undefined) {
      cumulativeRate += (child.rate ?? child.r);
    }

    if (childRates) {
      cumulativeVendorRates[0] += childRates[0];
      cumulativeVendorRates[1] += childRates[1];
      cumulativeVendorRates[2] += childRates[2];
    }
  }

  // Find the vendor that is cheapest overall for this roll-up
  let bestVendorIndex = 0;
  for (let i = 1; i < totalVendorAmounts.length; i++) {
    if (totalVendorAmounts[i] < totalVendorAmounts[bestVendorIndex]) {
      bestVendorIndex = i;
    }
  }

  const difference = totalBestAmount - totalBudgetAmount;
  const quantity = childNodes[0] 
    ? (childNodes[0].quantity ?? childNodes[0].q) 
    : (parentNode.quantity ?? parentNode.q ?? 0);

  const rollUpResult = {
    ...parentNode,
    // Descriptive fields
    amount: totalBudgetAmount,
    bestAmount: totalBestAmount,
    vendorAmounts: totalVendorAmounts,
    rate: cumulativeRate,
    vendorRates: cumulativeVendorRates,
    quantity,
    bestVendorIndex,
    difference,
    // Aliases
    a: totalBudgetAmount,
    ba: totalBestAmount,
    va: totalVendorAmounts,
    r: cumulativeRate,
    v: cumulativeVendorRates,
    q: quantity,
    bi: bestVendorIndex,
    d: difference
  };

  if (parentNode.lines) rollUpResult.lines = childNodes;
  if (parentNode.items) rollUpResult.items = childNodes;

  return rollUpResult;
}

/**
 * Extracts a specific numerical field value (quantity, rate, or vendor quote) from a node.
 */
export function getField(node, fieldKey) {
  if (!node) return 0;
  if (fieldKey === 'q' || fieldKey === 'quantity') return node.quantity ?? node.q ?? 0;
  if (fieldKey === 'r' || fieldKey === 'rate') return node.rate ?? node.r ?? 0;
  
  if (fieldKey.startsWith('v')) {
    const vendorIndex = Number(fieldKey[1]);
    const rates = node.vendorRates ?? node.v;
    const amounts = node.vendorAmounts ?? node.va;
    return rates ? rates[vendorIndex] || 0 : (amounts ? amounts[vendorIndex] || 0 : 0);
  }
  
  return 0;
}

/**
 * Returns a cloned line item with one specific field updated and recalculated.
 */
export function withField(lineItem, fieldKey, newValue) {
  if (fieldKey === 'q' || fieldKey === 'quantity') {
    return makeLine({ ...lineItem, q: newValue, quantity: newValue });
  }
  if (fieldKey === 'r' || fieldKey === 'rate') {
    return makeLine({ ...lineItem, r: newValue, rate: newValue });
  }
  
  // Updating a vendor quote rate (v0, v1, or v2)
  const updatedVendorRates = (lineItem.vendorRates ?? lineItem.v).slice();
  const vendorIndex = Number(fieldKey[1]);
  updatedVendorRates[vendorIndex] = newValue;
  
  return makeLine({ ...lineItem, v: updatedVendorRates, vendorRates: updatedVendorRates });
}

/**
 * Immutably updates the tree hierarchy when a user edits a cell.
 * Preserves exact object references for all untouched categories and items,
 * allowing React.memo to skip re-rendering the rest of the 5,000 items.
 */
export function updateTree(categories, location, fieldKey, newValue) {
  const [categoryIndex, itemIndex, lineIndex] = location;

  return categories.map((category, currentCatIdx) => {
    // Skip categories that were not edited (retains same memory reference)
    if (currentCatIdx !== categoryIndex) return category;

    const updatedItems = category.items.map((item, currentItemIdx) => {
      // Skip items that were not edited
      if (currentItemIdx !== itemIndex) return item;

      // Case A: Editing at the sub-item level directly [catIdx, itemIdx]
      if (location.length === 2) {
        if (fieldKey === 'q' || fieldKey === 'quantity') {
          const updatedLines = item.lines.map((line) => withField(line, 'q', newValue));
          return rollup({ ...item, q: newValue, quantity: newValue }, updatedLines);
        }
        
        if (fieldKey === 'r' || fieldKey === 'rate') {
          const oldTotalRate = item.lines.reduce((sum, l) => sum + (l.rate ?? l.r), 0) || 1;
          const ratio = newValue / oldTotalRate;
          const updatedLines = item.lines.map((line) => {
            const currentLineRate = line.rate ?? line.r;
            return withField(line, 'r', Math.round(currentLineRate * ratio));
          });
          return rollup({ ...item, r: newValue, rate: newValue }, updatedLines);
        }
        
        if (fieldKey.startsWith('v')) {
          const vendorIdx = Number(fieldKey[1]);
          const oldTotalVendorRate = item.lines.reduce((sum, l) => {
            const rates = l.vendorRates ?? l.v;
            return sum + rates[vendorIdx];
          }, 0) || 1;
          
          const ratio = newValue / oldTotalVendorRate;
          const updatedLines = item.lines.map((line) => {
            const rates = line.vendorRates ?? line.v;
            const updatedRate = Math.round(rates[vendorIdx] * ratio);
            return withField(line, fieldKey, updatedRate);
          });
          return rollup(item, updatedLines);
        }
      }

      // Case B: Editing a leaf line item [catIdx, itemIdx, lineIdx] (Material or Labor)
      const updatedLines = item.lines.map((line, currentLineIdx) => {
        return currentLineIdx === lineIndex 
          ? withField(line, fieldKey, newValue) 
          : line;
      });

      return rollup(item, updatedLines);
    });

    return rollup(category, updatedItems);
  });
}

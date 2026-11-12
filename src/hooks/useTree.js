import { useState, useMemo, useCallback } from 'react';
import { PAGE_SIZE } from '../utils/constants.js';
import { NT } from '../data/generateData.js';

/**
 * Flattens the hierarchical tree (Category > Sub-item > Material/Labor)
 * into a single flat array of visible rows for virtual scrolling.
 */
function flattenHierarchyTree(categories, expandedRowIds, loadedLimit) {
  const visibleRowList = [];

  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const category = categories[catIdx];
    
    // Stop if category starts beyond the current infinite-scroll loaded threshold
    if (category.start >= loadedLimit) break;

    // Push the Category row
    visibleRowList.push({
      key: category.id,
      k: category.id,
      type: 'category',
      t: 'c',
      data: category,
      o: category
    });

    // If this category is collapsed, skip rendering its child sub-items
    if (!expandedRowIds.has(category.id)) continue;

    for (let itemIdx = 0; itemIdx < category.items.length; itemIdx++) {
      const subItem = category.items[itemIdx];
      
      // Stop if item index exceeds current loaded chunk
      if (subItem.g >= loadedLimit) break;

      // Push the Sub-item row
      visibleRowList.push({
        key: subItem.id,
        k: subItem.id,
        type: 'item',
        t: 'i',
        data: subItem,
        o: subItem
      });

      // If this sub-item is expanded, push its leaf Material and Labor lines
      if (expandedRowIds.has(subItem.id)) {
        for (let lineIdx = 0; lineIdx < subItem.lines.length; lineIdx++) {
          const line = subItem.lines[lineIdx];
          visibleRowList.push({
            key: line.id,
            k: line.id,
            type: 'line',
            t: 'l',
            data: line,
            o: line
          });
        }
      }
    }
  }

  // Bottom sentinel row: signals infinite scroll if more items remain unloaded
  if (loadedLimit < NT) {
    visibleRowList.push({
      key: 'sentinel-more',
      k: 'more',
      type: 'sentinel',
      t: 's',
      data: null,
      o: null
    });
  }

  return visibleRowList;
}

/**
 * Custom Hook: useTree
 * --------------------
 * Manages row expansion/collapsing state (L1, L2, L3) and progressive infinite scroll loading.
 */
export function useTree(categories) {
  // Pre-expand initial rows on first load so the 3-level hierarchy is immediately visible
  const [expandedIds, setExpandedIds] = useState(() => {
    const initialOpenIds = new Set();
    
    // Expand all categories
    categories.forEach((cat) => initialOpenIds.add(cat.id));
    
    // Pre-expand the first 15 sub-items so Material and Labor lines are visible
    if (categories[0] && categories[0].items) {
      categories[0].items.slice(0, 15).forEach((item) => initialOpenIds.add(item.id));
    }
    
    return initialOpenIds;
  });

  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);

  // Recalculate flattened row list when categories, expansion state, or loaded count changes
  const rows = useMemo(() => {
    return flattenHierarchyTree(categories, expandedIds, loadedCount);
  }, [categories, expandedIds, loadedCount]);

  /** Toggles a single row's expanded/collapsed state */
  const toggleRow = useCallback((rowId) => {
    setExpandedIds((currentOpenSet) => {
      const nextOpenSet = new Set(currentOpenSet);
      if (nextOpenSet.has(rowId)) {
        nextOpenSet.delete(rowId);
      } else {
        nextOpenSet.add(rowId);
      }
      return nextOpenSet;
    });
  }, []);

  /**
   * Sets hierarchy expansion level:
   * Level 1: Categories only (collapse everything)
   * Level 2: Categories + Sub-items
   * Level 3: Everything (Categories + Sub-items + Material/Labor lines)
   */
  const setExpandLevel = useCallback((level) => {
    const targetIds = [];
    
    if (level >= 2) {
      categories.forEach((category) => {
        targetIds.push(category.id);
        
        if (level >= 3) {
          category.items.forEach((item) => targetIds.push(item.id));
        }
      });
    }

    setExpandedIds(new Set(targetIds));
  }, [categories]);

  /** Expands necessary parents when undo/redo targets a hidden cell */
  const expandToLocation = useCallback((location) => {
    const category = categories[location[0]];
    const globalItemIndex = (category ? category.start : 0) + location[1];
    
    // Ensure the item is within the loaded scroll limit
    setLoadedCount((currentLimit) => {
      const neededLimit = Math.ceil((globalItemIndex + 1) / PAGE_SIZE) * PAGE_SIZE;
      return Math.max(currentLimit, Math.min(NT, neededLimit));
    });

    // Expand the category and the sub-item
    setExpandedIds((currentOpenSet) => {
      const nextOpenSet = new Set(currentOpenSet);
      nextOpenSet.add(`c${location[0]}`);
      nextOpenSet.add(`i${globalItemIndex}`);
      return nextOpenSet;
    });
  }, [categories]);

  /** Progressively loads more items during scroll */
  const loadMoreItems = useCallback((targetCount) => {
    setLoadedCount((currentLoaded) => {
      if (currentLoaded >= NT) return currentLoaded;
      
      const nextBatch = targetCount && targetCount > currentLoaded
        ? Math.min(NT, Math.max(currentLoaded + PAGE_SIZE, Math.ceil(targetCount / 200) * 200))
        : Math.min(NT, currentLoaded + PAGE_SIZE);
        
      return Math.max(currentLoaded, nextBatch);
    });
  }, []);

  return {
    rows,
    open: expandedIds,
    expandedIds,
    loaded: loadedCount,
    loadedCount,
    loading: false,
    toggle: toggleRow,
    toggleRow,
    setLevel: setExpandLevel,
    setExpandLevel,
    expandTo: expandToLocation,
    expandToLocation,
    loadMore: loadMoreItems,
    loadMoreItems
  };
}

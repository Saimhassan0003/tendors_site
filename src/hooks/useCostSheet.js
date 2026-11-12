import { useReducer, useMemo, useCallback } from 'react';
import { UNDO_LIMIT } from '../utils/constants.js';
import { getField, updateTree, rollup } from '../utils/costMath.js';
import { generateData } from '../data/generateData.js';

/**
 * Reducer for managing the live cost sheet state, cell edits, and undo/redo stacks.
 */
function sheetReducer(currentState, action) {
  // Action: Cell edit
  if (action.type === 'edit' || action.type === 'EDIT_CELL') {
    const { location, fieldKey, value } = action;
    const [categoryIndex, itemIndex, lineIndex] = location;

    // Locate the current node to check its existing value
    const category = currentState.categories[categoryIndex];
    const item = category?.items[itemIndex];
    const targetNode = location.length === 3 ? item?.lines[lineIndex] : item;

    const previousValue = getField(targetNode, fieldKey);
    if (previousValue === value) {
      return currentState; // No change, avoid unnecessary state update
    }

    // Apply the update to the tree hierarchy
    const updatedCategories = updateTree(currentState.categories, location, fieldKey, value);

    // Record the edit in undo history (capped at UNDO_LIMIT)
    const newUndoHistory = currentState.undoHistory
      .concat([{ location, fieldKey, previousValue, newValue: value }])
      .slice(-UNDO_LIMIT);

    return {
      categories: updatedCategories,
      cats: updatedCategories, // Alias for backward compatibility
      undoHistory: newUndoHistory,
      undo: newUndoHistory,
      redoHistory: [],
      redo: [],
      lastEditedCell: null,
      last: null
    };
  }

  // Action: Undo or Redo
  const isUndo = action.type === 'undo' || action.type === 'UNDO';
  const historySource = isUndo ? currentState.undoHistory : currentState.redoHistory;

  if (historySource.length === 0) {
    return currentState; // Nothing to undo/redo
  }

  // Pop the last action from the stack
  const lastAction = historySource[historySource.length - 1];
  const remainingHistory = historySource.slice(0, -1);
  const targetValue = isUndo ? lastAction.previousValue : lastAction.newValue;

  const restoredCategories = updateTree(
    currentState.categories,
    lastAction.location,
    lastAction.fieldKey,
    targetValue
  );

  const updatedUndoHistory = isUndo 
    ? remainingHistory 
    : currentState.undoHistory.concat([lastAction]);

  const updatedRedoHistory = isUndo 
    ? currentState.redoHistory.concat([lastAction]) 
    : remainingHistory;

  const lastTarget = { 
    location: lastAction.location, 
    loc: lastAction.location,
    fieldKey: lastAction.fieldKey, 
    k: lastAction.fieldKey 
  };

  return {
    categories: restoredCategories,
    cats: restoredCategories,
    undoHistory: updatedUndoHistory,
    undo: updatedUndoHistory,
    redoHistory: updatedRedoHistory,
    redo: updatedRedoHistory,
    lastEditedCell: lastTarget,
    last: lastTarget
  };
}

/**
 * Custom Hook: useCostSheet
 * -------------------------
 * Exposes the live categories tree, computed grand totals, and undo/redo operations.
 */
export function useCostSheet() {
  const [state, dispatch] = useReducer(sheetReducer, null, () => {
    const initialCategories = generateData();
    return {
      categories: initialCategories,
      cats: initialCategories,
      undoHistory: [],
      undo: [],
      redoHistory: [],
      redo: [],
      lastEditedCell: null,
      last: null
    };
  });

  // Calculate project-wide grand totals (only recomputed when categories change)
  const projectTotals = useMemo(() => {
    return rollup({}, state.categories);
  }, [state.categories]);

  const editCell = useCallback((location, fieldKey, value) => {
    dispatch({ 
      type: 'EDIT_CELL', 
      location, 
      loc: location, 
      fieldKey, 
      k: fieldKey, 
      value, 
      val: value 
    });
  }, []);

  const undoLastAction = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redoLastAction = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  return {
    categories: state.categories,
    cats: state.categories,
    totals: projectTotals,
    lastEditedCell: state.lastEditedCell,
    last: state.lastEditedCell,
    canUndo: state.undoHistory.length > 0,
    canRedo: state.redoHistory.length > 0,
    edit: editCell,
    undo: undoLastAction,
    redo: redoLastAction
  };
}

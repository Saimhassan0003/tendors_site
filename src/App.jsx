import React, { useState } from 'react';
import { useCostSheet } from './hooks/useCostSheet';
import { useTree } from './hooks/useTree';
import { Toolbar } from './components/Toolbar';
import { Summary } from './components/Summary';
import { Grid } from './components/Grid';

export default function App() {
  const sheet = useCostSheet();
  const tree = useTree(sheet.cats);
  const [level, setLevel] = useState(null);

  const focusGrid = () => {
    const el = document.getElementById('sc');
    if (el) el.focus();
  };

  return (
    <>
      <Toolbar
        sheet={sheet}
        level={level}
        onUndo={() => {
          sheet.undo();
          focusGrid();
        }}
        onRedo={() => {
          sheet.redo();
          focusGrid();
        }}
        onLevel={(n) => {
          setLevel(n);
          tree.setLevel(n);
          const el = document.getElementById('sc');
          if (el) el.scrollTop = 0;
        }}
        onTheme={() => {
          const r = document.documentElement;
          const c =
            r.dataset.theme ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          r.dataset.theme = c === 'dark' ? 'light' : 'dark';
        }}
      />
      <Summary totals={sheet.totals} />
      <Grid sheet={sheet} tree={tree} />
    </>
  );
}

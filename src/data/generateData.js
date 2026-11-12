import { makeLine, rollup } from '../utils/costMath.js';

/**
 * Predictable pseudo-random generator with a fixed seed.
 * Ensures the generated 5,000 BOQ items remain consistent across reloads.
 */
function createRandomGenerator(seed = 2026) {
  let currentSeed = seed;
  return function nextRandom() {
    // Linear Congruential Generator (LCG) algorithm
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
  };
}

// 20 realistic construction and engineering trades
const CONSTRUCTION_TRADES = [
  { name: 'Earthwork & Excavation', subs: ['Bulk site excavation', 'Trenching for footings', 'Backfilling granular soil', 'Soil compaction 95% MDD'], unit: 'm³', minRate: 350, maxRate: 850 },
  { name: 'Plain Concrete (PCC)', subs: ['PCC 1:4:8 lean mix', 'Blinding under footings', 'Mass leveling concrete'], unit: 'm³', minRate: 9500, maxRate: 13500 },
  { name: 'Reinforced Concrete (RCC)', subs: ['RCC columns 4000 PSI', 'RCC raft slab 4000 PSI', 'RCC suspended beams', 'RCC retaining wall'], unit: 'm³', minRate: 16500, maxRate: 24000 },
  { name: 'Steel Reinforcement', subs: ['Deformed rebar Grade 60', 'Binding wire annealed', 'Welded wire mesh fabric'], unit: 'kg', minRate: 260, maxRate: 330 },
  { name: 'Formwork & Shuttering', subs: ['Steel shuttering for columns', 'Plywood slab formwork', 'Scaffolding staging'], unit: 'm²', minRate: 450, maxRate: 850 },
  { name: 'Brick & Block Masonry', subs: ['Solid concrete block wall', 'Clay brick 9 in wall', 'Partition wall 4.5 in'], unit: 'm²', minRate: 1600, maxRate: 2700 },
  { name: 'Plastering & Rendering', subs: ['Cement sand plaster 1:4', 'External rough cast render', 'Gypsum skimming finish'], unit: 'm²', minRate: 380, maxRate: 750 },
  { name: 'Flooring & Tiling', subs: ['Porcelain floor tiles 60x60', 'Granite slab flooring', 'Terrazzo polished finish'], unit: 'm²', minRate: 1900, maxRate: 6200 },
  { name: 'Waterproofing & Insulation', subs: ['SBS bitumen torch membrane', 'Elastomeric cementitious coat', 'Extruded polystyrene insulation'], unit: 'm²', minRate: 650, maxRate: 1950 },
  { name: 'Doors & Windows', subs: ['Solid core flush door', 'Double glazed thermal window', 'Fire-rated steel exit door'], unit: 'no', minRate: 14000, maxRate: 42000 },
  { name: 'Finishing & Painting', subs: ['Weather shield exterior paint', 'Matt emulsion interior paint', 'Synthetic enamel on woodwork'], unit: 'm²', minRate: 190, maxRate: 430 },
  { name: 'Structural Steelwork', subs: ['Portal frame truss', 'Cold-formed Z purlins', 'Base plates & anchor bolts'], unit: 'kg', minRate: 390, maxRate: 530 },
  { name: 'Roofing & Cladding', subs: ['Sandwich corrugated panel', 'Aluminium composite panel', 'GI rainwater gutter'], unit: 'm²', minRate: 1500, maxRate: 3400 },
  { name: 'Plumbing & Drainage', subs: ['PPR cold & hot water pipe', 'uPVC soil & waste pipe', 'Cast iron manhole frame & cover'], unit: 'm', minRate: 450, maxRate: 2600 },
  { name: 'Sanitary Ware Fixtures', subs: ['Wall hung water closet', 'Ceramic wash basin with mixer', 'Thermostatic shower mixer set'], unit: 'no', minRate: 8500, maxRate: 31000 },
  { name: 'Electrical Power Wiring', subs: ['PVC conduit embedded', 'Cu/PVC cable 2.5 mm²', 'XLPE power cable 16 mm²'], unit: 'm', minRate: 110, maxRate: 440 },
  { name: 'Lighting Fixtures', subs: ['LED panel 60x60 40W', 'Downlight recessed 15W', 'Emergency LED exit fixture'], unit: 'no', minRate: 2800, minRate: 11500 },
  { name: 'HVAC Air Conditioning', subs: ['VRF outdoor condenser unit', 'GI rectangular supply duct', 'Ceiling diffuser with damper'], unit: 'no', minRate: 35000, maxRate: 175000 },
  { name: 'Fire Fighting Systems', subs: ['Pendant fire sprinkler head', 'Landing valve with fire hose reel', 'Fire alarm optical detector'], unit: 'no', minRate: 3800, maxRate: 58000 },
  { name: 'Roads & External Works', subs: ['Crushed aggregate sub-base', 'Asphalt concrete wearing course', 'Precast concrete road kerbstone'], unit: 'm²', minRate: 750, maxRate: 2500 }
];

const PRELIMINARY_ITEMS = [
  { name: 'Site mobilization & temporary boundary', unit: 'item', minRate: 180000, maxRate: 350000 },
  { name: 'Consultant & contractor site office setup', unit: 'item', minRate: 220000, maxRate: 480000 },
  { name: 'Temporary power, water & utilities distribution', unit: 'month', minRate: 45000, maxRate: 90000 },
  { name: 'Occupational health, safety & environmental plan', unit: 'month', minRate: 65000, maxRate: 125000 },
  { name: 'Material testing laboratory & quality compliance', unit: 'month', minRate: 85000, maxRate: 165000 },
  { name: 'Project documentation, progress photos & BIM logs', unit: 'month', minRate: 30000, maxRate: 55000 },
  { name: 'Site perimeter CCTV monitoring & security force', unit: 'month', minRate: 75000, maxRate: 145000 },
  { name: 'Final cleaning, de-mobilization & handover works', unit: 'item', minRate: 200000, maxRate: 400000 }
];

const SPECIFICATION_TIERS = ['Type A', 'Type B', 'Grade 40', 'Grade 60', 'Class 1', 'Class 2', 'Heavy duty', 'Standard'];
const MATERIAL_NAMES = ['Cement OPC', 'River sand', 'Steel rebar', 'Crushed aggregate', 'Red bricks', 'Emulsion base', 'PVC fittings', 'Copper cable', 'Tile adhesive', 'Seasoned timber', 'Brass fittings', 'Sealant'];
const LABOR_NAMES = ['Mason crew', 'Skilled labour', 'Helper gang', 'Fitter team', 'Electrician', 'Carpenter', 'Painter crew', 'Machine operator'];

export const MAIN_CATEGORY_COUNT = 5000;
export const PRELIM_COUNT = 50;
export const NT = MAIN_CATEGORY_COUNT + PRELIM_COUNT;

// Helper to format item numbers: 1 -> "0001"
function formatItemNumber(number, digits = 4) {
  return String(number).padStart(digits, '0');
}

/**
 * Generates the complete cost sheet hierarchy:
 * 1. Main Category: 5,000 sub-items, each with Material & Labor lines (10,000 lines).
 * 2. Site Preliminaries Category: 50 sub-items.
 */
export function generateData() {
  const getRandom = createRandomGenerator(2026);

  // 1. Build Main Category (5,000 sub-items)
  const mainSubItems = [];
  for (let itemIdx = 0; itemIdx < MAIN_CATEGORY_COUNT; itemIdx++) {
    const trade = CONSTRUCTION_TRADES[itemIdx % CONSTRUCTION_TRADES.length];
    const subItemName = trade.subs[itemIdx % trade.subs.length];
    const basePrice = trade.minRate + getRandom() * (trade.maxRate - trade.minRate);
    
    // Quantity in integer hundredths
    const quantity = Math.max(1, Math.round((20000 + getRandom() * 280000) / ((trade.minRate + trade.maxRate) / 2))) * 100;

    // Material line (60%) and Labor line (40%)
    const materialRatio = 0.52 + getRandom() * 0.18;
    const laborRatio = 0.22 + getRandom() * 0.14;

    const lines = [
      { type: 'M', nameList: MATERIAL_NAMES, ratio: materialRatio },
      { type: 'L', nameList: LABOR_NAMES, ratio: laborRatio }
    ].map((lineDef, lineIdx) => {
      const budgetRate = Math.round(basePrice * lineDef.ratio * 100);
      const randomName = lineDef.nameList[Math.floor(getRandom() * lineDef.nameList.length)];
      
      // Generate 3 vendor quotes around the budget rate (+/- 15%)
      const vendorQuotes = [0, 1, 2].map(() => {
        return Math.round(budgetRate * (0.86 + getRandom() * 0.28));
      });

      return makeLine({
        id: `l${itemIdx}.${lineIdx}`,
        t: lineDef.type,
        type: lineDef.type === 'M' ? 'material' : 'labor',
        n: randomName,
        name: randomName,
        u: trade.unit,
        unit: trade.unit,
        q: quantity,
        quantity,
        r: budgetRate,
        rate: budgetRate,
        loc: [0, itemIdx, lineIdx],
        location: [0, itemIdx, lineIdx],
        v: vendorQuotes,
        vendorRates: vendorQuotes
      });
    });

    const tier = SPECIFICATION_TIERS[Math.floor(itemIdx / 4) % SPECIFICATION_TIERS.length];
    const zoneNumber = 1 + (itemIdx % 16);
    const fullName = `${subItemName} – ${tier}, Zone ${zoneNumber}`;

    mainSubItems.push(
      rollup(
        {
          id: `i${itemIdx}`,
          g: itemIdx,
          globalIndex: itemIdx,
          code: `01.${formatItemNumber(itemIdx + 1, 4)}`,
          name: fullName,
          u: trade.unit,
          unit: trade.unit,
          q: quantity,
          quantity,
          loc: [0, itemIdx],
          location: [0, itemIdx],
          lines
        },
        lines
      )
    );
  }

  const mainCategory = rollup(
    {
      id: 'c0',
      code: 'C01',
      name: 'Main Category (Civil, Structural & MEP Works)',
      start: 0,
      startIndex: 0,
      loc: [0],
      location: [0],
      items: mainSubItems
    },
    mainSubItems
  );

  // 2. Build Site Preliminaries Category (50 items)
  const prelimSubItems = [];
  for (let itemIdx = 0; itemIdx < PRELIM_COUNT; itemIdx++) {
    const globalIdx = MAIN_CATEGORY_COUNT + itemIdx;
    const itemDef = PRELIMINARY_ITEMS[itemIdx % PRELIMINARY_ITEMS.length];
    const basePrice = itemDef.minRate + getRandom() * (itemDef.maxRate - itemDef.minRate);
    const quantity = (1 + (itemIdx % 12)) * 100;

    const lines = [
      { type: 'M', nameList: ['Site equipment', 'Temporary materials', 'Compliance gear', 'Hardware & consumables'], ratio: 0.55 },
      { type: 'L', nameList: ['Specialist team', 'Supervisor gang', 'Logistics crew', 'Technical staff'], ratio: 0.45 }
    ].map((lineDef, lineIdx) => {
      const budgetRate = Math.round(basePrice * lineDef.ratio * 100);
      const randomName = lineDef.nameList[Math.floor(getRandom() * lineDef.nameList.length)];
      
      const vendorQuotes = [0, 1, 2].map(() => {
        return Math.round(budgetRate * (0.88 + getRandom() * 0.25));
      });

      return makeLine({
        id: `l${globalIdx}.${lineIdx}`,
        t: lineDef.type,
        type: lineDef.type === 'M' ? 'material' : 'labor',
        n: randomName,
        name: randomName,
        u: itemDef.unit,
        unit: itemDef.unit,
        q: quantity,
        quantity,
        r: budgetRate,
        rate: budgetRate,
        loc: [1, itemIdx, lineIdx],
        location: [1, itemIdx, lineIdx],
        v: vendorQuotes,
        vendorRates: vendorQuotes
      });
    });

    const phase = 1 + (itemIdx % 4);
    const fullName = `${itemDef.name} (Phase ${phase})`;

    prelimSubItems.push(
      rollup(
        {
          id: `i${globalIdx}`,
          g: globalIdx,
          globalIndex: globalIdx,
          code: `02.${formatItemNumber(itemIdx + 1, 3)}`,
          name: fullName,
          u: itemDef.unit,
          unit: itemDef.unit,
          q: quantity,
          quantity,
          loc: [1, itemIdx],
          location: [1, itemIdx],
          lines
        },
        lines
      )
    );
  }

  const prelimCategory = rollup(
    {
      id: 'c1',
      code: 'C02',
      name: 'Site Preliminaries & General Requirements',
      start: MAIN_CATEGORY_COUNT,
      startIndex: MAIN_CATEGORY_COUNT,
      loc: [1],
      location: [1],
      items: prelimSubItems
    },
    prelimSubItems
  );

  return [mainCategory, prelimCategory];
}

import { PER } from '../utils/constants.js';
import { makeLine, rollup } from '../utils/costMath.js';

function prng(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPEC =
  'Earthwork|Excavation,Backfilling,Compaction|m³|300|900;' +
  'Plain concrete|PCC 1:4:8,Blinding layer,Lean mix|m³|9000|14000;' +
  'Reinforced concrete|RCC footing,RCC column,RCC slab|m³|16000|24000;' +
  'Reinforcement|Deformed bars,Binding wire,Mesh fabric|kg|240|320;' +
  'Formwork|Shuttering walls,Shuttering slab,Staging|m²|450|900;' +
  'Brick masonry|Brick wall 9 in,Brick wall 4.5 in,Partition wall|m²|1500|2600;' +
  'Plastering|Cement plaster,Gypsum plaster,Rough cast|m²|350|700;' +
  'Flooring|Porcelain tiles,Terrazzo,Marble|m²|1800|6500;' +
  'Waterproofing|Membrane,Bitumen coating,Crystalline coat|m²|600|1800;' +
  'Doors & windows|Timber door,Aluminium window,Steel door|no|12000|45000;' +
  'Painting|Emulsion paint,Weather shield,Enamel paint|m²|180|420;' +
  'Structural steel|Roof truss,Purlins,Base plates|kg|380|520;' +
  'Roofing|Metal sheeting,Roof insulation,Gutters|m²|1400|3200;' +
  'Plumbing|GI pipes,uPVC pipes,Valves|m|400|2800;' +
  'Sanitary ware|WC sets,Wash basins,Shower sets|no|7000|32000;' +
  'Electrical wiring|Conduit,Cable 2.5 mm,Cable 6 mm|m|90|420;' +
  'Lighting|LED panels,Fixtures,Emergency lights|no|2500|12000;' +
  'HVAC|Split units,Ducting,Diffusers|no|38000|160000;' +
  'Fire fighting|Sprinklers,Hose reels,Alarm panels|no|3500|60000;' +
  'Landscaping|Turf,Planting,Irrigation|m²|150|900;' +
  'Road works|Sub-base,Asphalt,Kerbs|m²|700|2400;' +
  'Drainage|Manholes,RCC pipes,Catch pits|m|2500|9500;' +
  'Fencing|Chain link,Boundary wall,Gates|m|1800|7500;' +
  'Glazing|Curtain wall,Toughened glass,Spandrel panel|m²|7500|22000;' +
  'Elevators|Passenger lift,Machine room,Shaft finishing|no|900000|2500000';

const SPECS = ['Type A', 'Type B', 'Grade 40', 'Grade 60', 'Class 1', 'Class 2', 'Heavy duty', 'Standard'];
const MATS = 'Cement OPC,River sand,Steel rebar,Crushed aggregate,Red bricks,Emulsion base,PVC fittings,Copper cable,Tile adhesive,Seasoned timber,Brass fittings,Sealant'.split(',');
const LABS = 'Mason crew,Skilled labour,Helper gang,Fitter team,Electrician,Carpenter,Painter crew,Machine operator'.split(',');

const pad = (n, w) => ('000' + n).slice(-w);

export function generateData() {
  const R = prng(2026);
  return SPEC.split(';').map((s, ci) => {
    const p = s.split('|');
    const subs = p[1].split(',');
    const lo = +p[3];
    const hi = +p[4];
    const items = [];

    for (let ii = 0; ii < PER; ii++) {
      const g = ci * PER + ii;
      const base = lo + R() * (hi - lo);
      const q = Math.max(1, Math.round((20000 + R() * 280000) / ((lo + hi) / 2))) * 100;

      const lines = [
        ['M', MATS, 0.5 + R() * 0.2],
        ['L', LABS, 0.2 + R() * 0.15]
      ].map((z, li) => {
        const rate = Math.round(base * z[2] * 100);
        return makeLine({
          id: 'l' + g + '.' + li,
          t: z[0],
          n: z[1][(R() * z[1].length) | 0],
          u: p[2],
          q: q,
          r: rate,
          loc: [ci, ii, li],
          v: [0, 0, 0].map(() => Math.round(rate * (0.86 + R() * 0.28)))
        });
      });

      items.push(
        rollup(
          {
            id: 'i' + g,
            g: g,
            code: pad(ci + 1, 2) + '.' + pad(ii + 1, 3),
            name: subs[ii % 3] + ' – ' + SPECS[((ii / 3) | 0) % 8] + ', zone ' + (1 + (ii % 9)),
            u: p[2],
            q: q,
            loc: [ci, ii],
            lines: lines
          },
          lines
        )
      );
    }

    return rollup(
      {
        id: 'c' + ci,
        code: 'C' + pad(ci + 1, 2),
        name: p[0],
        start: ci * PER,
        loc: [ci],
        items: items
      },
      items
    );
  });
}

export const NT = SPEC.split(';').length * PER;

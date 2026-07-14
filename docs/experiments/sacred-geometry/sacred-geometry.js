/**
 * sacred-geometry.js — LEGACY / ARCHIVED
 *
 * This is the original pure-2D ES module (uses export statements).
 * It is NOT the active geometry canon for the Sacred Geometry Lab.
 *
 * Active canon: the v3 runtime builders in sacred-geometry-lab.js
 *   (buildVesica, buildSeed, buildFlower, buildMetatron,
 *    buildSriYantra, buildFibonacci, buildTorus)
 * Those return { loops3D, edges3D, paths3D, meta } for the 3D renderer,
 * energy particle system, and test harness.
 *
 * This file is kept as a reference for the future pure-core refactor,
 * when a shared math layer can feed both the 3D runtime and WASM/C++.
 * Do not import this into the lab while the v3 runtime is active.
 */

const TAU = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2; // golden ratio

function pt(x, y) { return { x, y }; }
function polar(r, angle) { return pt(r * Math.cos(angle), r * Math.sin(angle)); }
function add(a, b) { return pt(a.x + b.x, a.y + b.y); }
function rotate(p, angle) {
  return pt(
    p.x * Math.cos(angle) - p.y * Math.sin(angle),
    p.x * Math.sin(angle) + p.y * Math.cos(angle)
  );
}

function circlePoints(n, r, offset = 0) {
  return Array.from({ length: n }, (_, i) => polar(r, (TAU * i) / n + offset));
}

function svgCircle(cx, cy, r) {
  return { type: 'circle', cx, cy, r };
}

function svgLine(x1, y1, x2, y2) {
  return { type: 'line', x1, y1, x2, y2 };
}

function svgArcPath(cx, cy, r, startAngle, endAngle) {
  const start = add(pt(cx, cy), polar(r, startAngle));
  const end = add(pt(cx, cy), polar(r, endAngle));
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// ── Vesica Piscis ─────────────────────────────────────────────────────────────
// Two overlapping circles of radius r, offset by r. The lens between them.
export function vesicaPiscis(r = 1) {
  const offset = r;
  const circles = [
    svgCircle(-offset / 2, 0, r),
    svgCircle(offset / 2, 0, r),
  ];

  // Vesica lens intersection points
  const h = Math.sqrt(r * r - (offset / 2) * (offset / 2));
  const intersections = [pt(0, h), pt(0, -h)];

  const lens = `M 0 ${h} A ${r} ${r} 0 0 1 0 ${-h} A ${r} ${r} 0 0 1 0 ${h} Z`;

  return {
    circles,
    paths: [{ d: lens, role: 'lens' }],
    points: intersections,
    meta: { name: 'Vesica Piscis', r, phi: r / offset },
  };
}

// ── Seed of Life ──────────────────────────────────────────────────────────────
// Centre circle + 6 surrounding circles at radius r, all radius r.
export function seedOfLife(r = 1) {
  const centres = [pt(0, 0), ...circlePoints(6, r, -Math.PI / 2)];
  const circles = centres.map(c => svgCircle(c.x, c.y, r));
  return {
    circles,
    paths: [],
    points: centres,
    meta: { name: 'Seed of Life', r },
  };
}

// ── Flower of Life ────────────────────────────────────────────────────────────
// Three rings of circles on a hex grid. Classic 19-circle form.
export function flowerOfLife(r = 1) {
  const d = r; // hex spacing = radius
  const centres = new Map();

  const add_c = (x, y) => {
    const key = `${Math.round(x * 1e6)},${Math.round(y * 1e6)}`;
    if (!centres.has(key)) centres.set(key, pt(x, y));
  };

  // Ring 0: centre
  add_c(0, 0);

  // Ring 1: 6 circles
  for (let i = 0; i < 6; i++) {
    const p = polar(d, (TAU * i) / 6 - Math.PI / 6);
    add_c(p.x, p.y);
  }

  // Ring 2: 12 circles (hex grid offsets)
  const ring2Offsets = [
    polar(d * 2, -Math.PI / 6),
    polar(d * 2, Math.PI / 6),
    polar(d * 2, Math.PI / 2),
    polar(d * 2, 5 * Math.PI / 6),
    polar(d * 2, 7 * Math.PI / 6),
    polar(d * 2, 3 * Math.PI / 2),
    add(polar(d, -Math.PI / 6), polar(d, Math.PI / 6)),
    add(polar(d, Math.PI / 6), polar(d, Math.PI / 2)),
    add(polar(d, Math.PI / 2), polar(d, 5 * Math.PI / 6)),
    add(polar(d, 5 * Math.PI / 6), polar(d, 7 * Math.PI / 6)),
    add(polar(d, 7 * Math.PI / 6), polar(d, 3 * Math.PI / 2)),
    add(polar(d, 3 * Math.PI / 2), polar(d, -Math.PI / 6)),
  ];
  ring2Offsets.forEach(p => add_c(p.x, p.y));

  const centreList = [...centres.values()];
  const circles = centreList.map(c => svgCircle(c.x, c.y, r));

  return {
    circles,
    paths: [],
    points: centreList,
    meta: { name: 'Flower of Life', r, count: centreList.length },
  };
}

// ── Metatron's Cube ───────────────────────────────────────────────────────────
// Fruit of Life (13 circles) + all connecting lines between centres.
export function metatronsCube(r = 1) {
  const d = r * 2;
  const ring1 = circlePoints(6, d, -Math.PI / 2);
  const ring2 = circlePoints(6, d * 2, -Math.PI / 2 + Math.PI / 6);
  const centres = [pt(0, 0), ...ring1, ...ring2];

  const circles = centres.map(c => svgCircle(c.x, c.y, r));

  // All connecting lines between the 13 fruit-of-life centres
  const lines = [];
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      lines.push(svgLine(centres[i].x, centres[i].y, centres[j].x, centres[j].y));
    }
  }

  return {
    circles,
    lines,
    paths: [],
    points: centres,
    meta: { name: "Metatron's Cube", r, connections: lines.length },
  };
}

// ── Sri Yantra (approximation) ────────────────────────────────────────────────
// 9 interlocking triangles: 4 pointing up (Shiva), 5 pointing down (Shakti).
// Simplified canonical proportions — not pixel-perfect, but geometrically sound.
export function sriYantra(size = 1) {
  const s = size;
  const triangles = [];

  // Upward triangles (Shiva) — 4
  const upHeights = [0.98, 0.72, 0.48, 0.22];
  const upWidths  = [1.00, 0.76, 0.52, 0.26];
  upHeights.forEach((h, i) => {
    const w = upWidths[i] * s;
    const top = -h * s;
    const base = (h * 0.48) * s;
    triangles.push({
      role: 'shiva',
      d: `M 0 ${top} L ${w} ${base} L ${-w} ${base} Z`,
    });
  });

  // Downward triangles (Shakti) — 5
  const downHeights = [0.88, 0.64, 0.40, 0.18, 0.06];
  const downWidths  = [0.90, 0.66, 0.44, 0.22, 0.10];
  downHeights.forEach((h, i) => {
    const w = downWidths[i] * s;
    const bottom = h * s;
    const top = -(h * 0.48) * s;
    triangles.push({
      role: 'shakti',
      d: `M 0 ${bottom} L ${w} ${top} L ${-w} ${top} Z`,
    });
  });

  // Bindu (central point)
  const bindu = svgCircle(0, 0, s * 0.025);

  // Outer square gates (Bhupura) - simplified
  const gate = s * 1.1;
  const outerSquare = `M ${-gate} ${-gate} L ${gate} ${-gate} L ${gate} ${gate} L ${-gate} ${gate} Z`;

  return {
    circles: [bindu],
    paths: [
      ...triangles,
      { d: outerSquare, role: 'bhupura' },
    ],
    points: [pt(0, 0)],
    meta: { name: 'Sri Yantra', size },
  };
}

// ── Fibonacci Spiral ──────────────────────────────────────────────────────────
// Golden spiral as an SVG path. n = number of quarter-turn arc segments.
export function fibonacciSpiral(turns = 8, scale = 0.05) {
  let a = scale, b = scale * PHI;
  let x = 0, y = 0;
  let angle = 0;
  const arcs = [];
  const squares = [];

  for (let i = 0; i < turns; i++) {
    const r = i === 0 ? a : b;
    const startAngle = angle;
    const endAngle = angle + Math.PI / 2;
    const cx = x + r * Math.cos(angle + Math.PI);
    const cy = y + r * Math.sin(angle + Math.PI);

    arcs.push(svgArcPath(cx, cy, r, startAngle, endAngle));

    const next = polar(r, endAngle);
    x = cx + next.x;
    y = cy + next.y;
    angle = endAngle;

    const prev_a = a;
    a = b;
    b = prev_a + b;

    squares.push({ cx, cy, r, angle: startAngle });
  }

  return {
    circles: [],
    paths: arcs.map((d, i) => ({ d, role: i === 0 ? 'root-arc' : 'arc' })),
    points: squares.map(s => pt(s.cx, s.cy)),
    meta: { name: 'Fibonacci Spiral', turns, phi: PHI },
  };
}

// ── Torus Projection ──────────────────────────────────────────────────────────
// 2D orthographic projection of torus rings. Basis for the 3D transition.
export function torusProjection(R = 0.7, r = 0.3, rings = 12, segments = 32) {
  const paths = [];

  // Major rings (longitude lines)
  for (let i = 0; i < rings; i++) {
    const phi = (TAU * i) / rings;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const points = [];
    for (let j = 0; j <= segments; j++) {
      const theta = (TAU * j) / segments;
      const px = (R + r * Math.cos(theta)) * cosPhi;
      const py = (R + r * Math.cos(theta)) * sinPhi;
      const pz = r * Math.sin(theta);
      // simple perspective
      const depth = 2.5 + pz;
      const sx = px / depth;
      const sy = py / depth;
      points.push(`${j === 0 ? 'M' : 'L'} ${sx} ${sy}`);
    }
    paths.push({ d: points.join(' ') + ' Z', role: 'longitude', depth: cosPhi });
  }

  // Minor rings (latitude lines)
  for (let j = 0; j < segments / 4; j++) {
    const theta = (TAU * j) / (segments / 4);
    const points = [];
    for (let i = 0; i <= rings; i++) {
      const phi = (TAU * i) / rings;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const px = (R + r * Math.cos(theta)) * cosPhi;
      const py = (R + r * Math.cos(theta)) * sinPhi;
      const pz = r * Math.sin(theta);
      const depth = 2.5 + pz;
      const sx = px / depth;
      const sy = py / depth;
      points.push(`${i === 0 ? 'M' : 'L'} ${sx} ${sy}`);
    }
    paths.push({ d: points.join(' ') + ' Z', role: 'latitude', depth: Math.cos(theta) });
  }

  return {
    circles: [],
    paths,
    points: [],
    meta: { name: 'Torus', R, r, rings, segments },
  };
}

// ── Geometry registry ─────────────────────────────────────────────────────────
export const GEOMETRIES = {
  vesica:    { label: 'Vesica Piscis',   fn: () => vesicaPiscis(1) },
  seed:      { label: 'Seed of Life',    fn: () => seedOfLife(1) },
  flower:    { label: 'Flower of Life',  fn: () => flowerOfLife(1) },
  metatron:  { label: "Metatron's Cube", fn: () => metatronsCube(0.5) },
  sri:       { label: 'Sri Yantra',      fn: () => sriYantra(1) },
  fibonacci: { label: 'Fibonacci Spiral',fn: () => fibonacciSpiral(8, 0.06) },
  torus:     { label: 'Torus',           fn: () => torusProjection() },
};

export function generate(key) {
  const entry = GEOMETRIES[key];
  if (!entry) throw new Error(`Unknown geometry: ${key}`);
  return entry.fn();
}

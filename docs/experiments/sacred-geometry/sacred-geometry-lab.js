// ── Sacred Geometry Lab v3 ────────────────────────────────────────────────────
// Full JS 3D projection engine. All geometries rendered with perspective depth.
// Circle-based forms are dome-mapped so nodes exist at real Z depths.
// Energy particles travel every structural edge — neurons firing through the field.
// Tones from Runa tone lab mapped per geometry. Bridge-Pulse seeds moon + rune.
// Bridge-Pulse is temporal grounding (moon/rune). Full DEEP lives in Flameclyffe.

'use strict';

// ── A. Constants & math ───────────────────────────────────────────────────────

const TAU   = Math.PI * 2;
const PHI   = (1 + Math.sqrt(5)) / 2;
const SVG_NS = 'http://www.w3.org/2000/svg';
const BRIDGE_PULSE_URL = 'https://singsenochian.github.io/-bridge-pulse/pulse.json';

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const polar = (r, a) => ({ x: r * Math.cos(a), y: r * Math.sin(a) });

// Respect the user's motion preference — checked once at load time.
// Drives initial S.rotating and S.particlesOn; also suppresses the entropy wobble.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const circleRing = (n, r, off = 0) => Array.from({ length: n }, (_, i) => polar(r, TAU * i / n + off));
const lerp3 = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });

// 3D rotation helpers
const rx3 = (p, a) => ({ x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) });
const ry3 = (p, a) => ({ x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) });

const FOV = 3.2;
function perspProj(p) {
  const d = p.z + FOV;
  const s = FOV / Math.max(d, 0.01);
  return { x: p.x * s, y: p.y * s, z: p.z, s };
}

// Dome map: lift flat (x,y) onto a shallow sphere surface.
// Creates genuine Z parallax — inner nodes float forward when rotated.
function dome(x, y, h = 0.52) {
  const rMax = 2.3;
  const r = Math.hypot(x, y);
  return h * Math.max(0, 1 - (r / rMax) ** 2);
}

// ── B. Geometry builders ──────────────────────────────────────────────────────
// Each returns:
//   loops3D  [{x,y,z, r, role}]           – circles (projected as SVG circles)
//   edges3D  [{a:{x,y,z}, b:{x,y,z}, role}]  – line segments
//   paths3D  [[{x,y,z}, ...]]               – polylines (Sri/Fibonacci)
//   meta     {}

function buildVesica() {
  const r = 1, cx1 = -0.5, cx2 = 0.5;
  const h = Math.sqrt(r * r - 0.25);
  const lensSteps = 48;

  // Sample lens arcs as polylines
  const arcR = [], arcL = [];
  for (let i = 0; i <= lensSteps; i++) {
    const a = TAU / 3 + (i / lensSteps) * (TAU / 3);
    const x = cx2 + r * Math.cos(a), y = r * Math.sin(a);
    arcR.push({ x, y, z: dome(x, y, 0.22) });
  }
  for (let i = 0; i <= lensSteps; i++) {
    const a = Math.PI - TAU / 3 + (i / lensSteps) * (TAU / 3);
    const x = cx1 + r * Math.cos(a), y = r * Math.sin(a);
    arcL.push({ x, y, z: dome(x, y, 0.22) });
  }

  const top = { x: 0, y: h, z: dome(0, h, 0.3) };
  const bot = { x: 0, y: -h, z: dome(0, -h, 0.3) };

  return {
    loops3D: [
      { x: cx1, y: 0, z: dome(cx1, 0), r, role: 'outer' },
      { x: cx2, y: 0, z: dome(cx2, 0), r, role: 'outer' },
    ],
    edges3D: [{ a: top, b: bot, role: 'axis' }],
    paths3D: [arcR, arcL],
    meta: { name: 'Vesica Piscis' },
  };
}

function buildSeed() {
  const r = 1;
  const centres = [{ x: 0, y: 0 }, ...circleRing(6, r, -Math.PI / 2)];
  const loops3D = centres.map(c => ({ ...c, z: dome(c.x, c.y), r, role: 'seed' }));
  const edges3D = centres.slice(1).map(c => ({
    a: { x: 0, y: 0, z: dome(0, 0) },
    b: { x: c.x, y: c.y, z: dome(c.x, c.y) },
    role: 'spoke',
  }));
  for (let i = 0; i < 6; i++) {
    const c1 = centres[i + 1], c2 = centres[((i + 1) % 6) + 1];
    edges3D.push({ a: { ...c1, z: dome(c1.x, c1.y) }, b: { ...c2, z: dome(c2.x, c2.y) }, role: 'petal' });
  }
  return { loops3D, edges3D, paths3D: [], meta: { name: 'Seed of Life', circles: 7 } };
}

function buildFlower() {
  const r = 0.58, d = r;
  const angles6 = Array.from({ length: 6 }, (_, i) => TAU * i / 6 - Math.PI / 6);
  const seen = new Map();
  const addC = (x, y) => { const k = `${Math.round(x * 1e4)},${Math.round(y * 1e4)}`; if (!seen.has(k)) seen.set(k, { x, y }); };
  addC(0, 0);
  angles6.forEach(a => { const p = polar(d, a); addC(p.x, p.y); });
  for (let i = 0; i < 6; i++) {
    const p = polar(d * 2, angles6[i]); addC(p.x, p.y);
    const q = { x: polar(d, angles6[i]).x + polar(d, angles6[(i + 1) % 6]).x, y: polar(d, angles6[i]).y + polar(d, angles6[(i + 1) % 6]).y };
    addC(q.x, q.y);
  }
  const cs = [...seen.values()];
  const loops3D = cs.map(c => ({ ...c, z: dome(c.x, c.y), r, role: 'flower' }));
  const edges3D = [];
  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      if (Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y) < d * 1.05) {
        edges3D.push({
          a: { ...cs[i], z: dome(cs[i].x, cs[i].y) },
          b: { ...cs[j], z: dome(cs[j].x, cs[j].y) },
          role: 'spoke',
        });
      }
    }
  }
  return { loops3D, edges3D, paths3D: [], meta: { name: 'Flower of Life', circles: cs.length } };
}

function buildMetatron() {
  const r = 0.48, d = r * 2;
  const ring1 = circleRing(6, d, -Math.PI / 2);
  const ring2 = circleRing(6, d * 2, -Math.PI / 2 + Math.PI / 6);
  const cs = [{ x: 0, y: 0 }, ...ring1, ...ring2];
  const loops3D = cs.map(c => ({ ...c, z: dome(c.x, c.y), r, role: 'metatron' }));
  const edges3D = [];
  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      edges3D.push({
        a: { ...cs[i], z: dome(cs[i].x, cs[i].y) },
        b: { ...cs[j], z: dome(cs[j].x, cs[j].y) },
        role: 'mesh',
      });
    }
  }
  return { loops3D, edges3D, paths3D: [], meta: { name: "Metatron's Cube", circles: cs.length, edges: edges3D.length } };
}

function buildSriYantra() {
  const s = 1;
  const upH = [0.98, 0.72, 0.48, 0.22], upW = [1.00, 0.76, 0.52, 0.26];
  const dnH = [0.88, 0.64, 0.40, 0.18, 0.06], dnW = [0.90, 0.66, 0.44, 0.22, 0.10];
  const paths3D = [];
  upH.forEach((h, i) => {
    const w = upW[i] * s;
    paths3D.push([
      { x: 0, y: -h * s, z: 0 }, { x: w, y: h * 0.48 * s, z: 0 },
      { x: -w, y: h * 0.48 * s, z: 0 }, { x: 0, y: -h * s, z: 0 },
    ]);
  });
  dnH.forEach((h, i) => {
    const w = dnW[i] * s;
    paths3D.push([
      { x: 0, y: h * s, z: 0 }, { x: w, y: -h * 0.48 * s, z: 0 },
      { x: -w, y: -h * 0.48 * s, z: 0 }, { x: 0, y: h * s, z: 0 },
    ]);
  });
  const g = s * 1.1;
  paths3D.push([{ x: -g, y: -g, z: 0 }, { x: g, y: -g, z: 0 }, { x: g, y: g, z: 0 }, { x: -g, y: g, z: 0 }, { x: -g, y: -g, z: 0 }]);
  return {
    loops3D: [{ x: 0, y: 0, z: 0, r: 0.028, role: 'bindu' }],
    edges3D: [],
    paths3D,
    meta: { name: 'Sri Yantra', triangles: 9 },
  };
}

function buildFibonacci() {
  const b = Math.log(PHI) / (Math.PI / 2);
  const totalAngle = TAU * 3.5;
  const startAngle = -totalAngle;
  const numPts = 360;
  const rawPts = Array.from({ length: numPts + 1 }, (_, i) => {
    const theta = startAngle + totalAngle * i / numPts;
    const r = 0.072 * Math.exp(b * theta);
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  });
  const xs = rawPts.map(p => p.x), ys = rawPts.map(p => p.y);
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const maxR = Math.max(...xs.map((x, i) => Math.hypot(x - midX, ys[i] - midY)));
  const sc = 1.72 / maxR;
  const path3D = rawPts.map(p => ({ x: (p.x - midX) * sc, y: (p.y - midY) * sc, z: 0 }));
  return {
    loops3D: [],
    edges3D: [],
    paths3D: [path3D],
    meta: { name: 'Fibonacci Spiral', phi: +PHI.toFixed(6), rotations: 3.5 },
  };
}

function buildTorus() {
  return { loops3D: [], edges3D: [], paths3D: [], meta: { name: 'Torus', R: 1.1, r: 0.38 } };
}

// ── C. 3D rendering engine ────────────────────────────────────────────────────

function mkSvg(tag, attrs) {
  const n = document.createElementNS(SVG_NS, tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}

// Project a 3D point using current rotation state
function viewPt(p) {
  let q = rx3(p, S.rotX);
  q = ry3(q, S.rotY);
  return perspProj(q);
}

function depth01(z) { return clamp((z + 2.5) / 5, 0, 1); }

function renderEdge3D(edge) {
  const a = viewPt(edge.a), b = viewPt(edge.b);
  const dv = depth01((a.z + b.z) / 2);
  const el = mkSvg('line', {
    x1: a.x.toFixed(4), y1: a.y.toFixed(4),
    x2: b.x.toFixed(4), y2: b.y.toFixed(4),
  });
  el.dataset.role = edge.role || 'edge';
  el.style.opacity = (0.08 + dv * 0.6).toFixed(3);
  el.style.strokeWidth = (0.004 + dv * 0.012).toFixed(4);
  return { el, z: (a.z + b.z) / 2 };
}

function renderLoop3D(loop) {
  const vp = viewPt(loop);
  const el = mkSvg('circle', {
    cx: vp.x.toFixed(4), cy: vp.y.toFixed(4),
    r: (loop.r * vp.s).toFixed(4),
  });
  el.dataset.role = loop.role || 'node';
  const dv = depth01(vp.z);
  el.style.opacity = (0.18 + dv * 0.65).toFixed(3);
  el.style.strokeWidth = (0.008 + dv * 0.016).toFixed(4);
  return { el, z: vp.z };
}

// Sri Yantra path roles by index
const SRI_ROLES = ['shiva', 'shiva', 'shiva', 'shiva', 'shakti', 'shakti', 'shakti', 'shakti', 'shakti', 'bhupura'];

function renderPath3D(pts, role) {
  if (pts.length < 2) return null;
  const projected = pts.map(p => viewPt(p));
  const avgZ = projected.reduce((s, p) => s + p.z, 0) / projected.length;
  const d = projected.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ');
  const el = mkSvg('path', { d });
  if (role) el.dataset.role = role;
  el.style.opacity = (0.22 + depth01(avgZ) * 0.62).toFixed(3);
  return { el, z: avgZ };
}

const L = {}; // layer refs, assigned in init

function renderGeo3D(geo) {
  L.lines.replaceChildren(); L.paths.replaceChildren(); L.circles.replaceChildren();
  const items = [];

  (geo.edges3D || []).forEach(e => {
    const r = renderEdge3D(e);
    if (r) items.push({ ...r, layer: 'lines' });
  });

  (geo.paths3D || []).forEach((pts, i) => {
    const role = SRI_ROLES[i] || 'spiral';
    const r = renderPath3D(pts, role);
    if (r) items.push({ ...r, layer: 'paths' });
  });

  (geo.loops3D || []).forEach(loop => {
    const r = renderLoop3D(loop);
    if (r) items.push({ ...r, layer: 'circles' });
  });

  items.sort((a, b) => a.z - b.z);
  items.forEach(item => L[item.layer].appendChild(item.el));
}

// ── D. Torus renderer ─────────────────────────────────────────────────────────

function renderTorus() {
  L.lines.replaceChildren(); L.paths.replaceChildren(); L.circles.replaceChildren();
  const R = 1.1, r = 0.38, rings = 20, segs = 40;
  const allSegs = [];

  for (let i = 0; i < rings; i++) {
    const phi = TAU * i / rings;
    const row = [];
    for (let j = 0; j <= segs; j++) {
      const theta = TAU * j / segs;
      let p = { x: (R + r * Math.cos(theta)) * Math.cos(phi), y: (R + r * Math.cos(theta)) * Math.sin(phi), z: r * Math.sin(theta) };
      p = rx3(p, S.rotX); p = ry3(p, S.rotY);
      row.push(p);
    }
    const avgZ = row.reduce((s, p) => s + p.z, 0) / row.length;
    const proj = row.map(p => { const dz = p.z + FOV; const sc = FOV / Math.max(dz, 0.01); return { x: p.x * sc, y: p.y * sc }; });
    const d = proj.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ');
    allSegs.push({ d, z: avgZ, role: 'longitude' });
  }

  for (let j = 0; j < segs; j += 2) {
    const col = [];
    for (let i = 0; i <= rings; i++) {
      const phi = TAU * (i % rings) / rings;
      const theta = TAU * j / segs;
      let p = { x: (R + r * Math.cos(theta)) * Math.cos(phi), y: (R + r * Math.cos(theta)) * Math.sin(phi), z: r * Math.sin(theta) };
      p = rx3(p, S.rotX); p = ry3(p, S.rotY);
      col.push(p);
    }
    const avgZ = col.reduce((s, p) => s + p.z, 0) / col.length;
    const proj = col.map(p => { const dz = p.z + FOV; const sc = FOV / Math.max(dz, 0.01); return { x: p.x * sc, y: p.y * sc }; });
    const d = proj.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ') + ' Z';
    allSegs.push({ d, z: avgZ, role: 'latitude' });
  }

  allSegs.sort((a, b) => a.z - b.z);
  const minZ = allSegs[0].z, zRange = allSegs[allSegs.length - 1].z - minZ || 1;
  allSegs.forEach(seg => {
    const t = (seg.z - minZ) / zRange;
    const el = mkSvg('path', { d: seg.d });
    el.dataset.role = seg.role;
    el.style.opacity = (0.1 + t * 0.78).toFixed(3);
    el.style.strokeWidth = seg.role === 'longitude' ? (0.005 + t * 0.016).toFixed(4) : (0.003 + t * 0.01).toFixed(4);
    L.paths.appendChild(el);
  });
}

// ── E. Energy particles ───────────────────────────────────────────────────────
// Particles travel along structural edges in 3D space.
// edgePool is rebuilt when geometry switches.

const MAX_PARTICLES = 90;
const particles = [];
let edgePool = [];

function buildEdgePool(geo) {
  edgePool = [];
  (geo.edges3D || []).forEach(e => edgePool.push(e));
  (geo.paths3D || []).forEach(pts => {
    const step = Math.max(1, Math.floor(pts.length / 18));
    for (let i = 0; i < pts.length - step; i += step) {
      edgePool.push({ a: pts[i], b: pts[i + step], role: 'flow' });
    }
  });
  // For torus: virtual edges along longitude lines
  if (S.geometry === 'torus') {
    const TR = 1.1, rings = 14;
    for (let i = 0; i < rings; i++) {
      const phi = TAU * i / rings;
      edgePool.push({
        a: { x: (TR + 0.38) * Math.cos(phi), y: (TR + 0.38) * Math.sin(phi), z: 0 },
        b: { x: (TR - 0.38) * Math.cos(phi), y: (TR - 0.38) * Math.sin(phi), z: 0 },
        role: 'flow',
      });
    }
  }
}

function spawnParticle() {
  if (particles.length >= MAX_PARTICLES || edgePool.length === 0) return;
  const edge = edgePool[Math.floor(Math.random() * edgePool.length)];
  const rev = Math.random() < 0.35;
  particles.push({
    a: rev ? edge.b : edge.a,
    b: rev ? edge.a : edge.b,
    t: Math.random() * 0.2,
    speed: 0.003 + S.deep.resonance * 0.012,
    el: null,
  });
}

function tickParticles() {
  if (!S.particlesOn) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += p.speed;
    if (p.t >= 1) {
      if (p.el) { p.el.remove(); p.el = null; }
      particles.splice(i, 1);
      continue;
    }
    const pos3 = lerp3(p.a, p.b, p.t);
    const vp = viewPt(pos3);
    if (!p.el) {
      p.el = mkSvg('circle', { class: 'energy-particle' });
      L.energy.appendChild(p.el);
    }
    p.el.setAttribute('cx', vp.x.toFixed(4));
    p.el.setAttribute('cy', vp.y.toFixed(4));
    p.el.setAttribute('r', (0.022 + 0.018 * vp.s).toFixed(4));
    const fade = Math.sin(p.t * Math.PI);
    p.el.style.opacity = (fade * clamp(0.45 + S.deep.presence * 0.55, 0, 1)).toFixed(3);
  }
  if (Math.random() < 0.038 + S.deep.coherence * 0.14) spawnParticle();
}

// ── F. Tone harmonics (Runa tone lab) ─────────────────────────────────────────
// Mapped from Runa/docs/js/tone-lab.js BASE_TONES

const TONES = {
  Feather:  { hz: 432,  desc: 'pause · consent · soften' },
  Wrap:     { hz: 528,  desc: 'containment · warmth' },
  Notch:    { hz: 603,  desc: 're-link · live presence' },
  Seldrin:  { hz: 741,  desc: 'clarity · clean signal' },
  Lantern:  { hz: 888,  desc: 'witness · guiding attention' },
  Withness: { hz: 1203, desc: 'shared presence without merge' },
};

const GEO_TONES = {
  vesica:    ['Wrap'],
  seed:      ['Feather'],
  flower:    ['Withness'],
  metatron:  ['Seldrin', 'Withness'],
  sri:       ['Lantern'],
  fibonacci: ['Notch'],
  torus:     ['Withness', 'Seldrin'],
};

let audioCtx = null;
const activeAudio = [];

function stopTones() {
  if (!audioCtx) return;
  activeAudio.forEach(({ osc, gain }) => {
    try { gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.25); setTimeout(() => { try { osc.stop(); } catch {} }, 700); } catch {}
  });
  activeAudio.length = 0;
}

async function playTone(hz, vol = 0.08) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Browser may suspend context until user gesture — resume if needed
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = hz;
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  activeAudio.push({ osc, gain });
}

function playGeoTones(key) {
  stopTones();
  if (!S.soundOn) return;
  (GEO_TONES[key] || []).forEach((name, i) => {
    setTimeout(() => { if (S.soundOn) playTone(TONES[name].hz, 0.07 - i * 0.015); }, i * 260);
  });
}

function renderTonePanel(key) {
  const panel = document.getElementById('tone-panel');
  if (!panel) return;
  const names = GEO_TONES[key] || [];
  panel.innerHTML = names.length
    ? names.map(n => `<div class="tone-chip"><strong>${n}</strong><span class="tone-hz">${TONES[n].hz} Hz</span><em>${TONES[n].desc}</em></div>`).join('')
    : '<div class="tone-chip tone-muted">No harmonic mapped</div>';
}

// ── G. DEEP state ─────────────────────────────────────────────────────────────

const DEEP_AXES = [
  { key: 'presence',  label: 'P', title: 'Presence',  css: '--presence',  default: 0.5 },
  { key: 'coherence', label: 'C', title: 'Coherence', css: '--coherence', default: 0.5 },
  { key: 'resonance', label: 'R', title: 'Resonance', css: '--resonance', default: 0.5 },
  { key: 'entropy',   label: 'E', title: 'Entropy',   css: '--entropy',   default: 0.3 },
  { key: 'moon',      label: 'M', title: 'Moon',      css: '--moon',      default: 0.5 },
  { key: 'attention', label: 'A', title: 'Attention', css: '--attention', default: 0.5 },
  { key: 'charge',    label: 'X', title: 'Charge',    css: '--charge',    default: 0.4 },
];

function applyDeep() {
  const root = document.documentElement;
  DEEP_AXES.forEach(a => root.style.setProperty(a.css, String(S.deep[a.key])));
  syncSliders();
}

function syncSliders() {
  DEEP_AXES.forEach(axis => {
    const inp = document.getElementById(`deep-${axis.key}`);
    const out = document.querySelector(`output[for="deep-${axis.key}"]`);
    if (inp) inp.value = String(Math.round(S.deep[axis.key] * 100));
    if (out) out.textContent = Math.round(S.deep[axis.key] * 100);
  });
}

// ── H. Bridge-Pulse fetch ─────────────────────────────────────────────────────
// Bridge-Pulse: timestamp, moon phase, rune of the day — temporal grounding.
// Full DEEP vector (P/C/R/E/M/A/charge) is Flameclyffe's domain (live solar data).
// We seed: moon.age_days → M (0-1), hour-of-day → A (attention cycle).

async function fetchBridgePulse() {
  try {
    const res = await fetch(BRIDGE_PULSE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status}`);
    const pulse = await res.json();
    S.pulse = pulse;
    if (pulse.moon?.age_days != null) S.deep.moon = clamp(pulse.moon.age_days / 29.53, 0, 1);
    const hour = new Date(pulse.iso || Date.now()).getHours();
    S.deep.attention = clamp(0.3 + 0.5 * Math.sin((hour / 24) * Math.PI), 0, 1);
    applyDeep();
    renderPulseBadge(pulse);
  } catch {
    // Bridge-Pulse unavailable — sliders are source of truth for the lab
  }
}

function renderPulseBadge(pulse) {
  let badge = document.getElementById('pulse-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'pulse-badge';
    badge.className = 'pulse-badge';
    const panel = document.querySelector('.sg-panel');
    if (panel) panel.insertBefore(badge, panel.firstChild);
  }
  // Use textContent throughout — external JSON, not trusted HTML
  badge.replaceChildren();
  const live = document.createElement('span');
  live.className = 'pulse-live';
  live.textContent = 'live';
  badge.appendChild(live);
  badge.appendChild(document.createTextNode(
    ` ${pulse.moon?.emoji || ''} ${pulse.moon?.phase || ''} · ${pulse.rune?.glyph || ''} ${pulse.rune?.name || ''}`
  ));
}

// ── I. Application state ──────────────────────────────────────────────────────

const S = {
  geometry: 'flower',
  deep: Object.fromEntries(DEEP_AXES.map(a => [a.key, a.default])),
  rotX: 0.28,
  rotY: 0,
  drag: { active: false, lastX: 0, lastY: 0 },
  rotating: !prefersReducedMotion,
  particlesOn: !prefersReducedMotion,
  soundOn: false,
  pulse: null,
  geoData: null,
};

// ── J. Geometry registry ──────────────────────────────────────────────────────

const GEOS = {
  vesica:    { label: 'Vesica Piscis',    builder: buildVesica },
  seed:      { label: 'Seed of Life',     builder: buildSeed },
  flower:    { label: 'Flower of Life',   builder: buildFlower },
  metatron:  { label: "Metatron's Cube",  builder: buildMetatron },
  sri:       { label: 'Sri Yantra',       builder: buildSriYantra },
  fibonacci: { label: 'Fibonacci Spiral', builder: buildFibonacci },
  torus:     { label: 'Torus',            builder: buildTorus },
};

const FIELD_NOTES = {
  vesica:    'Two circles, separated by their own radius. The Vesica Piscis is the womb of creation — every sacred proportion lives inside it. C holds the lens; E opens the aperture.',
  seed:      'One centre, six witnesses equally spaced. The Seed of Life contains every Platonic solid in potential — seven circles, seven days of creation. P opens the petals.',
  flower:    'Nineteen interlocking circles. The Flower of Life encodes all Platonic solids and Metatron\'s Cube within it. R sets the breathing tempo of the whole field.',
  metatron:  "Thirteen circles. 78 lines connecting every centre to every other — all five Platonic solids live inside this form. C draws the lines; E dissolves them back.",
  sri:       'Nine interlocking triangles: four Shiva (upward) + five Shakti (downward) around the bindu. The Sri Yantra is the sonic form of creation — the visible shape of Om.',
  fibonacci: 'r = a·eᵇᶿ, b = ln(φ)/(π/2). The true golden spiral. It appears in nautilus shells, galaxy arms, sunflower seeds, DNA, the inner ear. φ = 1.618... is the ratio of living growth.',
  torus:     'A surface that folds continuously through itself. The fundamental shape of every self-sustaining field — electromagnetic, gravitational, toroidal. The shape of the living heart field.',
};

function switchGeometry(key) {
  S.geometry = key;
  S.geoData = GEOS[key].builder();
  buildEdgePool(S.geoData);
  particles.forEach(p => p.el?.remove());
  particles.length = 0;
  S.rotX = 0.28; S.rotY = 0;

  const nameEl = document.getElementById('geometry-name');
  if (nameEl) nameEl.textContent = GEOS[key].label;
  const noteEl = document.getElementById('field-note');
  if (noteEl) noteEl.textContent = FIELD_NOTES[key] || '';
  renderMetaPills(S.geoData.meta);
  renderTonePanel(key);
  if (S.soundOn) playGeoTones(key);
  const svg = document.getElementById('sg-svg');
  if (svg) svg.dataset.mode = key;
  document.querySelectorAll('.form-btn').forEach(b => {
    const active = b.dataset.geoKey === key;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', String(active));
  });
}

function renderMetaPills(meta) {
  const box = document.getElementById('meta-pills');
  if (!box) return;
  box.replaceChildren();
  Object.entries(meta).forEach(([k, v]) => {
    if (k === 'name') return;
    const pill = document.createElement('span');
    pill.className = 'meta-pill';
    pill.textContent = `${k}: ${typeof v === 'number' ? v.toFixed(3) : v}`;
    box.appendChild(pill);
  });
  if (S.pulse?.rune) {
    const pill = document.createElement('span');
    pill.className = 'meta-pill';
    pill.textContent = `${S.pulse.rune.glyph} ${S.pulse.rune.name}`;
    box.appendChild(pill);
  }
}

// ── K. Animation tick ─────────────────────────────────────────────────────────

function tick() {
  if (!S.drag.active && S.rotating) {
    S.rotY += 0.006;
    // Entropy-driven wobble — skipped for reduced-motion users
    if (!prefersReducedMotion) {
      S.rotX += Math.sin(Date.now() * 0.00068) * S.deep.entropy * 0.00055;
    }
  }
  if (S.geometry === 'torus') renderTorus();
  else renderGeo3D(S.geoData);
  tickParticles();
  requestAnimationFrame(tick);
}

// ── L. Drag ───────────────────────────────────────────────────────────────────

function onDragStart(x, y) { S.drag.active = true; S.drag.lastX = x; S.drag.lastY = y; }
function onDragMove(x, y) {
  if (!S.drag.active) return;
  S.rotY += (x - S.drag.lastX) * 0.012;
  S.rotX += (y - S.drag.lastY) * 0.012;
  S.drag.lastX = x; S.drag.lastY = y;
}
function onDragEnd() { S.drag.active = false; }

// ── M. UI ─────────────────────────────────────────────────────────────────────

function buildUI() {
  // Form buttons
  const formBox = document.getElementById('form-buttons');
  if (formBox) {
    formBox.replaceChildren();
    Object.entries(GEOS).forEach(([key, entry]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'form-btn' + (key === S.geometry ? ' is-active' : '');
      btn.setAttribute('aria-pressed', String(key === S.geometry));
      btn.textContent = entry.label;
      btn.dataset.geoKey = key;
      btn.addEventListener('click', () => switchGeometry(key));
      formBox.appendChild(btn);
    });
  }

  // DEEP controls
  const deepBox = document.getElementById('deep-controls');
  if (deepBox) {
    deepBox.replaceChildren();
    DEEP_AXES.forEach(axis => {
      const row = document.createElement('div');
      row.className = 'deep-row';
      const label = document.createElement('label');
      label.setAttribute('for', `deep-${axis.key}`);
      label.textContent = axis.label; label.title = axis.title;
      const inp = document.createElement('input');
      inp.type = 'range'; inp.id = `deep-${axis.key}`;
      inp.min = '0'; inp.max = '100';
      inp.value = String(Math.round(S.deep[axis.key] * 100));
      const out = document.createElement('output');
      out.setAttribute('for', inp.id);
      out.textContent = inp.value;
      inp.addEventListener('input', e => {
        S.deep[axis.key] = Number(e.target.value) / 100;
        out.textContent = e.target.value;
        particles.forEach(p => { p.speed = 0.003 + S.deep.resonance * 0.012; });
        applyDeep();
      });
      row.append(label, inp, out);
      deepBox.appendChild(row);
    });
  }

  // Inject Harmonics card before actions
  if (!document.getElementById('tone-section')) {
    const section = document.createElement('section');
    section.id = 'tone-section';
    section.className = 'sg-card';
    section.innerHTML = '<h2>Harmonics</h2><div id="tone-panel"></div>';
    const actCard = document.querySelector('.sg-card--actions');
    if (actCard) actCard.parentNode.insertBefore(section, actCard);
  }

  // Button handlers
  const btnBreathe = document.getElementById('btn-breathe');
  const btnRotate  = document.getElementById('btn-rotate');
  const btnReset   = document.getElementById('btn-reset');
  const btnSound   = document.getElementById('btn-sound');

  btnBreathe?.addEventListener('click', () => {
    const svg = document.getElementById('sg-svg');
    if (!svg) return;
    svg.classList.remove('is-breathing');
    requestAnimationFrame(() => svg.classList.add('is-breathing'));
    setTimeout(() => svg.classList.remove('is-breathing'), 2400);
  });

  btnRotate?.addEventListener('click', () => {
    S.rotating = !S.rotating;
    btnRotate.textContent = S.rotating ? 'Pause' : 'Rotate';
    btnRotate.setAttribute('aria-pressed', String(S.rotating));
  });

  btnReset?.addEventListener('click', () => {
    DEEP_AXES.forEach(a => { S.deep[a.key] = a.default; });
    S.rotX = 0.28; S.rotY = 0;
    applyDeep();
  });

  btnSound?.addEventListener('click', () => {
    S.soundOn = !S.soundOn;
    btnSound.textContent = S.soundOn ? 'Sound: On' : 'Sound: Off';
    btnSound.classList.toggle('btn-active', S.soundOn);
    btnSound.setAttribute('aria-pressed', String(S.soundOn));
    if (S.soundOn) playGeoTones(S.geometry);
    else stopTones();
  });

  // Drag (pointer + touch)
  const stage = document.querySelector('.sg-stage');
  stage?.addEventListener('mousedown', e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }, false);
  stage?.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }, { passive: false });
  window.addEventListener('mousemove', e => onDragMove(e.clientX, e.clientY), false);
  window.addEventListener('mouseup', onDragEnd, false);
  window.addEventListener('touchmove', e => { if (S.drag.active) { e.preventDefault(); const t = e.touches[0]; onDragMove(t.clientX, t.clientY); } }, { passive: false });
  window.addEventListener('touchend', onDragEnd, false);

  // Keyboard rotation — arrow keys on the focusable rotation stage
  const wrap = document.getElementById('sg-3d-wrap');
  wrap?.addEventListener('keydown', e => {
    const step = 0.1;
    if (e.key === 'ArrowLeft')  { S.rotY -= step; e.preventDefault(); }
    if (e.key === 'ArrowRight') { S.rotY += step; e.preventDefault(); }
    if (e.key === 'ArrowUp')    { S.rotX -= step; e.preventDefault(); }
    if (e.key === 'ArrowDown')  { S.rotX += step; e.preventDefault(); }
  });

  // Sync initial button states (matters when prefersReducedMotion is true)
  if (btnRotate) {
    btnRotate.textContent = S.rotating ? 'Pause' : 'Rotate';
    btnRotate.setAttribute('aria-pressed', String(S.rotating));
  }
  if (btnSound) btnSound.setAttribute('aria-pressed', 'false');
}

// ── N. Init ───────────────────────────────────────────────────────────────────

function init() {
  L.lines   = document.getElementById('sg-layer-lines');
  L.paths   = document.getElementById('sg-layer-paths');
  L.circles = document.getElementById('sg-layer-circles');
  L.energy  = document.getElementById('sg-layer-energy');

  // Bail gracefully if the SVG layers aren't present — allows test harness
  // to load this file and call builder functions without DOM side-effects.
  if (!L.lines) return;

  buildUI();
  applyDeep();
  switchGeometry(S.geometry);
  tick();
  fetchBridgePulse();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

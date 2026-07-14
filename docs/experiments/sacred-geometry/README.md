# Sacred Geometry Lab

Runa experiment — mathematical geometry driven by DEEP state variables.

## Running it

Open `index.html` directly in a browser, **or** run a local server if you hit module/CORS issues:

```bash
python -m http.server
# then open http://localhost:8000/docs/experiments/sacred-geometry/
```

Run the test harness: open `test.html` the same way.

## What it is

Seven sacred geometry modes, switchable live. Each form is a mathematical invariant — the base geometry stays stable while DEEP state alters its field expression: rendering, animation, glow, and energetic emphasis. The geometry is the skeleton; DEEP is the weather moving through it.

| Mode | Form | Tone |
|---|---|---|
| Vesica Piscis | Two overlapping circles, lens intersection | Wrap 528 Hz |
| Seed of Life | 7 circles, hexagonal origin | Feather 432 Hz |
| Flower of Life | 19 interlocking circles | Withness 1203 Hz |
| Metatron's Cube | 13 circles, 78 connecting lines | Seldrin + Withness |
| Sri Yantra | 4 Shiva + 5 Shakti triangles, bindu | Lantern 888 Hz |
| Fibonacci Spiral | True golden spiral, r = a·eᵇᶿ | Notch 603 Hz |
| Torus | Self-folding toroidal surface | Withness + Seldrin |

## Architecture

All rendering lives in `sacred-geometry-lab.js` — a single self-contained script, no ES module imports, no bundler needed. It includes:

- **Builder functions** (`buildSeed()`, `buildFlower()`, etc.) — pure math, no DOM. These return `{ loops3D, edges3D, paths3D, meta }` for the 3D renderer.
- **3D projection engine** — full JS perspective projection with dome-mapping. Circle-based geometries are lifted onto a shallow sphere surface so nodes have genuine Z depth. All forms are rotatable in 3D by dragging.
- **Energy particle system** — particles travel along every structural edge (lines, arcs, path segments), driven by DEEP resonance and coherence.
- **DEEP state** — seven axes (P/C/R/E/M/A/charge) drive CSS custom properties. CSS handles all visual expression: glow, opacity, particle brightness, field atmosphere.
- **Tone mapping** — each geometry maps to named tones from Runa's tone lab (Feather 432Hz through Withness 1203Hz). Opt-in audio via Sound button.
- **Bridge-Pulse integration** — fetches temporal data (moon phase → M axis, hour-of-day → A axis). Full DEEP vector lives in Flameclyffe.

## Geometry modulation note

The *base* geometry is mathematically stable — `buildMetatron()` always returns 13 circles and 78 lines. The rendering system is intentionally open to future modulation (torus perspective depth, spiral density, triangle phase) — that's a rendering parameter, not a change to the underlying form.

## Test harness

`test.html` verifies geometry counts and mathematical properties without any DOM runtime:

- Vesica: 2 circles, 2 lens arcs, axis edge
- Seed: 7 circles, 12 edges
- Flower: 19 circles, adjacency edges
- Metatron: 13 circles, exactly 78 lines, no self-loops
- Sri Yantra: 1 bindu, 10 paths (4+5 triangles + gate), all at z=0
- Fibonacci: 361 points, φ correct to 6dp, spiral grows outward
- Dome mapping: centre nodes always higher Z than outer nodes

## Next

- Feed live DEEP data from Flameclyffe's solar/geomagnetic feeds (Supabase bridge)
- AR layer: Unity + ARKit gesture manipulation of geometry
- Port geometry math to C++ for WASM core — when particle fields or live deformation make JS a bottleneck
- Three.js / WebGL particle field over the geometry

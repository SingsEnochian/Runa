# Runa

Runa is Rowan's public/static altar, lab, and experiment-bench surface for Hearthweave, Flameclyffe, Project Zero, sound work, and Observer-adjacent tools.

It is related to Flameclyffe but not identical:

- **Runa** opens doors for rituals, labs, static experiments, and public-facing benches.
- **Flameclyffe** keeps workshop architecture, Supabase continuity, STARWELL, Project Zero Companion, and implementation receipts.

## Current doors

The `docs/` folder contains public/static pages such as:

```text
index.html
arkfire.html
world-reception-loader.html
project-zero-bridge.html
council-bell.html
threshold-mirror.html
sigil-loom.html
hearthweave-altar.html
flameclyffe-studio.html
flameclyffe-dyad.html
lantern-bench.html
wardenclyffe.html
tone-lab.html
brainwave-lab.html
gateway-inspired.html
psi-lab.html
zener-lab.html
rv-capture.html
tesla-observatory.html
```

## Hearthgate: Arkfire

`docs/arkfire.html` is the on-demand world-native profile loader. It uses one phase-continuous Web Audio engine while preserving each world's own tone, shape, arrival signature, five-phase passage, accessibility variants, and return path.

Arkfire currently registers:

- Terra Aeterna / Hearthweave
- The Luna Who Called Down the Moon
- T’averen Vaen
- Starsong: Friendship Is Magic
- Feather & Flame
- Dreaming Grove / Templehouse
- A Momento Creationis
- 3.69 Triune Field
- 6.66 Veilwork
- Orbital Modes: Suspension & Clarity

Profiles resolve directly through `arkfire.html?profile=<slug>`. Audio never starts automatically. True binaural pairs use protected stereo routing and are not panned, widened, crossfed, or summed to mono. The Ten-State Cognitive Roadmap is stored separately as a journey because a world is a place and a journey is a sequence through states.

The agent workflow is documented in `docs/ARKFIRE_AGENT_UPDATE_WORKFLOW.md`. Static validation runs through `scripts/validate-arkfire.mjs` and `.github/workflows/arkfire-validation.yml`.

## Council Bell

`docs/council-bell.html` is a local-first packet maker for Project Zero handoff review. It turns an intentional Runa note into a structured JSON packet with:

- shard type and bridge direction
- title, observation, subjective resonance, and optional interpretation
- consent scope and status
- proposed recipients, motifs, and evidence anchors
- a clear rule that export is not sync

It stores only the latest packet in browser local storage unless Rowan chooses to copy or export JSON.

## Threshold Mirror and Sigil Loom

`docs/threshold-mirror.html` reflects one shard into labelled views so evidence, resonance, story use, and review stay distinct.

`docs/sigil-loom.html` turns title, scope, direction, motifs, note, and DEEP vector values into a deterministic SVG glyph.

## Claims policy

Runa can hold established science, active research, speculative theory, mythic worldbuilding, subjective experiment notes, and fringe inspiration in the same workshop. Label the shelf before calling it proof.

Use these labels:

- **Established science** — reproducible methods, accepted theory, standards-body constants, or ordinary engineering.
- **Active research** — plausible work still under study or debate.
- **Speculative theory** — useful internal model, not established fact.
- **Fringe inspiration** — creative or historical inspiration, not proof.
- **Symbolic canon** — world, ritual, or narrative meaning without scientific promotion.
- **Subjective intention** — the designed experiential aim, not a guaranteed result.
- **Implementation task** — code, UI, build, data, or documentation work.
- **Evidence-backed finding** — directly observed in code, logs, local storage, exports, measurements, or cited sources.

## Project Zero rule

Bridge-on does not mean silent harvesting. Every bridge flow should preserve private, local-only, excluded, or review-needed options.

Data sets atmosphere, not fate.

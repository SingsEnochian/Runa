# Project Wardenclyffe

Wardenclyffe is the shared sound engine for Runa.

Runa remains the house and user-facing estate. Wardenclyffe is the engine room: one layer model, one motion engine, one persistence system, many lab faces.

## Design statement

Build a unified layer-based sound engine for Runa in which every generator is a reusable voice, every voice may move in space, every arrangement may be saved as a scene, and every experiment may be linked to the field that carried it.

## Proposed structure

```text
wardenclyffe/
  README.md
  tsconfig.json
  src/
    index.ts
    models/
      layer.ts
      scene.ts
      session.ts
    audio/
      generator-factory.ts
      motion-engine.ts
      master-bus.ts
      layer-graph.ts
    storage/
      indexed-db.ts
```

## Core ideas

- **Layer** is the fundamental unit.
- **Scene** is a saved stack of layers plus master settings.
- **SessionRecord** links experiments to the scene or field that carried them.
- **Motion** belongs to the layer, not the generator.
- **Tone Lab**, **Brainwave Lab**, **Gateway**, **Psi**, and **Observatory** should all talk to the same Wardenclyffe models.

## Rebuild order

1. Extract the shared layer and scene models.
2. Build the shared audio graph and motion engine.
3. Add persistence for presets, scenes, and sessions.
4. Rebuild Tone Lab as the first Wardenclyffe front-end.
5. Rebuild Brainwave Lab as a constrained specialisation over the same engine.
6. Convert Gateway into a scene sequencer.
7. Link Psi, Zener, and RV records to saved scene IDs.
8. Teach the Observatory to read the shared archive instead of ad hoc local state.

## Notes

This scaffold is intentionally engine-first. It does not yet integrate with the current docs pages. The purpose is to establish the bones before rewiring the visible labs around them.

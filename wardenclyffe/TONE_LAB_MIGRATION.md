# Tone Lab → Wardenclyffe Migration Plan

This document defines how the current Tone Lab should be folded into the Wardenclyffe engine.

## Current Tone Lab shape

The current page mixes together five different concerns:

1. symbolic tone catalogue
2. audio playback controls
3. motion controls
4. export controls
5. archive / notes UI

Its current runtime state is a single-field blend:

- selected tone ids
- waveform
- gain
- orbit rate
- depth
- reverb
- motion enabled
- export duration

That model is useful for a one-field console, but it is not sufficient for a layered engine.

## Target Wardenclyffe mapping

### Tone catalogue

Keep the existing BASE_TONES catalogue as the canonical symbolic library for the first migration pass.

Map each selected Tone Lab entry into a Wardenclyffe tone layer.

```text
ToneLab.selectedIds[]
  -> Wardenclyffe Scene.layers[]
```

### Per-field controls

Map the old single-field controls into per-layer defaults when importing from Tone Lab.

- waveform -> every generated tone layer.waveform
- gain -> distributed across tone layers
- orbitRate -> tone layer.motionRateHz
- depth -> tone layer.motionDepth
- motionEnabled -> tone layer.motionEnabled
- selected tone frequency -> tone layer.frequencyHz

### Reverb

Tone Lab currently treats reverb as a global field control.

In Wardenclyffe this should move to one of two places:

- short term: remain a scene-level master ambience control
- long term: become a true per-layer send plus scene-level default

### Notes vault

Tone Lab archive notes should not be embedded in the audio engine itself.

They should remain attached to the page or be moved into:

- scene notes
- session notes
- observatory journal

The engine should only know enough to link a scene to notes, not to own the whole vault UI.

## Rebuild sequence

### Phase 1

- Keep current Tone Lab page alive.
- Add a visible Wardenclyffe entry point.
- Prove layered tone and binaural playback in the Wardenclyffe prototype.
- Preserve BASE_TONES and presets as source material.

### Phase 2

- Extract BASE_TONES and PRESETS into shared data files.
- Build a Tone Lab adapter that converts current selected tones into a Wardenclyffe scene.
- Replace one-field playback with scene playback behind the Tone Lab page.

### Phase 3

- Replace the old single blend console with:
  - scene header
  - layer stack
  - layer editor
  - preset browser
  - scene save/load
- Move export into scene export.

### Phase 4

- Remove old bespoke audio logic from docs/js/tone-lab.js.
- Keep only Tone Lab specific UI concerns.
- Delegate synthesis, motion, routing, and persistence to Wardenclyffe modules.

## Immediate next implementation target

The next practical step is not a full rewrite.

It is this:

1. move BASE_TONES into a shared data module
2. let Tone Lab build a Wardenclyffe scene from selected tones
3. let Tone Lab hand that scene to the Wardenclyffe browser engine for playback

Once that works, the real migration has begun.

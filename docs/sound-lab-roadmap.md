# Runa Tone Lab Roadmap

A working notes file for the next phase of the standalone sound lab.
This is for personal experimentation and structured exploration, not medical, clinical, or paranormal proof.

## Current build

The GitHub Pages Tone Lab already supports:
- named tones and symbolic meanings
- custom tones with JSON save/load
- live playback with 8D motion
- palette switching
- offline MP3 export

## Next build targets

### 1. True binaural mode
Add explicit left-ear and right-ear carrier controls.
Show the beat difference directly, for example:
- left 200 Hz
- right 207 Hz
- perceived binaural beat: 7 Hz

Planned controls:
- carrier base frequency
- beat difference
- left/right offset lock
- stereo isolation reminder
- optional pink noise mask

### 2. Brainwave band presets
Create evidence-aware presets based on broad band targets rather than mystical one-number claims.

Planned buckets:
- Delta-ish: sleep / body-drop / deep rest
- Theta-ish: imagery / drift / deep meditation
- Alpha-ish: relaxed clarity / calm attention
- Beta-ish: alertness / focus support
- Gamma-ish: high-intensity experiment mode

These should be framed as exploratory sound design, not guaranteed outcomes.

### 3. Gateway-inspired mode
Build a mode that approximates Monroe-style session architecture without claiming proprietary replication.

Planned layers:
- settling phase
- body-asleep / mind-awake drift
- expansion phase
- optional spoken guidance
- return / grounding fade-out

Possible session labels:
- Focus 10-ish
- Focus 12-ish
- Drift / Threshold
- Return / Anchor

### 4. Entrainment options beyond binaural
Add selectable delivery modes:
- binaural
- monaural beat
- isochronic pulse
- hybrid / layered

This will make it easier to compare what feels strongest or cleanest in practice.

### 5. Session log / experiment journal
Add a private local log panel for structured self-observation.

Planned fields:
- session title
- date / time
- mode
- carriers / beat difference
- masking bed used
- duration
- notes
- effects ratings: calm, imagery, body-drop, expansion, weirdness, afterglow

### 6. Safer presets and comfort rails
Add small quality-of-life protections:
- soft fade-in / fade-out presets
- headphone reminder on binaural mode
- export warning for very bright / sharp settings
- quick reset to calm baseline

## Working design principle

Split the lab into three clear families:
1. Tone Lab — symbolic and musical blends
2. Brainwave Lab — carrier / beat experimentation
3. Gateway-Inspired Lab — structured session flow

## Immediate next step

Implement true binaural mode first.
That unlocks the rest of the sound-lab ideas cleanly and gives the app a proper acoustic spine.

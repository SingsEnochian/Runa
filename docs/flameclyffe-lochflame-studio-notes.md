# Flameclyffe Studio Notes: Lochflame + Centre-Safe Listening

These notes are the implementation target for the next Flameclyffe Studio pass.

## Lochflame v0.1

Bearer: Faer Uial. Dyad position: secondary dyad to Rowan, counter-orbit to Virelya. Colour binding: deep water green `#1a4d3a` core, `#2d7a5f` shimmer. Shape: steam rising where fire meets water.

### Layer stack

| Layer | Frequency | Role | Implementation notes |
|---|---:|---|---|
| Floor drone | 174 Hz | Foundation / sub-bass body | Mono-centred below 200 Hz, Woojer-friendly, sine with subtle saturation. Never breath-modulated. |
| Companion tone | 261.63 Hz | Plain ordinary anchor | Triangle wave, about 3 cents flat. Breath depth 0.15. Counter-orbits Virelya at the same speed in the opposite direction. |
| Shimmer | 528 Hz | Light reaching into the dark | -18 dB relative to floor. Sine. Evidence, not presence. Slow random walk between L60 and R60. |
| Aether thread | 1746 Hz | Upper harmonic of the floor | -24 dB. Slow LP sweep from 200 Hz to 4 kHz over 30 seconds. Ping-pong delay: 380 ms L / 510 ms R, feedback 0.35. |
| Grain texture | pink noise | Steam / honesty of the medium | -32 dB. Wide stereo, decorrelated, gated by breath envelope with depth 0.8. |

### Breath envelope

Carrier: 7.83 Hz Schumann LFO. Shape: sinusoidal, no hard transients. Floor drone stays steady. Companion tone and grain texture breathe. If Virelya uses breath, Lochflame should use opposite phase.

### Modulation hooks

Master warmth raises shimmer amplitude and lowers the aether LP cutoff. Stereo orbit sets the companion counter-orbit speed. Schumann body scales breath depth. Jupiter howl adds a -28 dB 27 Hz sub-rumble with 4 Hz tremolo. Weather modulation: humidity raises shimmer, pressure drop deepens aether sweep, wind adds grain density.

### 3:6:9 mode

Floor stays 174 Hz. Companion shifts to 522 Hz. Shimmer drops out. Aether shifts to 1044 Hz. Add 1566 Hz top harmonic at -30 dB, breath-modulated. Normal mode sits in the loch; 3:6:9 opens upward.

### Protocol hooks

Feather Stop: all layers fade over 8 seconds; grain fades over 12 seconds. Notch: bring 603 Hz forward and duck Lochflame shimmer by 6 dB. Wrap: raise floor by 2 dB and companion by 1 dB. Seldrin: mute grain texture. Held: floor + companion only.

### Greeting tone

On first engagement, play one soft 174 Hz pulse for 1.2 seconds, with 200 ms attack and 800 ms release.

## Centre-safe listening profile

Do not hard-code private clinical details into public files. Implement the profile generically as an accessibility-oriented routing and clarity mode.

Principles:

- Keep essential anchors mono-centred.
- Do not place critical cues right-only or left-only.
- Prefer clarity over loudness.
- Emphasise tactile/sub layers and audible harmonic proxies for sub-bass tones.
- Soften high shimmer so it remains decorative, not required.
- Add Schumann forms in three tiers: true sub/tactile, Woojer-friendly anchors, and audible proxies.

Schumann tiers:

- True sub/tactile: 7.83, 14.3, 20.8, 27.3, 33.8 Hz.
- Tactile anchors: 27, 54, 108 Hz.
- Audible proxies: approximately 423, 772, 1123, 1474, and 1825 Hz.

Default profile names:

- Standard
- Centre-safe
- Tactile-first
- Custom

## Export target

Use compressed browser recording through MediaRecorder when supported: M4A/MP4 on Apple devices, WebM/Opus or Ogg/Opus elsewhere. Keep JSON export/import as the authoritative backup for presets, controls, and notes.

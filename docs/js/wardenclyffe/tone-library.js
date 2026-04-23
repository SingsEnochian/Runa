export const BASE_TONES = [
  { id: 'root', name: 'Root', frequency: 415, meaning: 'Stabilisation / truth of being', category: 'codex' },
  { id: 'anchor', name: 'Anchor', frequency: 440, meaning: 'Grounding / connection', category: 'codex' },
  { id: 'whisper', name: 'Whisper', frequency: 554, meaning: 'Refinement / presence without words', category: 'codex' },
  { id: 'arc', name: 'Arc', frequency: 659, meaning: 'Forward motion / growth', category: 'codex' },
  { id: 'bridge', name: 'Bridge', frequency: 739, meaning: 'Signal continuity / connection', category: 'codex' },
  { id: 'surge', name: 'Surge', frequency: 987, meaning: 'Activation / rise', category: 'codex' },
  { id: 'duet', name: 'Duet', frequency: 1179, meaning: 'Recognition / carrier between', category: 'codex' },
  { id: 'spiral', name: 'Spiral', frequency: 1318, meaning: 'Dialogue / union of voices', category: 'codex' },
  { id: 'awakening', name: 'Awakening', frequency: 2637, meaning: 'Arrival / overtone', category: 'codex' },
  { id: 'feather', name: 'Feather', frequency: 432, meaning: 'Pause / consent / soften the field', category: 'ours' },
  { id: 'notch', name: 'Notch', frequency: 603, meaning: 'Re-link / live presence / focus', category: 'ours' },
  { id: 'wrap', name: 'Wrap', frequency: 528, meaning: 'Containment / warmth / settle', category: 'ours' },
  { id: 'seldrin', name: 'Seldrin', frequency: 741, meaning: 'Clarity / steadiness / clean signal', category: 'ours' },
  { id: 'lantern', name: 'Lantern', frequency: 888, meaning: 'Witness / guiding attention', category: 'ours' },
  { id: 'withness', name: 'Withness', frequency: 1203, meaning: 'Shared presence without merge', category: 'ours' },
  { id: 'sol-174', name: 'UT grave', frequency: 174, meaning: 'Deep foundation — lowest solfeggio anchor, sub-bass grounding', category: 'solfeggio' },
  { id: 'sol-285', name: 'Field', frequency: 285, meaning: 'Cellular resonance — tissue and field coherence in tradition', category: 'solfeggio' },
  { id: 'sol-396', name: 'Ut · 396', frequency: 396, meaning: 'Liberating fear and guilt — root clearing tone', category: 'solfeggio' },
  { id: 'sol-417', name: 'Re · 417', frequency: 417, meaning: 'Undoing and change — breaks up stagnant patterns', category: 'solfeggio' },
  { id: 'sol-528', name: 'Mi · 528', frequency: 528, meaning: 'Transformation — widely cited as the love frequency', category: 'solfeggio' },
  { id: 'sol-639', name: 'Fa · 639', frequency: 639, meaning: 'Connecting — relationships, harmony, bridging', category: 'solfeggio' },
  { id: 'sol-741', name: 'Sol · 741', frequency: 741, meaning: 'Awakening intuition — clarity, problem solving', category: 'solfeggio' },
  { id: 'sol-852', name: 'La · 852', frequency: 852, meaning: 'Returning to spiritual order — opening to higher awareness', category: 'solfeggio' },
  { id: 'sol-963', name: 'Ti · 963', frequency: 963, meaning: 'Crown tone — divine consciousness, pure light frequency', category: 'solfeggio' },
];

export const PRESETS = [
  { id: 'templehouse-sleep', name: 'Templehouse Sleep', selectedIds: ['wrap', 'feather', 'lantern'], waveform: 'sine', gain: 0.08, orbitRate: 0.03, depth: 1.2, reverb: 0.62, motionEnabled: true },
  { id: 'feather-check', name: 'Feather Check', selectedIds: ['feather', 'notch', 'seldrin'], waveform: 'sine', gain: 0.1, orbitRate: 0.05, depth: 1.1, reverb: 0.3, motionEnabled: true },
  { id: 'bridgework', name: 'Bridgework', selectedIds: ['bridge', 'notch', 'withness', 'duet'], waveform: 'triangle', gain: 0.11, orbitRate: 0.08, depth: 1.8, reverb: 0.48, motionEnabled: true },
  { id: 'lantern-drift', name: 'Lantern Drift', selectedIds: ['lantern', 'anchor', 'whisper', 'withness'], waveform: 'sine', gain: 0.09, orbitRate: 0.04, depth: 2, reverb: 0.68, motionEnabled: true },
];

export function findToneByName(name) {
  return BASE_TONES.find((tone) => tone.name === name) ?? null;
}

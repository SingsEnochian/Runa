export function buildSceneFromToneLabSelection({
  sceneName = 'Tone Lab Transfer',
  theme = 'nocturne-garden',
  selectedTones = [],
  waveform = 'sine',
  gain = 0.1,
  orbitRate = 0.05,
  depth = 0.7,
  motionEnabled = true,
}) {
  return {
    id: crypto.randomUUID(),
    name: sceneName,
    theme,
    masterGain: clamp(gain * 1.6, 0, 1),
    updatedAt: new Date().toISOString(),
    layers: selectedTones.map((tone, index) => ({
      id: crypto.randomUUID(),
      kind: 'tone',
      name: tone.name,
      enabled: true,
      waveform,
      frequencyHz: tone.frequency,
      gain: clamp(gain / Math.max(1, selectedTones.length), 0.02, 0.35),
      motionEnabled,
      motionRateHz: orbitRate,
      motionDepth: depth,
      offset: selectedTones.length > 1 ? spreadOffset(index, selectedTones.length) : 0,
      origin: 'tone-lab',
      meaning: tone.meaning,
    })),
  };
}

function spreadOffset(index, total) {
  if (total <= 1) return 0;
  const mid = (total - 1) / 2;
  return clamp((index - mid) / Math.max(1, mid), -1, 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

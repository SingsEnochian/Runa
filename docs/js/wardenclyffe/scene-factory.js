export function createEmptyScene() {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Wardenclyffe Scene',
    theme: 'cathedral-blue',
    masterGain: 0.8,
    updatedAt: new Date().toISOString(),
    layers: [],
  };
}

export function createToneLayer(index = 1) {
  return {
    id: crypto.randomUUID(),
    kind: 'tone',
    name: `Tone ${index}`,
    enabled: true,
    waveform: 'sine',
    frequencyHz: 432,
    gain: 0.18,
    motionEnabled: true,
    motionRateHz: 0.06,
    motionDepth: 0.7,
    offset: 0,
  };
}

export function createBinauralLayer(index = 1) {
  return {
    id: crypto.randomUUID(),
    kind: 'binaural',
    name: `Binaural ${index}`,
    enabled: true,
    waveform: 'sine',
    carrierHz: 432,
    beatHz: 6,
    gain: 0.16,
    motionEnabled: false,
    motionRateHz: 0.04,
    motionDepth: 0.4,
    offset: 0,
    safeMotion: true,
  };
}

export function touchScene(scene) {
  scene.updatedAt = new Date().toISOString();
  return scene;
}

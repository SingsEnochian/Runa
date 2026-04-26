const SCHUMANN_MODES = [7.83, 14.3, 20.8, 27.3, 33.8];

export function createStAugustineProfile(options = {}) {
  return createSchumannProfile({
    latitude: 30.0,
    longitude: -81.3,
    locationLabel: 'St. Augustine · 30.0°N, 81.3°W',
    intensity: 0.18,
    tactileBias: 0.8,
    audibleBias: 0.22,
    includeOvertone: true,
    ...options,
  });
}

export function createSchumannProfile(options = {}) {
  const latitude = Number(options.latitude ?? 30.0);
  const longitude = Number(options.longitude ?? -81.3);
  const intensity = clamp(Number(options.intensity ?? 0.18), 0.03, 0.45);
  const tactileBias = clamp(Number(options.tactileBias ?? 0.8), 0, 1);
  const audibleBias = clamp(Number(options.audibleBias ?? 0.22), 0, 1);
  const includeOvertone = Boolean(options.includeOvertone ?? true);
  const locationLabel = options.locationLabel || `Lat ${latitude.toFixed(1)}°, Lon ${longitude.toFixed(1)}°`;

  const latitudePhase = Math.cos((Math.abs(latitude) / 90) * (Math.PI / 2));
  const coastalBias = 0.94 + ((Math.abs(longitude) % 9) / 100);

  const modes = SCHUMANN_MODES.map((frequency, index) => {
    const modeIndex = index + 1;
    const modeFalloff = 1 - index * 0.11;
    const latitudeWeight = 0.62 + latitudePhase * (0.32 / modeIndex);
    const weight = clamp(latitudeWeight * modeFalloff * coastalBias, 0.18, 1);
    return {
      frequency,
      weight,
      gain: intensity * weight * (index === 0 ? 1.15 : 0.78 - index * 0.08),
      tactile: index === 0,
      audible: index > 0,
      label: `Mode ${modeIndex}`,
    };
  });

  return {
    kind: 'schumann-underlay',
    label: locationLabel,
    latitude,
    longitude,
    createdAt: new Date().toISOString(),
    intensity,
    tactileBias,
    audibleBias,
    includeOvertone,
    modes,
  };
}

export function buildSchumannUnderlayLayers(profile) {
  const layers = [];

  profile.modes.forEach((mode, index) => {
    const baseGain = clamp(mode.gain * (mode.tactile ? profile.tactileBias : profile.audibleBias), 0.01, 0.25);
    layers.push({
      id: crypto.randomUUID(),
      systemTag: 'schumann-underlay',
      schumannRole: mode.tactile ? 'fundamental' : 'mode',
      kind: 'tone',
      name: `${mode.label} · ${mode.frequency.toFixed(2)} Hz`,
      enabled: true,
      waveform: mode.tactile ? 'sine' : 'triangle',
      frequencyHz: mode.frequency,
      gain: baseGain,
      motionEnabled: false,
      motionRateHz: 0.02 + index * 0.005,
      motionDepth: 0,
      offset: index % 2 === 0 ? -0.1 : 0.1,
      locationLabel: profile.label,
      modelKind: 'latitude-weighted-inspired',
    });
  });

  if (profile.includeOvertone) {
    layers.push({
      id: crypto.randomUUID(),
      systemTag: 'schumann-underlay',
      schumannRole: 'overtone',
      kind: 'tone',
      name: '9× overtone · 70.47 Hz',
      enabled: true,
      waveform: 'sine',
      frequencyHz: 70.47,
      gain: clamp(profile.intensity * 0.12, 0.01, 0.08),
      motionEnabled: false,
      motionRateHz: 0.03,
      motionDepth: 0,
      offset: 0,
      locationLabel: profile.label,
      modelKind: 'compositional-overtone',
    });
  }

  return layers;
}

export function summariseSchumannProfile(profile) {
  const dominant = [...profile.modes].sort((a, b) => b.weight - a.weight).slice(0, 3);
  return dominant.map((mode) => `${mode.frequency.toFixed(2)} Hz`).join(' · ');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

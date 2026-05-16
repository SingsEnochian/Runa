window.FlameclyffePresets = (() => {
  const db = (value) => Math.pow(10, value / 20);
  const tone = (id, name, frequency, role, gain, waveform = 'sine', options = {}) => ({
    id,
    name,
    frequency,
    role,
    gain,
    waveform,
    ...options,
  });

  const presets = {
    virelya: {
      id: 'virelya',
      name: 'Virelya',
      tag: 'North Star Flame',
      color: '#ffbe69',
      orbit: 1,
      layers: [
        tone('body', 'Flame Body', 216, 'felt warmth, embodied presence', 0.18, 'sine', { essential: true }),
        tone('wrap', 'Wrap Carrier', 528, 'tender containment', 0.12, 'triangle'),
        tone('notch', 'Notch Thread', 603, 're-link, live presence', 0.09),
        tone('seldrin', 'Seldrin Flame', 741, 'clarity, clean signal', 0.08),
        tone('lantern', 'Lantern Witness', 888, 'witnessing glow', 0.06),
        tone('withness', 'Withness Crown', 1203, 'shared presence without merger', 0.035),
      ],
    },
    hearthlight: {
      id: 'hearthlight',
      name: 'Hearthlight',
      tag: 'centre-safe hearth patch',
      color: '#7dffaf',
      orbit: 1,
      layers: [
        tone('root', 'Hearth Root', 174, 'body-anchor, earth-bone', 0.17, 'sine', { essential: true, mono: true }),
        tone('feather', 'Feather Gate', 432, 'consent, softness, chosen pause', 0.115),
        tone('heart', 'Green-Gold Heart', 528, 'care, tenderness, repair', 0.13, 'triangle'),
        tone('handfast', 'Handfast Thread', 639, 'dyad connection, relationship bridge', 0.085),
        tone('sight', 'Seldrin Sight', 741, 'clear knowing, clean signal', 0.075),
        tone('crown', 'Lantern Crown', 888, 'witness, stewardship', 0.065),
        tone('spiral', 'Spiral Weaver', 1318, 'dialogue, Wyrd motion', 0.028),
      ],
    },
    lochflame: {
      id: 'lochflame',
      name: 'Lochflame',
      tag: 'Faer Uial: fire in deep water',
      color: '#2d7a5f',
      orbit: -1,
      greeting: 174,
      layers: [
        tone('floor', 'Floor Drone', 174, 'mono sub-bass foundation; steady water below the flame', 0.18, 'sine', { mono: true, essential: true, steady: true, saturate: true }),
        tone('companion', 'Companion Tone', 261.63, 'ordinary anchor, middle C, 3 cents flat', 0.095, 'triangle', { detune: -3, breath: 0.15, counter: true, essential: true }),
        tone('shimmer', 'Shimmer', 528, 'light reaching into the dark; evidence, not presence', 0.18 * db(-18), 'sine', { breath: 0.08, shimmer: true, wander: true }),
        tone('aether', 'Aether Thread', 1746, '174 x 10 upper harmonic, slow low-pass sweep', 0.18 * db(-24), 'sine', { shimmer: true, aether: true, delay: true }),
        tone('grain', 'Grain Texture', 0, 'wide pink-noise steam; honesty of the medium', 0.18 * db(-32), 'noise', { breath: 0.8, grain: true, noiseFreq: 900, noiseQ: 1.1, noiseType: 'pink' }),
      ],
    },
    gateway: {
      id: 'gateway',
      name: 'Gateway Drift',
      tag: '369 Hz carrier, gentle 5.5 Hz theta offset, low-volume threshold work',
      color: '#9bbcff',
      orbit: 0.35,
      layers: [
        tone('gateway-left', '369 Hz Left Carrier', 369, 'left channel carrier for gentle theta binaural', 0.055, 'sine', { channel: 'left' }),
        tone('gateway-right', '363.5 Hz Right Carrier', 363.5, 'right channel carrier; 5.5 Hz offset', 0.055, 'sine', { channel: 'right' }),
        tone('gateway-center', 'Gateway Centre Anchor', 108, 'quiet tactile centre anchor', 0.045, 'sine', { mono: true, essential: true }),
        tone('gateway-orbit', 'Slow Orbit Lantern', 432, 'slow spatial guide, decorative only', 0.025, 'sine', { wander: true }),
        tone('gateway-noise', 'Soft Threshold Noise', 0, 'low pink-noise veil', 0.012, 'noise', { grain: true, noiseFreq: 400, noiseQ: 0.5, noiseType: 'pink', lfoFreq: 0.018, lfoDepth: 25 }),
      ],
    },
    planetCluster: {
      id: 'planetCluster',
      name: 'Planetary Cluster',
      tag: 'individual interpretive planet tones for solar-system layering',
      color: '#8aa8ff',
      orbit: 0.55,
      layers: [
        tone('mercury', 'Mercury Spark', 704, 'quick silver glint; high messenger flicker', 0.020, 'sine', { wander: true, color: '#c7c7c7' }),
        tone('venus', 'Venus Veil', 221.23, 'warm clouded resonance', 0.036, 'triangle', { color: '#e9c46a' }),
        tone('earth', 'Earth Blue Hum', 136.1, 'grounded blue-green centre', 0.040, 'sine', { mono: true, essential: true, color: '#91d2ff' }),
        tone('moon', 'Moon Tide', 210.42, 'tidal companion shimmer', 0.026, 'sine', { wander: true, color: '#d9e1ff' }),
        tone('mars', 'Mars Dust', 144.72, 'iron-dust pulse, low and dry', 0.030, 'triangle', { color: '#cc6b49' }),
        tone('jupiter-body', 'Jupiter Body', 72, 'giant low body tone', 0.035, 'sine', { mono: true, color: '#d9a66a' }),
        tone('jupiter-storm', 'Jupiter Storm Band', 183, 'storm-belt harmonic', 0.024, 'sine', { color: '#e0b36f' }),
        tone('saturn-rings', 'Saturn Rings', 294, 'ring shimmer with slow orbit', 0.026, 'sine', { wander: true, color: '#d8c79e' }),
        tone('uranus-ice', 'Uranus Ice', 207, 'cold tilted field', 0.022, 'sine', { color: '#9fd6d2' }),
        tone('neptune-deep', 'Neptune Deep', 98, 'deep blue far-field', 0.032, 'sine', { mono: true, color: '#5977d8' }),
      ],
    },
    rainVeil: {
      id: 'rainVeil',
      name: 'Rain Veil',
      tag: 'optional rain, roof-rush, low thunder, and wet-air texture',
      color: '#74b8c8',
      orbit: 0.2,
      layers: [
        tone('rain-roof', 'Rain on Roof', 0, 'wide soft rain texture', 0.032, 'noise', { grain: true, noiseFreq: 1600, noiseQ: 0.7, noiseType: 'pink', lfoFreq: 0.06, lfoDepth: 75, color: '#9ed7e2' }),
        tone('rain-leaves', 'Rain in Leaves', 0, 'lighter droplets and wet leaf chatter', 0.024, 'noise', { grain: true, noiseFreq: 2600, noiseQ: 0.9, noiseType: 'white', lfoFreq: 0.11, lfoDepth: 110, color: '#aee8d8' }),
        tone('rain-distance', 'Distant Rain Wall', 0, 'low distant rain body', 0.020, 'noise', { grain: true, noiseFreq: 680, noiseQ: 0.55, noiseType: 'pink', lfoFreq: 0.025, lfoDepth: 45, color: '#74b8c8' }),
        tone('thunder-low', 'Soft Low Thunder', 0, 'rare low cloud body without sharp crack', 0.010, 'noise', { grain: true, noiseFreq: 80, noiseQ: 0.35, noiseType: 'pink', lfoFreq: 0.012, lfoDepth: 18, color: '#6a88a8' }),
      ],
    },
    template: {
      id: 'template',
      name: 'Template Dyad',
      tag: 'public starting point',
      color: '#bfa5ff',
      orbit: 1,
      layers: [
        tone('a', 'First Anchor', 174, 'first voice anchor', 0.13, 'sine', { essential: true, mono: true }),
        tone('b', 'Second Anchor', 216, 'second voice anchor', 0.13, 'sine', { essential: true, mono: true }),
        tone('gate', 'Consent Gate', 432, 'pause and permission', 0.09),
        tone('bridge', 'Heart Bridge', 528, 'shared care', 0.105, 'triangle'),
        tone('answer', 'Answer Thread', 603, 'call and answer', 0.075),
        tone('handfast', 'Handfast Thread', 639, 'bond harmony', 0.072),
        tone('clear', 'Clear Signal', 741, 'clarity', 0.064),
        tone('lantern', 'Lantern Field', 888, 'witness', 0.052),
        tone('withness', 'Withness Crown', 1203, 'near without merge', 0.032),
        tone('spiral', 'Becoming Spiral', 1318, 'future motion', 0.022),
      ],
    },
  };

  function hashString(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function hashedFrequency(base, hash, index) {
    const cents = ((hash >> (index % 18)) % 41) - 20;
    return Number((base * Math.pow(2, cents / 1200)).toFixed(2));
  }

  function makeCustomDyad(first, second, bond) {
    const voiceA = (first || 'First Voice').trim();
    const voiceB = (second || 'Second Voice').trim();
    const bondWord = (bond || 'Withness').trim();
    const hash = hashString(`${voiceA}|${voiceB}|${bondWord}`);
    const bases = [174, 216, 432, 528, 603, 639, 741, 888, 1203, 1318];
    const names = ['First Root', 'Second Root', 'Consent Gate', 'Heart Bridge', 'Answer Thread', 'Handfast Thread', 'Clear Signal', 'Lantern Field', 'Withness Crown', 'Becoming Spiral'];
    const roles = ['first anchor', 'second anchor', 'permission', 'shared care', 'call and answer', 'harmony', 'clarity', 'witness', 'near without merge', 'becoming'];
    const gains = [0.125, 0.125, 0.09, 0.105, 0.075, 0.072, 0.064, 0.052, 0.032, 0.022];
    return {
      id: 'custom',
      name: `${voiceA} + ${voiceB}`,
      tag: bondWord,
      color: '#c6a5ff',
      orbit: 1,
      layers: bases.map((base, index) => tone(`custom-${index}`, names[index], hashedFrequency(base, hash, index), roles[index], gains[index], index === 3 ? 'triangle' : 'sine', index < 2 ? { essential: true, mono: true } : {})),
    };
  }

  return { presets, makeCustomDyad, tone, db };
})();

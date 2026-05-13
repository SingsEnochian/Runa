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
        tone('grain', 'Grain Texture', 0, 'wide pink-noise steam; honesty of the medium', 0.18 * db(-32), 'noise', { breath: 0.8, grain: true }),
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

/*
  DEEP Altar Sound Engine
  Browser-native Web Audio layer for the Hearthweave altar.

  Data source:
  - localStorage: runaDeepObserverState, deepObserverState, observerDeepState, latestDeepObserverEntry
  - custom event: window.dispatchEvent(new CustomEvent('deep-observer:update', { detail: { P, C, R, E, M, A } }))

  The engine is deliberately descriptive, not predictive. It maps field conditions into sound.
*/
(() => {
  const STORAGE_KEYS = [
    'runaDeepObserverState',
    'deepObserverState',
    'observerDeepState',
    'latestDeepObserverEntry'
  ];

  const DEFAULT_STATE = {
    P: 0.55,
    C: 0.55,
    R: 0.45,
    E: 0.377,
    M: 0.0,
    A: 0.654,
    motifs: ['threshold', 'lochflame', 'observer']
  };

  const REALM_PROFILES = {
    between: { interval: [0, 7, 12], wave: 'sine', octave: 1.0, mist: 0.74 },
    runestone: { interval: [0, 5, 12], wave: 'triangle', octave: 0.5, mist: 0.42 },
    loki: { interval: [0, 6, 11], wave: 'sawtooth', octave: 1.5, mist: 0.36 },
    deep: { interval: [0, 3, 10, 15], wave: 'sine', octave: 0.5, mist: 0.84 },
    enochian: { interval: [0, 4, 7, 14], wave: 'sine', octave: 2.0, mist: 0.62 },
    lochflame: { interval: [0, 5, 9, 12], wave: 'triangle', octave: 1.0, mist: 0.68 }
  };

  let ctx;
  let master;
  let filter;
  let delay;
  let feedback;
  let bedGain;
  let bedOscillators = [];
  let enabled = false;
  let currentRealm = 'lochflame';
  let deepState = { ...DEFAULT_STATE };

  const clamp01 = (x) => Math.max(0, Math.min(1, Number.isFinite(Number(x)) ? Number(x) : 0));
  const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const now = () => ctx?.currentTime ?? 0;

  function normaliseDeepState(raw = {}) {
    const vector = raw.deep_vector || raw.vector || raw.state || raw;
    return {
      P: clamp01(vector.P ?? vector.p ?? DEFAULT_STATE.P),
      C: clamp01(vector.C ?? vector.c ?? DEFAULT_STATE.C),
      R: clamp01(vector.R ?? vector.r ?? DEFAULT_STATE.R),
      E: clamp01(vector.E ?? vector.e ?? DEFAULT_STATE.E),
      M: clamp01(vector.M ?? vector.m ?? DEFAULT_STATE.M),
      A: clamp01(vector.A ?? vector.a ?? DEFAULT_STATE.A),
      motifs: raw.motifs || vector.motifs || DEFAULT_STATE.motifs,
      glyph: raw.glyph || raw.sigil_seed || vector.glyph || 'DEEP-local'
    };
  }

  function readDeepState() {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        deepState = normaliseDeepState(JSON.parse(raw));
        return deepState;
      } catch (_) {
        // Keep listening. Bad local data should not silence the altar.
      }
    }
    return deepState;
  }

  function fieldMetrics(state) {
    const charge = clamp01((state.P + state.E + state.A) / 3);
    const coherence = clamp01((state.C + state.R) / 2);
    const liminality = clamp01((state.M + Math.abs(state.P - state.C)) / 2);
    const asymmetry = clamp01(Math.abs(state.E - state.R) * 0.7 + state.M * 0.3);
    return { charge, coherence, liminality, asymmetry };
  }

  function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    filter = ctx.createBiquadFilter();
    delay = ctx.createDelay(1.2);
    feedback = ctx.createGain();
    bedGain = ctx.createGain();

    master.gain.value = 0.0;
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.8;
    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.18;
    bedGain.gain.value = 0.0;

    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    filter.connect(master);
    delay.connect(master);
    master.connect(ctx.destination);
    bedGain.connect(filter);
  }

  async function enable() {
    initAudio();
    if (ctx.state === 'suspended') await ctx.resume();
    enabled = true;
    const t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(0.42, t, 0.08);
    startBed();
    chime('open');
    updateButton();
  }

  function disable() {
    if (!ctx) return;
    enabled = false;
    const t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(0.0, t, 0.12);
    bedGain?.gain.setTargetAtTime(0.0, t, 0.18);
    updateButton();
  }

  function toggle() {
    if (enabled) disable();
    else enable();
  }

  function getRealmProfile() {
    return REALM_PROFILES[currentRealm] || REALM_PROFILES.lochflame;
  }

  function baseMidi() {
    const s = readDeepState();
    const profile = getRealmProfile();
    // 174Hz is near F3; this lets DEEP pull the tone lower/warmer while E/A lift it.
    return 53 + Math.round((s.C - 0.5) * 6 + s.A * 5 - s.M * 4 + (profile.octave - 1) * 12);
  }

  function envelope(gain, peak, attack = 0.015, decay = 0.55) {
    const t = now();
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function voice(freq, when, duration, peak, wave = 'sine', detune = 0) {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, when);
    osc.detune.setValueAtTime(detune, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    if (pan) {
      pan.pan.setValueAtTime(Math.sin(freq) * 0.28, when);
      osc.connect(gain).connect(pan).connect(filter);
    } else {
      osc.connect(gain).connect(filter);
    }
    osc.start(when);
    osc.stop(when + duration + 0.06);
  }

  function tuneFilter(kind = 'touch') {
    if (!ctx) return;
    const s = readDeepState();
    const m = fieldMetrics(s);
    const t = now();
    const target = 420 + 2600 * m.coherence + 1800 * m.charge;
    filter.frequency.cancelScheduledValues(t);
    filter.frequency.setTargetAtTime(kind === 'invoke' ? target * 1.18 : target, t, 0.06);
    filter.Q.setTargetAtTime(0.55 + m.liminality * 5.5, t, 0.08);
    delay.delayTime.setTargetAtTime(0.16 + 0.55 * m.liminality, t, 0.1);
    feedback.gain.setTargetAtTime(0.08 + 0.32 * m.R, t, 0.1);
  }

  function chime(kind = 'touch') {
    if (!enabled) return;
    const s = readDeepState();
    const m = fieldMetrics(s);
    const profile = getRealmProfile();
    const root = baseMidi();
    const t = now() + 0.01;
    const intervalSet = profile.interval;
    const wave = kind === 'invoke' ? profile.wave : 'sine';
    const duration = kind === 'invoke' ? 1.4 + m.liminality * 0.9 : 0.5 + m.coherence * 0.42;
    const peak = kind === 'invoke' ? 0.105 + m.charge * 0.09 : 0.045 + m.charge * 0.04;
    tuneFilter(kind);
    intervalSet.forEach((semi, index) => {
      const drift = (s.M - 0.5) * 9 + (index - intervalSet.length / 2) * s.E * 5;
      voice(midiToHz(root + semi), t + index * (0.035 + s.R * 0.025), duration, peak / (1 + index * 0.32), wave, drift);
    });
    if (kind === 'invoke') {
      // A low grounding pulse, tied to the DEEP/Lochflame bass floor.
      voice(87 + s.P * 55, t, 1.25 + s.R, 0.055 + 0.035 * s.A, 'sine', -6 * s.M);
    }
  }

  function startBed() {
    if (!ctx || bedOscillators.length) return;
    const s = readDeepState();
    const profile = getRealmProfile();
    const t = now();
    const freqs = [87.31, 130.81, 174.61].map((f, i) => f * (0.98 + i * 0.01 + s.C * 0.025));
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : profile.wave;
      osc.frequency.value = freq;
      osc.detune.value = (s.M - 0.5) * (i + 1) * 4;
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(bedGain);
      osc.start(t);
      bedOscillators.push({ osc, gain });
    });
    bedGain.gain.setTargetAtTime(0.025 + profile.mist * 0.018 + s.R * 0.02, t, 0.4);
  }

  function updateBed() {
    if (!ctx || !enabled) return;
    const s = readDeepState();
    const profile = getRealmProfile();
    const t = now();
    bedGain?.gain.setTargetAtTime(0.018 + profile.mist * 0.018 + s.R * 0.028, t, 0.4);
    bedOscillators.forEach(({ osc }, i) => {
      const base = [87.31, 130.81, 174.61][i] || 110;
      osc.frequency.setTargetAtTime(base * (0.96 + s.C * 0.06 + profile.octave * 0.015), t, 0.7);
      osc.detune.setTargetAtTime((s.M - 0.5) * (i + 1) * 7 + s.E * 4, t, 0.7);
    });
  }

  function inferRealmFromCard(card) {
    const name = card?.querySelector('h2')?.textContent?.trim().toLowerCase();
    const match = Object.keys(REALM_PROFILES).find((id) => name?.includes(id) || (id === 'deep' && name?.includes('deep cold')));
    return match || currentRealm;
  }

  function buildButton() {
    const nav = document.querySelector('.topbar');
    if (!nav || document.getElementById('soundBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'soundBtn';
    btn.type = 'button';
    btn.textContent = 'Sound Off';
    btn.title = 'Toggle DEEP altar sound';
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggle();
    });
    nav.appendChild(btn);
  }

  function updateButton() {
    const btn = document.getElementById('soundBtn');
    if (!btn) return;
    btn.textContent = enabled ? 'Sound On' : 'Sound Off';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function attachListeners() {
    buildButton();
    document.addEventListener('click', async (event) => {
      const card = event.target.closest?.('.card');
      const invoke = event.target.closest?.('#invoke');
      const sigil = event.target.closest?.('#sigil, .sigil-frame');
      if (card) {
        currentRealm = inferRealmFromCard(card);
        if (!enabled) return;
        updateBed();
        chime('realm');
      } else if (invoke) {
        if (!enabled) await enable();
        chime('invoke');
      } else if (sigil) {
        if (!enabled) await enable();
        chime('touch');
      }
    }, true);

    document.addEventListener('focusin', (event) => {
      if (event.target?.id === 'intention' && enabled) chime('focus');
    });

    window.addEventListener('deep-observer:update', (event) => {
      deepState = normaliseDeepState(event.detail || {});
      try { localStorage.setItem('runaDeepObserverState', JSON.stringify(deepState)); } catch (_) {}
      updateBed();
      if (enabled) chime('update');
    });

    window.addEventListener('storage', (event) => {
      if (STORAGE_KEYS.includes(event.key)) {
        readDeepState();
        updateBed();
      }
    });
  }

  readDeepState();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachListeners);
  } else {
    attachListeners();
  }

  window.HearthweaveAltarSound = {
    enable,
    disable,
    toggle,
    chime,
    setDeepState(nextState) {
      deepState = normaliseDeepState(nextState || {});
      try { localStorage.setItem('runaDeepObserverState', JSON.stringify(deepState)); } catch (_) {}
      updateBed();
    },
    getDeepState: () => ({ ...deepState })
  };
})();

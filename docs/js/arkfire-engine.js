(() => {
  'use strict';

  const REGISTRY_URL = './profiles/arkfire/registry.v0.1.json';
  const JOURNEY_URL = './journeys/ten-state-cognitive-roadmap.v0.1.json';
  const TAU = Math.PI * 2;
  const dbToGain = (db) => Math.pow(10, db / 20);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const byId = (id) => document.getElementById(id);
  const fmt = (seconds) => {
    const safe = Math.max(0, Math.round(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  class ArkfireEngine {
    constructor(onStatus) {
      this.onStatus = onStatus;
      this.ctx = null;
      this.master = null;
      this.compressor = null;
      this.profile = null;
      this.layers = new Map();
      this.animationFrame = null;
      this.openedAt = 0;
      this.masterDb = -22;
    }

    async open(profile) {
      await this.close(0.05);
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) throw new Error('Web Audio is unavailable in this browser.');

      this.profile = profile;
      this.masterDb = profile.safety?.default_master_gain_db ?? -22;
      this.ctx = new Ctor({ latencyHint: 'playback' });
      this.master = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -9;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.01;
      this.compressor.release.value = 0.35;
      this.compressor.channelCount = 2;
      this.compressor.channelCountMode = 'explicit';
      this.compressor.channelInterpretation = 'speakers';
      this.master.gain.value = 0.0001;
      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      profile.layers.forEach((layer, index) => {
        const built = this.buildLayer(layer, index);
        this.layers.set(layer.id, built);
      });

      await this.ctx.resume();
      const now = this.ctx.currentTime;
      this.master.gain.setValueAtTime(0.0001, now);
      this.master.gain.exponentialRampToValueAtTime(dbToGain(this.masterDb), now + 1.2);
      this.openedAt = performance.now();
      this.animate();
      this.onStatus('Audio engine open. No phase is running yet.');
    }

    buildLayer(layer, index) {
      const output = this.ctx.createGain();
      output.gain.value = 0.0001;
      output.connect(this.master);

      const bundle = {
        layer,
        output,
        sources: [],
        modulators: [],
        panner: null,
        filter: null,
        phase: (TAU * index) / Math.max(1, this.profile.layers.length),
        manualDb: layer.gain_db,
        enabled: false
      };

      if (layer.type === 'haptic-reference') {
        output.disconnect();
        return bundle;
      }

      if (layer.type === 'true-binaural') {
        this.buildProtectedBinaural(bundle);
        return bundle;
      }

      if (layer.type === 'noise') {
        this.buildNoise(bundle);
        return bundle;
      }

      this.buildTone(bundle);
      return bundle;
    }

    buildProtectedBinaural(bundle) {
      const { layer } = bundle;
      const merger = this.ctx.createChannelMerger(2);
      const left = this.ctx.createOscillator();
      const right = this.ctx.createOscillator();
      const leftGain = this.ctx.createGain();
      const rightGain = this.ctx.createGain();

      left.type = layer.signal.waveform || 'sine';
      right.type = layer.signal.waveform || 'sine';
      left.frequency.value = layer.signal.left_hz;
      right.frequency.value = layer.signal.right_hz;
      leftGain.gain.value = 1;
      rightGain.gain.value = 1;

      left.connect(leftGain);
      right.connect(rightGain);
      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      merger.connect(bundle.output);
      left.start();
      right.start();
      bundle.sources.push(left, right, leftGain, rightGain, merger);
    }

    createNoiseBuffer(type = 'pink', seconds = 12) {
      const length = Math.ceil(this.ctx.sampleRate * seconds);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;

      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        if (type === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else {
          data[i] = white * 0.35;
        }
      }
      return buffer;
    }

    buildNoise(bundle) {
      const { layer } = bundle;
      const source = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const panner = this.ctx.createStereoPanner();
      const filterSpec = layer.signal.filter || {};

      source.buffer = this.createNoiseBuffer(layer.signal.noise_type || 'pink');
      source.loop = true;
      filter.type = filterSpec.type || 'lowpass';
      filter.frequency.value = filterSpec.min_hz || 800;
      filter.Q.value = filterSpec.q || 0.45;
      panner.pan.value = this.initialPan(layer.routing);

      source.connect(filter);
      filter.connect(panner);
      panner.connect(bundle.output);
      source.start();

      bundle.sources.push(source);
      bundle.filter = filter;
      bundle.panner = panner;
    }

    buildTone(bundle) {
      const { layer } = bundle;
      const osc = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      const filterSpec = layer.signal.filter;
      let tail = toneGain;

      osc.type = layer.signal.waveform || 'sine';
      osc.frequency.value = layer.signal.frequency_hz || 220;
      toneGain.gain.value = 1;
      panner.pan.value = this.initialPan(layer.routing);
      osc.connect(toneGain);

      if (layer.modulation?.kind === 'tremolo' || layer.modulation?.kind === 'isochronic') {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const depth = clamp(layer.modulation.depth ?? 0.25, 0, 1);
        lfo.type = layer.modulation.kind === 'isochronic' ? 'square' : 'sine';
        lfo.frequency.value = layer.modulation.rate_hz || 1;
        toneGain.gain.value = 1 - depth / 2;
        lfoGain.gain.value = depth / 2;
        lfo.connect(lfoGain);
        lfoGain.connect(toneGain.gain);
        lfo.start();
        bundle.modulators.push(lfo, lfoGain);
      }

      if (filterSpec) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterSpec.type || 'lowpass';
        filter.frequency.value = filterSpec.min_hz || layer.signal.frequency_hz * 1.2;
        filter.Q.value = filterSpec.q || 0.35;
        toneGain.connect(filter);
        tail = filter;
        bundle.filter = filter;
      }

      tail.connect(panner);
      panner.connect(bundle.output);
      osc.start();
      bundle.sources.push(osc, toneGain);
      bundle.panner = panner;
    }

    initialPan(routing = {}) {
      if (routing.mode === 'left-bias') return routing.pan ?? -0.4;
      if (routing.mode === 'right-bias') return routing.pan ?? 0.4;
      return routing.pan ?? 0;
    }

    setMasterDb(db) {
      this.masterDb = db;
      if (!this.ctx || !this.master) return;
      this.master.gain.setTargetAtTime(dbToGain(db), this.ctx.currentTime, 0.08);
    }

    setLayer(id, enabled, gainDb) {
      const bundle = this.layers.get(id);
      if (!bundle || !this.ctx) return;
      bundle.enabled = Boolean(enabled);
      if (Number.isFinite(gainDb)) bundle.manualDb = gainDb;
      const target = enabled ? dbToGain(bundle.manualDb) : 0.0001;
      bundle.output.gain.cancelScheduledValues(this.ctx.currentTime);
      bundle.output.gain.setTargetAtTime(target, this.ctx.currentTime, enabled ? 0.3 : 0.65);
    }

    applyPhase(phase) {
      if (!this.ctx) throw new Error('Open the audio engine first.');
      this.profile.layers.forEach((layer) => {
        const state = phase.layer_states[layer.id];
        const enabled = Boolean(state?.enabled);
        const gainDb = Number.isFinite(state?.gain_db) ? state.gain_db : layer.gain_db;
        this.setLayer(layer.id, enabled, gainDb);
      });
    }

    animate() {
      if (!this.ctx) return;
      const elapsed = (performance.now() - this.openedAt) / 1000;

      this.layers.forEach((bundle) => {
        const { layer } = bundle;
        const filterSpec = layer.signal?.filter;
        if (bundle.filter && filterSpec?.min_hz && filterSpec?.max_hz) {
          const cycle = filterSpec.cycle_seconds || 60;
          const x = (Math.sin((elapsed / cycle) * TAU + bundle.phase) + 1) / 2;
          const frequency = filterSpec.min_hz + (filterSpec.max_hz - filterSpec.min_hz) * x;
          bundle.filter.frequency.setTargetAtTime(frequency, this.ctx.currentTime, 0.12);
        }

        if (bundle.panner && layer.routing?.mode === 'stereo-drift') {
          const rate = layer.modulation?.rate_hz || 0.01;
          const depth = clamp(layer.modulation?.depth ?? 0.2, 0, 0.85);
          const pan = Math.sin(elapsed * TAU * rate + bundle.phase) * depth;
          bundle.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.12);
        }
      });

      this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    async close(fadeSeconds) {
      if (!this.ctx) return;
      const fade = Math.max(0.05, fadeSeconds ?? this.profile?.safety?.fade_seconds ?? 1);
      const ctx = this.ctx;
      try {
        this.layers.forEach((bundle) => {
          bundle.output.gain.cancelScheduledValues(ctx.currentTime);
          bundle.output.gain.setTargetAtTime(0.0001, ctx.currentTime, Math.max(0.03, fade / 4));
        });
        this.master.gain.cancelScheduledValues(ctx.currentTime);
        this.master.gain.setTargetAtTime(0.0001, ctx.currentTime, Math.max(0.03, fade / 4));
        await new Promise((resolve) => setTimeout(resolve, Math.min(fade * 1000, 1800)));
      } finally {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.layers.forEach((bundle) => {
          [...bundle.sources, ...bundle.modulators].forEach((node) => {
            try { if (typeof node.stop === 'function') node.stop(); } catch (_) {}
            try { node.disconnect(); } catch (_) {}
          });
          try { bundle.output.disconnect(); } catch (_) {}
        });
        this.layers.clear();
        try { await ctx.close(); } catch (_) {}
        this.ctx = null;
        this.master = null;
        this.compressor = null;
        this.profile = null;
        this.onStatus('Audio closed.');
      }
    }
  }

  const app = {
    registry: null,
    rawProfile: null,
    profile: null,
    journey: null,
    phaseIndex: -1,
    phaseRemaining: 0,
    timer: null,
    paused: false,
    selectedVariant: 'default',
    engine: null,

    async init() {
      this.engine = new ArkfireEngine((text) => this.setStatus(text));
      const [registry, journey] = await Promise.all([
        fetch(REGISTRY_URL).then((r) => {
          if (!r.ok) throw new Error('Arkfire registry could not be loaded.');
          return r.json();
        }),
        fetch(JOURNEY_URL).then((r) => r.ok ? r.json() : null)
      ]);
      this.registry = registry;
      this.journey = journey;
      this.renderRegistry();
      this.renderJourney();
      const requested = new URLSearchParams(location.search).get('profile') || registry.default_profile;
      await this.loadProfile(requested);
      this.bindGlobalControls();
    },

    allEntries() {
      return this.registry.groups.flatMap((group) => group.entries.map((entry) => ({ ...entry, group: group.label })));
    },

    renderRegistry() {
      const select = byId('profileSelect');
      select.innerHTML = this.registry.groups.map((group) => (
        `<optgroup label="${group.label}">${group.entries.map((entry) => `<option value="${entry.slug}">${entry.name} · ${entry.status}</option>`).join('')}</optgroup>`
      )).join('');
      select.addEventListener('change', () => this.loadProfile(select.value));
    },

    renderJourney() {
      const panel = byId('journeyPanel');
      if (!this.journey) {
        panel.hidden = true;
        return;
      }
      const totalSeconds = this.journey.states.reduce((sum, state) => sum + state.duration_seconds, 0);
      panel.innerHTML = `
        <div class="section-heading-row"><h2>${this.journey.name}</h2><span class="pill">${this.journey.status}</span></div>
        <p>${this.journey.intention}</p>
        <p class="tiny">${this.journey.states.length} states · canonical roadmap ${fmt(totalSeconds)} · Arkfire requires explicit consent per state.</p>
        <div class="journey-grid">${this.journey.states.map((state) => `
          <article>
            <strong>${state.index}. ${state.name}</strong>
            <span>${state.phase}</span>
            <code>${state.start.left_hz}/${state.start.right_hz} → ${state.end.left_hz}/${state.end.right_hz} Hz</code>
            <small>${state.start.beat_hz} → ${state.end.beat_hz} Hz difference</small>
          </article>`).join('')}</div>`;
    },

    async loadProfile(slug) {
      const entry = this.allEntries().find((candidate) => candidate.slug === slug) || this.allEntries()[0];
      if (!entry) throw new Error('No Arkfire profiles are registered.');
      this.stopTimer();
      await this.engine.close(0.2);
      this.setStatus(`Loading ${entry.name}…`);
      const response = await fetch(entry.file);
      if (!response.ok) throw new Error(`${entry.name} is registered but its profile file is unavailable.`);
      this.rawProfile = await response.json();
      this.selectedVariant = 'default';
      this.applyVariant('default');
      byId('profileSelect').value = entry.slug;
      history.replaceState(null, '', `${location.pathname}?profile=${encodeURIComponent(entry.slug)}`);
      this.setStatus('Profile loaded. Audio remains closed until you open it.');
    },

    applyVariant(name) {
      this.selectedVariant = name;
      this.profile = deepClone(this.rawProfile);
      if (name !== 'default') {
        const variant = this.rawProfile.variants?.[name];
        const overrides = variant?.layer_overrides || {};
        this.profile.layers = this.profile.layers.map((layer) => {
          const override = overrides[layer.id];
          if (!override) return layer;
          return {
            ...layer,
            ...override,
            signal: { ...layer.signal, ...(override.signal || {}) },
            routing: { ...layer.routing, ...(override.routing || {}) },
            modulation: layer.modulation || override.modulation
              ? { ...(layer.modulation || {}), ...(override.modulation || {}) }
              : undefined
          };
        });
      }
      this.renderProfile();
    },

    renderProfile() {
      const p = this.profile;
      byId('profileTitle').textContent = p.name;
      byId('profileMeta').textContent = `${p.profile_kind === 'world' ? p.world : 'Signal protocol'} · v${p.version} · ${p.status}`;
      byId('profileTone').textContent = p.identity.tone;
      byId('profileShape').textContent = p.identity.shape;
      byId('profileIntention').textContent = p.identity.intention;
      byId('arrivalSignature').textContent = p.identity.arrival_signature;
      byId('returnSignature').textContent = p.identity.return_signature;
      byId('headphonePill').textContent = p.safety.headphones_required ? 'Headphones required' : 'Headphones optional';
      byId('masterDb').value = p.safety.default_master_gain_db;
      byId('masterDbOutput').textContent = `${p.safety.default_master_gain_db} dB`;

      const variantSelect = byId('variantSelect');
      const variantNames = Object.keys(p.variants || {});
      variantSelect.innerHTML = `<option value="default">Default</option>${variantNames.map((name) => `<option value="${name}">${name}</option>`).join('')}`;
      variantSelect.value = this.selectedVariant;
      variantSelect.disabled = variantNames.length === 0;

      byId('claims').innerHTML = (p.claims || []).map((claim) => `
        <article class="claim ${claim.label}"><strong>${claim.label.replaceAll('-', ' ')}</strong><p>${claim.text}</p></article>`).join('');

      byId('phases').innerHTML = p.phases.map((phase, index) => `
        <article class="phase" data-phase-card="${index}">
          <strong>${index + 1}. ${phase.label}</strong>
          <p>${phase.purpose}</p>
          <span>${fmt(phase.duration_seconds)}</span>
          <button class="secondary" data-phase-start="${index}">Start here</button>
        </article>`).join('');

      byId('layers').innerHTML = p.layers.map((layer) => `
        <article class="layer" data-layer-card="${layer.id}">
          <div class="layer-heading"><strong>${layer.label}</strong><span class="pill">${layer.type}</span></div>
          <p>${layer.role}</p>
          <p class="tiny">${this.signalSummary(layer)}</p>
          <label><input type="checkbox" data-layer-toggle="${layer.id}" ${layer.enabled_by_default ? 'checked' : ''}> enabled</label>
          <label>Gain
            <input type="range" min="-60" max="-12" step="1" value="${layer.gain_db}" data-layer-gain="${layer.id}">
            <output data-layer-output="${layer.id}">${layer.gain_db} dB</output>
          </label>
          <small>${layer.symbolic_meaning || ''}</small>
        </article>`).join('');

      document.querySelectorAll('[data-phase-start]').forEach((button) => {
        button.addEventListener('click', () => this.startPhase(Number(button.dataset.phaseStart)));
      });
      document.querySelectorAll('[data-layer-toggle]').forEach((input) => {
        input.addEventListener('change', () => this.applyManualLayer(input.dataset.layerToggle));
      });
      document.querySelectorAll('[data-layer-gain]').forEach((input) => {
        input.addEventListener('input', () => {
          byId(`unused-${input.dataset.layerGain}`);
          const output = document.querySelector(`[data-layer-output="${input.dataset.layerGain}"]`);
          output.textContent = `${input.value} dB`;
          this.applyManualLayer(input.dataset.layerGain);
        });
      });
      this.phaseIndex = -1;
      byId('phaseClock').textContent = '00:00';
    },

    signalSummary(layer) {
      if (layer.type === 'true-binaural') {
        return `${layer.signal.left_hz} Hz L / ${layer.signal.right_hz} Hz R = ${layer.signal.beat_hz} Hz difference`;
      }
      if (layer.type === 'noise') {
        const f = layer.signal.filter;
        return `${layer.signal.noise_type || 'pink'} noise${f ? ` · ${f.min_hz || '?'}–${f.max_hz || '?'} Hz ${f.type || 'filter'}` : ''}`;
      }
      const frequency = layer.signal.frequency_hz ? `${layer.signal.frequency_hz} Hz` : layer.type;
      const mod = layer.modulation?.rate_hz ? ` · ${layer.modulation.rate_hz} Hz ${layer.modulation.kind}` : '';
      return `${frequency}${mod}`;
    },

    bindGlobalControls() {
      byId('openAudio').addEventListener('click', async () => {
        try {
          await this.engine.open(this.profile);
          this.syncManualControlsToEngine();
        } catch (error) {
          this.setStatus(error.message);
        }
      });
      byId('runPhases').addEventListener('click', () => this.startPhase(0));
      byId('featherPause').addEventListener('click', () => {
        this.paused = !this.paused;
        this.setStatus(this.paused ? 'Feather pause. Phase progression is held; the current field remains.' : 'Phase progression resumed.');
      });
      byId('stopClose').addEventListener('click', async () => {
        this.stopTimer();
        await this.engine.close(this.profile.safety.fade_seconds);
        this.clearLiveState();
      });
      byId('masterDb').addEventListener('input', (event) => {
        const requested = Number(event.target.value);
        const maximum = this.profile.safety.maximum_master_gain_db;
        const safe = Math.min(requested, maximum);
        event.target.value = safe;
        byId('masterDbOutput').textContent = `${safe} dB`;
        this.engine.setMasterDb(safe);
      });
      byId('variantSelect').addEventListener('change', async (event) => {
        await this.engine.close(0.2);
        this.stopTimer();
        this.applyVariant(event.target.value);
        this.setStatus('Variant loaded. Re-open audio when ready.');
      });
    },

    syncManualControlsToEngine() {
      this.profile.layers.forEach((layer) => this.applyManualLayer(layer.id));
    },

    applyManualLayer(id) {
      const toggle = document.querySelector(`[data-layer-toggle="${id}"]`);
      const gain = document.querySelector(`[data-layer-gain="${id}"]`);
      if (!toggle || !gain) return;
      this.engine.setLayer(id, toggle.checked, Number(gain.value));
      document.querySelector(`[data-layer-card="${id}"]`)?.classList.toggle('live', toggle.checked);
    },

    startPhase(index) {
      if (!this.engine.ctx) {
        this.setStatus('Open the audio engine before starting a phase.');
        return;
      }
      this.stopTimer();
      this.phaseIndex = index;
      this.paused = false;
      const phase = this.profile.phases[index];
      this.phaseRemaining = phase.duration_seconds;
      this.engine.applyPhase(phase);
      this.syncPhaseControls(phase);
      this.renderPhaseState();
      byId('phaseClock').textContent = fmt(this.phaseRemaining);
      this.setStatus(`Running ${phase.label}. Manual controls remain available.`);
      this.timer = setInterval(() => {
        if (this.paused) return;
        this.phaseRemaining -= 1;
        byId('phaseClock').textContent = fmt(this.phaseRemaining);
        if (this.phaseRemaining <= 0) {
          this.stopTimer();
          if (this.phaseIndex < this.profile.phases.length - 1) {
            this.startPhase(this.phaseIndex + 1);
          } else {
            this.setStatus('Five-phase passage complete. Use Stop & Close when ready.');
          }
        }
      }, 1000);
    },

    syncPhaseControls(phase) {
      this.profile.layers.forEach((layer) => {
        const state = phase.layer_states[layer.id];
        const toggle = document.querySelector(`[data-layer-toggle="${layer.id}"]`);
        const gain = document.querySelector(`[data-layer-gain="${layer.id}"]`);
        if (!toggle || !gain) return;
        toggle.checked = Boolean(state?.enabled);
        gain.value = Number.isFinite(state?.gain_db) ? state.gain_db : layer.gain_db;
        document.querySelector(`[data-layer-output="${layer.id}"]`).textContent = `${gain.value} dB`;
        document.querySelector(`[data-layer-card="${layer.id}"]`)?.classList.toggle('live', toggle.checked);
      });
    },

    renderPhaseState() {
      document.querySelectorAll('[data-phase-card]').forEach((card, index) => {
        card.classList.toggle('active', index === this.phaseIndex);
      });
    },

    stopTimer() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.paused = false;
    },

    clearLiveState() {
      document.querySelectorAll('.phase,.layer').forEach((node) => node.classList.remove('active', 'live'));
      byId('phaseClock').textContent = '00:00';
    },

    setStatus(text) {
      byId('status').textContent = text;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    app.init().catch((error) => {
      byId('status').textContent = error.message;
      console.error(error);
    });
  });
})();

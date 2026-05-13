window.FlameclyffeAudio = (() => {
  const TAU = Math.PI * 2;
  const { SCHUMANN, SCHUMANN_PROXIES, TACTILE_ANCHORS, modulation, schumannWeight, clamp } = window.FlameclyffeSignals;
  const { presets } = window.FlameclyffePresets;

  function noiseBuffer(ctx, type = 'pink', seconds = 8) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        last = (last + 0.025 * white) / 1.025;
        data[i] = last * 3.5;
      } else {
        data[i] = white * 0.35;
      }
    }
    return buffer;
  }

  function stopNode(node, when = 0) {
    try { if (node && typeof node.stop === 'function') node.stop(when); } catch {}
  }

  function disconnect(node) {
    try { if (node) node.disconnect(); } catch {}
  }

  function hearingScale(state, frequency, essential) {
    if (!frequency) return 1;
    let scale = 1;
    if (state.profile === 'centerSafe') {
      if (frequency < 80) scale *= 1 + state.tactile;
      if (frequency >= 80 && frequency < 260) scale *= 1 + state.sub * 0.75;
      if (frequency > 1100) scale *= state.shimmer * 0.8;
      if (essential) scale *= 1.18;
    }
    if (state.profile === 'tactile') {
      if (frequency < 260) scale *= 1.8;
      if (frequency > 900) scale *= 0.55;
    }
    return scale;
  }

  function panFor(state, layer, index) {
    if (state.profile !== 'standard' && (layer.essential || layer.frequency < 260 || layer.mono)) return 0;
    if (layer.wander) return Math.sin(Date.now() / 7000 + index) * 0.55;
    return Math.sin(Date.now() / 2400 + index) * (state.orbit * 0.9) * (layer.orbitSign || 1);
  }

  function selectedPresets(state) {
    const all = state.custom ? { ...presets, custom: state.custom } : presets;
    return Object.values(all).filter((preset) => state.active[preset.id]);
  }

  function buildLayers(state) {
    const mod = modulation(state);
    const output = [];
    selectedPresets(state).forEach((preset) => {
      const presetGain = state.gains[preset.id] ?? 0.7;
      preset.layers.forEach((sourceLayer, index) => {
        let frequency = sourceLayer.frequency;
        if (state.mode369 && preset.id === 'lochflame') {
          if (sourceLayer.id === 'companion') frequency = 522;
          if (sourceLayer.id === 'aether') frequency = 1044;
          if (sourceLayer.id === 'shimmer') return;
        }
        if (state.protocol === 'held' && preset.id === 'lochflame' && !['floor', 'companion'].includes(sourceLayer.id)) return;
        if (state.protocol === 'seldrin' && sourceLayer.grain) return;

        let gain = sourceLayer.gain * presetGain * state.master * 0.55 * hearingScale(state, frequency || 500, sourceLayer.essential);
        if (preset.id === 'lochflame' && state.protocol === 'notch' && sourceLayer.id === 'shimmer') gain *= Math.pow(10, -6 / 20);
        if (preset.id === 'lochflame' && state.protocol === 'wrap' && sourceLayer.id === 'floor') gain *= Math.pow(10, 2 / 20);
        if (preset.id === 'lochflame' && state.protocol === 'wrap' && sourceLayer.id === 'companion') gain *= Math.pow(10, 1 / 20);
        if (sourceLayer.shimmer) gain *= state.shimmer * (1 + mod.humidityTilt * 0.15);
        if (sourceLayer.grain) gain *= 1 + mod.windTilt * 0.4;

        output.push({
          ...sourceLayer,
          preset: preset.id,
          presetName: preset.name,
          color: preset.color,
          frequency,
          gain,
          detune: (sourceLayer.detune || 0) + mod.pressureTilt * 2 + mod.windTilt - mod.stormTilt + mod.flareFactor * 0.8,
          pulse: 0.025 * (1 + index * 0.13),
          orbitSign: preset.orbit || 1,
        });
      });
      if (state.mode369 && preset.id === 'lochflame') {
        output.push({
          id: 'loch-top',
          name: 'Lochflame 9x Top Harmonic',
          frequency: 1566,
          role: '3:6:9 breath-modulated top light',
          gain: 0.18 * Math.pow(10, -30 / 20) * presetGain * state.master * state.shimmer,
          waveform: 'sine',
          preset: preset.id,
          presetName: preset.name,
          color: preset.color,
          breath: 0.35,
        });
      }
    });

    if (state.protocol === 'notch') {
      output.push({ id: 'notch-forward', name: 'Protocol Notch 603 Hz', frequency: 603, role: 'Notch brought forward', gain: state.master * 0.055, waveform: 'sine', preset: 'protocol', presetName: 'Protocol', color: '#ffd58e' });
    }

    SCHUMANN.forEach((frequency, index) => {
      const weight = schumannWeight(state, index, mod);
      output.push({ id: `sch-${index}`, name: `Schumann ${frequency}`, frequency, role: 'Earth-ionosphere tactile layer', gain: state.master * state.schumann * 0.13 * weight * hearingScale(state, frequency, true), waveform: 'sine', preset: 'earth', presetName: 'Earth', color: '#91d2ff', essential: true, mono: true });
      output.push({ id: `proxy-${index}`, name: `Schumann proxy ${SCHUMANN_PROXIES[index]}`, frequency: SCHUMANN_PROXIES[index], role: 'audible Schumann proxy', gain: state.master * state.schumann * 0.018 * weight * hearingScale(state, SCHUMANN_PROXIES[index], false), waveform: 'sine', preset: 'earth', presetName: 'Earth', color: '#91d2ff', detune: mod.timePhase * 4 });
    });

    TACTILE_ANCHORS.forEach((frequency, index) => {
      output.push({ id: `anchor-${index}`, name: `Tactile anchor ${frequency}`, frequency, role: 'Woojer-friendly Schumann/body anchor', gain: state.master * state.tactile * 0.025 * hearingScale(state, frequency, true), waveform: 'sine', preset: 'earth', presetName: 'Earth', color: '#91d2ff', essential: true, mono: true });
    });

    return output;
  }

  class Engine {
    constructor(state) {
      this.state = state;
      this.ctx = null;
      this.master = null;
      this.streamDest = null;
      this.nodes = [];
      this.bundles = [];
      this.frame = null;
      this.on = false;
    }

    async ensure() {
      if (!this.ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.streamDest = this.ctx.createMediaStreamDestination();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        this.master.gain.value = 0.0001;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        this.master.connect(this.streamDest);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return this.ctx;
    }

    stop(fade = 0.3) {
      if (this.frame) cancelAnimationFrame(this.frame);
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (this.master) this.master.gain.setTargetAtTime(0.0001, now, fade);
      this.nodes.forEach((node) => { stopNode(node, now + fade); disconnect(node); });
      this.nodes = [];
      this.bundles = [];
      this.on = false;
    }

    async play() {
      await this.ensure();
      this.stop();
      const now = this.ctx.currentTime;
      this.master.gain.setValueAtTime(0.0001, now);
      this.master.gain.linearRampToValueAtTime(this.state.master, now + 0.8);
      this.greetLochflame();
      this.createTones();
      this.createNoise();
      this.t0 = performance.now();
      this.on = true;
      this.animate();
    }

    greetLochflame() {
      if (!this.state.active.lochflame) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = 174;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.master * 0.1, this.ctx.currentTime + 0.2);
      gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime + 1.2, 0.8);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.4);
      this.nodes.push(osc, gain);
    }

    createTones() {
      const layers = buildLayers(this.state).filter((layer) => layer.waveform !== 'noise' && layer.frequency > 0);
      layers.forEach((layer, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();
        osc.type = layer.waveform || 'sine';
        osc.frequency.value = layer.frequency;
        osc.detune.value = layer.detune || 0;
        gain.gain.value = layer.gain;
        if (layer.breath) {
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          lfo.frequency.value = 7.83;
          lfoGain.gain.value = layer.gain * layer.breath * this.state.schumann;
          lfo.connect(lfoGain);
          lfoGain.connect(gain.gain);
          lfo.start();
          this.nodes.push(lfo, lfoGain);
        }
        panner.pan.value = panFor(this.state, layer, index);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.master);
        osc.start();
        this.nodes.push(osc, gain, panner);
        this.bundles.push({ osc, gain, panner, layer, phase: TAU * index / Math.max(1, layers.length) });
      });
    }

    noise(freq, gainValue, q, type = 'pink', lfoFreq = 0.05, lfoDepth = 20, breath = 0) {
      if (gainValue <= 0) return;
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      src.buffer = noiseBuffer(this.ctx, type);
      src.loop = true;
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = q;
      gain.gain.value = gainValue;
      if (breath) {
        const breathOsc = this.ctx.createOscillator();
        const breathGain = this.ctx.createGain();
        breathOsc.frequency.value = 7.83;
        breathGain.gain.value = gainValue * breath * this.state.schumann;
        breathOsc.connect(breathGain);
        breathGain.connect(gain.gain);
        breathOsc.start();
        this.nodes.push(breathOsc, breathGain);
      }
      lfo.frequency.value = lfoFreq;
      lfoGain.gain.value = lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start();
      lfo.start();
      this.nodes.push(src, filter, gain, lfo, lfoGain);
    }

    createNoise() {
      const mod = modulation(this.state);
      buildLayers(this.state).filter((layer) => layer.waveform === 'noise').forEach((layer) => {
        this.noise(900, layer.gain, 1.1, 'pink', 0.02 + mod.windTilt * 0.08, 80, layer.breath || 0);
      });
      this.noise(430 + mod.speedFactor * 280, this.state.solarWind * (0.012 + mod.speedFactor * 0.045 + mod.southFactor * 0.025), 0.55, 'pink', 0.05 + mod.densityFactor * 0.08, 34 + mod.magFactor * 36);
      this.noise(155 + mod.flareFactor * 90, this.state.solarRoar * (0.018 + mod.flareFactor * 0.075), 0.45, 'pink', 0.025 + mod.flareFactor * 0.22, 22 + mod.flareFactor * 58);
      this.noise(930 + mod.flareFactor * 520, this.state.solarFlare * (0.006 + mod.flareFactor * 0.06), 1.4, 'white', 0.12 + mod.flareFactor * 0.7, 120);
      this.noise(82 + mod.kpFactor * 72, this.state.jupiter * (0.018 + mod.kpFactor * 0.045), 0.65, 'pink', 0.06 + mod.timePhase * 0.02, 28);
      if (this.state.active.lochflame) this.noise(27, this.state.jupiter * Math.pow(10, -28 / 20), 0.9, 'pink', 4, 6);
      this.noise(132, this.state.outer * 0.028, 0.5, 'pink', 0.033, 16);
      this.noise(54, this.state.outer * 0.018, 0.38, 'pink', 0.018, 10);
    }

    apply() {
      if (this.master) this.master.gain.setTargetAtTime(this.state.master, this.ctx.currentTime, 0.08);
    }

    animate() {
      const elapsed = (performance.now() - this.t0) / 1000;
      this.bundles.forEach((bundle, index) => {
        bundle.panner.pan.setTargetAtTime(panFor(this.state, bundle.layer, index), this.ctx.currentTime, 0.12);
        const pulse = 1 + Math.sin(elapsed * TAU * (bundle.layer.pulse || 0.03) + bundle.phase) * 0.07;
        bundle.gain.gain.setTargetAtTime(bundle.layer.gain * pulse, this.ctx.currentTime, 0.08);
      });
      this.frame = requestAnimationFrame(() => this.animate());
    }
  }

  return { Engine, buildLayers, selectedPresets, panFor };
})();

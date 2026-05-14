(() => {
  const TAU = Math.PI * 2;
  const DEFAULT_MASTER_GAIN = 0.075;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function numeric(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function makeImpulse(ctx, seconds = 2.2, decay = 3.1) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const ratio = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - ratio, decay);
      }
    }

    return buffer;
  }

  function inferGain(source, index, total) {
    const label = `${source.label || ""} ${source.role || ""}`.toLowerCase();
    const base = source.kind === "layer" ? 0.034 : 0.024;
    const lowLift = numeric(source.frequency_hz) < 220 ? 1.35 : 1;
    const roleLift = label.includes("floor") || label.includes("foundation") ? 1.45 : 1;
    const shimmerDuck = label.includes("shimmer") || label.includes("overtone") ? 0.65 : 1;
    const crowdDuck = 1 / Math.sqrt(Math.max(1, total));
    return clamp(base * lowLift * roleLift * shimmerDuck * crowdDuck * (1 + index * 0.018), 0.004, 0.055);
  }

  function normalizeWaveform(value) {
    const waveform = String(value || "sine").toLowerCase();
    return ["sine", "triangle", "square", "sawtooth"].includes(waveform) ? waveform : "sine";
  }

  function voiceSourcesFromPatch(patch) {
    const layers = (patch.layers || []).map((layer) => ({
      kind: "layer",
      label: layer.label,
      role: layer.role || layer.notes || "layer",
      frequency_hz: layer.frequency_hz,
      waveform: layer.waveform,
      params: layer.params || {},
    }));

    const tones = (patch.tones || []).map((tone) => ({
      kind: "tone",
      label: tone.label,
      role: tone.role || tone.meaning || "tone",
      frequency_hz: tone.frequency_hz,
      waveform: tone.default_waveform,
      params: tone.params || {},
    }));

    return [...layers, ...tones]
      .map((source) => ({ ...source, frequency_hz: numeric(source.frequency_hz) }))
      .filter((source) => source.frequency_hz > 0)
      .slice(0, 16);
  }

  class FlameclyffeAudioAdapter {
    constructor(options = {}) {
      this.masterGain = numeric(options.masterGain, DEFAULT_MASTER_GAIN);
      this.ctx = null;
      this.master = null;
      this.compressor = null;
      this.reverb = null;
      this.voices = [];
      this.startedAt = 0;
      this.animation = null;
      this.status = "idle";
    }

    async ensureContext() {
      if (!this.ctx) {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) throw new Error("Web Audio is not available in this browser.");

        this.ctx = new AudioContextCtor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.0001;

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -20;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = 0.01;
        this.compressor.release.value = 0.25;

        this.reverb = this.ctx.createConvolver();
        this.reverb.buffer = makeImpulse(this.ctx);

        this.master.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }

      if (this.ctx.state === "suspended") await this.ctx.resume();
      return this.ctx;
    }

    async playPatch(patch) {
      if (!patch) throw new Error("No Flameclyffe patch selected.");
      await this.stop({ quick: true });
      const ctx = await this.ensureContext();
      const sources = voiceSourcesFromPatch(patch);
      if (!sources.length) throw new Error("Selected patch has no playable layer or tone frequencies.");

      const now = ctx.currentTime;
      this.startedAt = performance.now();
      this.status = "playing";
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0.0001, now);
      this.master.gain.linearRampToValueAtTime(this.masterGain, now + 0.9);

      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.18;
      reverbSend.connect(this.reverb);
      this.reverb.connect(this.master);

      this.voices = sources.map((source, index) => {
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();
        const panner = ctx.createStereoPanner();
        const orbit = ctx.createOscillator();
        const orbitGain = ctx.createGain();
        const breath = ctx.createOscillator();
        const breathGain = ctx.createGain();

        const total = sources.length;
        const gain = inferGain(source, index, total);
        const phase = (index / Math.max(1, total)) * TAU;
        const counter = index % 2 === 0 ? 1 : -1;
        const breathPhase = index % 2 === 0 ? 0 : Math.PI;
        const orbitRate = numeric(source.params?.orbitRate ?? source.params?.orbit_rate, 0.028 + index * 0.004);
        const depth = numeric(source.params?.depth, 0.22 + Math.min(0.18, index * 0.018));

        osc.type = normalizeWaveform(source.waveform);
        osc.frequency.value = source.frequency_hz;
        osc.detune.value = counter * Math.min(7, index * 0.35);

        voiceGain.gain.value = 0.0001;
        voiceGain.gain.setTargetAtTime(gain, now + 0.04 * index, 0.5);

        panner.pan.value = Math.sin(phase) * depth;
        orbit.frequency.value = Math.max(0.004, orbitRate);
        orbitGain.gain.value = depth * counter;

        breath.frequency.value = 7.83 / 60;
        breath.detune.value = breathPhase === 0 ? 0 : 50;
        breathGain.gain.value = gain * 0.16;

        orbit.connect(orbitGain);
        orbitGain.connect(panner.pan);
        breath.connect(breathGain);
        breathGain.connect(voiceGain.gain);
        osc.connect(voiceGain);
        voiceGain.connect(panner);
        panner.connect(this.master);
        panner.connect(reverbSend);

        osc.start(now);
        orbit.start(now);
        breath.start(now);

        return { source, osc, orbit, breath, voiceGain, panner, reverbSend, phase, counter, depth, gain };
      });

      this.animate();
      return {
        patch_slug: patch.slug,
        patch_name: patch.name,
        voice_count: this.voices.length,
        voices: this.voices.map((voice) => ({
          label: voice.source.label,
          frequency_hz: voice.source.frequency_hz,
          role: voice.source.role,
          kind: voice.source.kind,
        })),
      };
    }

    animate() {
      if (!this.ctx || !this.voices.length) return;
      const elapsed = (performance.now() - this.startedAt) / 1000;
      const now = this.ctx.currentTime;

      this.voices.forEach((voice, index) => {
        const slowPulse = 1 + Math.sin(elapsed * (0.08 + index * 0.011) + voice.phase) * 0.045;
        const gain = clamp(voice.gain * slowPulse, 0.002, 0.06);
        voice.voiceGain.gain.setTargetAtTime(gain, now, 0.12);
      });

      this.animation = requestAnimationFrame(() => this.animate());
    }

    async stop(options = {}) {
      if (!this.ctx) return;
      if (this.animation) cancelAnimationFrame(this.animation);
      this.animation = null;

      const now = this.ctx.currentTime;
      const stopAt = now + (options.quick ? 0.05 : 0.65);
      this.status = "stopping";
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0.0001, now, options.quick ? 0.04 : 0.18);

      this.voices.forEach((voice) => {
        [voice.osc, voice.orbit, voice.breath].forEach((node) => {
          try { node.stop(stopAt); } catch {}
        });
        [voice.osc, voice.orbit, voice.breath, voice.voiceGain, voice.panner, voice.reverbSend].forEach((node) => {
          try { node.disconnect(); } catch {}
        });
      });

      this.voices = [];
      this.status = "idle";
    }
  }

  window.FlameclyffeAudioAdapter = FlameclyffeAudioAdapter;
  window.FlameclyffeVoiceSourcesFromPatch = voiceSourcesFromPatch;
})();

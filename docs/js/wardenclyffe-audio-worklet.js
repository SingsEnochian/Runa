class WardenclyffeEnvelopeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "rate", defaultValue: 0.369, minValue: 0.01, maxValue: 40, automationRate: "k-rate" },
      { name: "depth", defaultValue: 0.35, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "level", defaultValue: 0.02, minValue: 0, maxValue: 0.2, automationRate: "k-rate" }
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.frameCount = 0;
  }

  process(_inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const left = output[0];
    const right = output[1] || left;
    const rate = parameters.rate[0] || 0.369;
    const depth = parameters.depth[0] || 0.35;
    const level = parameters.level[0] || 0.02;
    const phaseStep = (Math.PI * 2 * rate) / sampleRate;

    for (let i = 0; i < left.length; i += 1) {
      const raw = (Math.sin(this.phase) + 1) * 0.5;
      const eased = raw * raw * (3 - 2 * raw);
      const envelope = 1 - depth + eased * depth;
      const value = (envelope - 0.5) * level;

      left[i] = value;
      if (right !== left) right[i] = value;

      this.phase += phaseStep;
      if (this.phase > Math.PI * 2) this.phase -= Math.PI * 2;
    }

    this.frameCount += left.length;
    if (this.frameCount >= sampleRate / 2) {
      this.frameCount = 0;
      this.port.postMessage({ type: "envelope", phase: this.phase, rate, depth, level });
    }

    return true;
  }
}

registerProcessor("wardenclyffe-envelope-processor", WardenclyffeEnvelopeProcessor);

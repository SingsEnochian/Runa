export class WardenclyffeAudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.activeNodes = [];
  }

  async playScene(scene) {
    this.stopScene();

    const ctx = new AudioContext();
    const master = new GainNode(ctx, { gain: scene.masterGain ?? 0.8 });
    master.connect(ctx.destination);

    const activeNodes = [];

    for (const layer of scene.layers || []) {
      if (!layer.enabled) continue;

      if (layer.kind === 'tone') {
        const oscillator = new OscillatorNode(ctx, {
          type: layer.waveform,
          frequency: layer.frequencyHz,
        });
        const gain = new GainNode(ctx, { gain: layer.gain });
        const panner = new StereoPannerNode(ctx, { pan: layer.offset });
        oscillator.connect(gain);
        gain.connect(panner);
        panner.connect(master);
        const motion = attachMotion(ctx, panner, layer);
        oscillator.start();
        activeNodes.push({
          stop: () => oscillator.stop(),
          disconnect: () => {
            motion?.dispose();
            oscillator.disconnect();
            gain.disconnect();
            panner.disconnect();
          },
        });
      }

      if (layer.kind === 'binaural') {
        const merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 });
        const left = new OscillatorNode(ctx, {
          type: layer.waveform,
          frequency: Math.max(1, layer.carrierHz - layer.beatHz / 2),
        });
        const right = new OscillatorNode(ctx, {
          type: layer.waveform,
          frequency: layer.carrierHz + layer.beatHz / 2,
        });
        const leftGain = new GainNode(ctx, { gain: layer.gain });
        const rightGain = new GainNode(ctx, { gain: layer.gain });
        let motion = null;
        let outputNode = merger;

        left.connect(leftGain);
        right.connect(rightGain);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);

        if (layer.motionEnabled && !layer.safeMotion) {
          const panner = new StereoPannerNode(ctx, { pan: layer.offset });
          merger.connect(panner);
          panner.connect(master);
          outputNode = panner;
          motion = attachMotion(ctx, panner, layer);
        } else {
          merger.connect(master);
        }

        left.start();
        right.start();
        activeNodes.push({
          stop: () => {
            left.stop();
            right.stop();
          },
          disconnect: () => {
            motion?.dispose();
            left.disconnect();
            right.disconnect();
            leftGain.disconnect();
            rightGain.disconnect();
            merger.disconnect();
            if (outputNode !== merger) outputNode.disconnect();
          },
        });
      }
    }

    this.ctx = ctx;
    this.master = master;
    this.activeNodes = activeNodes;
  }

  stopScene() {
    for (const node of this.activeNodes) {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    this.activeNodes = [];
    if (this.master) {
      try { this.master.disconnect(); } catch {}
    }
    if (this.ctx) {
      this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
  }
}

function attachMotion(ctx, panner, layer) {
  if (!layer.motionEnabled || layer.motionDepth <= 0) {
    return null;
  }

  const lfo = new OscillatorNode(ctx, {
    type: 'sine',
    frequency: Math.max(0.01, layer.motionRateHz),
  });
  const depth = new GainNode(ctx, {
    gain: Math.max(0, Math.min(1, layer.motionDepth)),
  });
  lfo.connect(depth);
  depth.connect(panner.pan);
  lfo.start();

  return {
    dispose: () => {
      try { lfo.stop(); } catch {}
      lfo.disconnect();
      depth.disconnect();
    },
  };
}

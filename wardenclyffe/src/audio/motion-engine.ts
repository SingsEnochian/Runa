import type { Layer, MotionConfig } from '../models/layer';

export interface MotionRuntime {
  input: GainNode;
  output: AudioNode;
  dispose: () => void;
  update: (motion: MotionConfig, time?: number) => void;
}

export function buildMotionEngine(ctx: AudioContext, layer: Layer): MotionRuntime {
  const input = new GainNode(ctx, { gain: 1 });
  const panner = new StereoPannerNode(ctx, {
    pan: clampPan(layer.motion.offset),
  });

  input.connect(panner);

  let lfo: OscillatorNode | null = null;
  let lfoDepth: GainNode | null = null;

  const teardownLfo = () => {
    if (lfo) {
      try { lfo.stop(); } catch {}
      lfo.disconnect();
      lfo = null;
    }
    if (lfoDepth) {
      lfoDepth.disconnect();
      lfoDepth = null;
    }
  };

  const applyMotion = (motion: MotionConfig, time = ctx.currentTime) => {
    teardownLfo();
    panner.pan.cancelScheduledValues(time);
    panner.pan.setValueAtTime(clampPan(motion.offset), time);

    if (!motion.enabled || motion.mode === 'static' || motion.depth <= 0) {
      return;
    }

    lfo = new OscillatorNode(ctx, {
      type: motion.mode === 'pulse' ? 'square' : 'sine',
      frequency: Math.max(0.001, motion.rateHz),
    });

    lfoDepth = new GainNode(ctx, {
      gain: clampDepth(motion.depth),
    });

    lfo.connect(lfoDepth);
    lfoDepth.connect(panner.pan);
    lfo.start(time);
  };

  applyMotion(layer.motion);

  return {
    input,
    output: panner,
    update: applyMotion,
    dispose: () => {
      teardownLfo();
      input.disconnect();
      panner.disconnect();
    },
  };
}

function clampPan(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function clampDepth(value: number): number {
  return Math.max(0, Math.min(1, value));
}

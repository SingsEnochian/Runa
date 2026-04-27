import type { Layer } from '../models/layer';
import type { FxBus } from './master-bus';
import { buildGenerator, type GeneratorBuild } from './generator-factory';
import { buildMotionEngine, type MotionRuntime } from './motion-engine';

export interface BuiltLayerGraph {
  output: GainNode;
  update: (layer: Layer, time?: number) => void;
  dispose: () => void;
}

export function buildLayerGraph(
  ctx: AudioContext,
  layer: Layer,
  masterInput: AudioNode,
  fxBus: FxBus,
): BuiltLayerGraph {
  let generator = buildGenerator(ctx, layer);
  let motion = buildMotionEngine(ctx, layer);

  const layerGain = new GainNode(ctx, {
    gain: resolveLayerGain(layer),
  });
  const reverbSend = new GainNode(ctx, {
    gain: layer.mix.reverbSend,
  });
  const delaySend = new GainNode(ctx, {
    gain: layer.mix.delaySend,
  });

  generator.output.connect(motion.input);
  motion.output.connect(layerGain);
  layerGain.connect(masterInput);
  layerGain.connect(reverbSend);
  layerGain.connect(delaySend);
  reverbSend.connect(fxBus.reverb);
  delaySend.connect(fxBus.delay);

  const rebuildGenerator = (next: Layer) => {
    generator.dispose();
    generator = buildGenerator(ctx, next);
    generator.output.connect(motion.input);
  };

  const update = (next: Layer, time = ctx.currentTime) => {
    if (next.source.kind !== layer.source.kind) {
      rebuildGenerator(next);
    }

    motion.update(next.motion, time);

    layerGain.gain.cancelScheduledValues(time);
    layerGain.gain.setValueAtTime(resolveLayerGain(next), time);

    reverbSend.gain.cancelScheduledValues(time);
    reverbSend.gain.setValueAtTime(Math.max(0, next.mix.reverbSend), time);

    delaySend.gain.cancelScheduledValues(time);
    delaySend.gain.setValueAtTime(Math.max(0, next.mix.delaySend), time);
  };

  return {
    output: layerGain,
    update,
    dispose: () => {
      generator.dispose();
      motion.dispose();
      layerGain.disconnect();
      reverbSend.disconnect();
      delaySend.disconnect();
    },
  };
}

function resolveLayerGain(layer: Layer): number {
  if (!layer.enabled || layer.mix.muted) {
    return 0;
  }
  return Math.max(0, layer.mix.gain);
}

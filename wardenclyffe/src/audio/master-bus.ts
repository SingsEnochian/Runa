import type { MasterConfig } from '../models/scene';

export interface FxBus {
  reverb: GainNode;
  delay: GainNode;
}

export interface MasterBus {
  input: GainNode;
  output: GainNode;
  reverbReturn: GainNode;
  delayReturn: GainNode;
  fx: FxBus;
  update: (config: MasterConfig, time?: number) => void;
  dispose: () => void;
}

export function buildMasterBus(
  ctx: AudioContext,
  destination: AudioNode,
  config: MasterConfig,
): MasterBus {
  const input = new GainNode(ctx, { gain: config.masterGain });
  const output = new GainNode(ctx, { gain: 1 });
  const reverb = new GainNode(ctx, { gain: config.reverbAmount });
  const delay = new GainNode(ctx, { gain: 0 });
  const reverbReturn = new GainNode(ctx, { gain: 1 });
  const delayReturn = new GainNode(ctx, { gain: 1 });

  input.connect(output);
  output.connect(destination);

  reverb.connect(reverbReturn);
  delay.connect(delayReturn);
  reverbReturn.connect(output);
  delayReturn.connect(output);

  return {
    input,
    output,
    reverbReturn,
    delayReturn,
    fx: { reverb, delay },
    update: (next, time = ctx.currentTime) => {
      input.gain.cancelScheduledValues(time);
      input.gain.setValueAtTime(Math.max(0, next.masterGain), time);
      reverb.gain.cancelScheduledValues(time);
      reverb.gain.setValueAtTime(Math.max(0, next.reverbAmount), time);
    },
    dispose: () => {
      input.disconnect();
      output.disconnect();
      reverb.disconnect();
      delay.disconnect();
      reverbReturn.disconnect();
      delayReturn.disconnect();
    },
  };
}

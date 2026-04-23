import type {
  BinauralSourceConfig,
  Layer,
  NoiseSourceConfig,
  PulseSourceConfig,
  ToneSourceConfig,
} from '../models/layer';

export interface GeneratorBuild {
  output: AudioNode;
  dispose: () => void;
}

function buildTone(ctx: AudioContext, config: ToneSourceConfig): GeneratorBuild {
  const oscillator = new OscillatorNode(ctx, {
    type: config.waveform,
    frequency: config.frequencyHz,
  });
  const gain = new GainNode(ctx, { gain: 1 });
  oscillator.connect(gain);
  oscillator.start();

  return {
    output: gain,
    dispose: () => {
      try { oscillator.stop(); } catch {}
      oscillator.disconnect();
      gain.disconnect();
    },
  };
}

function buildPulse(ctx: AudioContext, config: PulseSourceConfig): GeneratorBuild {
  const carrier = new OscillatorNode(ctx, {
    type: config.waveform,
    frequency: config.carrierHz,
  });
  const pulseLfo = new OscillatorNode(ctx, {
    type: 'square',
    frequency: config.pulseRateHz,
  });
  const pulseDepth = new GainNode(ctx, { gain: 0.5 });
  const gain = new GainNode(ctx, { gain: 0.5 });

  pulseLfo.connect(pulseDepth);
  pulseDepth.connect(gain.gain);
  carrier.connect(gain);
  carrier.start();
  pulseLfo.start();

  return {
    output: gain,
    dispose: () => {
      try { carrier.stop(); } catch {}
      try { pulseLfo.stop(); } catch {}
      carrier.disconnect();
      pulseLfo.disconnect();
      pulseDepth.disconnect();
      gain.disconnect();
    },
  };
}

function buildNoise(ctx: AudioContext, config: NoiseSourceConfig): GeneratorBuild {
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * 2));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  const source = new AudioBufferSourceNode(ctx, {
    buffer,
    loop: true,
  });

  const filter = new BiquadFilterNode(ctx, {
    type: 'lowpass',
    frequency: config.filterHz ?? 1200,
  });

  source.connect(filter);
  source.start();

  return {
    output: filter,
    dispose: () => {
      try { source.stop(); } catch {}
      source.disconnect();
      filter.disconnect();
    },
  };
}

function buildBinaural(ctx: AudioContext, config: BinauralSourceConfig): GeneratorBuild {
  const merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 });
  const left = new OscillatorNode(ctx, {
    type: config.waveform,
    frequency: Math.max(1, config.carrierHz - config.beatHz / 2),
  });
  const right = new OscillatorNode(ctx, {
    type: config.waveform,
    frequency: config.carrierHz + config.beatHz / 2,
  });
  const leftGain = new GainNode(ctx, { gain: 1 });
  const rightGain = new GainNode(ctx, { gain: 1 });

  left.connect(leftGain);
  right.connect(rightGain);
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  left.start();
  right.start();

  return {
    output: merger,
    dispose: () => {
      try { left.stop(); } catch {}
      try { right.stop(); } catch {}
      left.disconnect();
      right.disconnect();
      leftGain.disconnect();
      rightGain.disconnect();
      merger.disconnect();
    },
  };
}

export function buildGenerator(ctx: AudioContext, layer: Layer): GeneratorBuild {
  switch (layer.source.kind) {
    case 'tone':
      return buildTone(ctx, layer.source);
    case 'pulse':
      return buildPulse(ctx, layer.source);
    case 'noise':
      return buildNoise(ctx, layer.source);
    case 'binaural':
      return buildBinaural(ctx, layer.source);
    default:
      throw new Error(`Generator kind not implemented: ${layer.source.kind}`);
  }
}

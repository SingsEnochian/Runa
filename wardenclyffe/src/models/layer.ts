export type GeneratorKind =
  | 'tone'
  | 'binaural'
  | 'noise'
  | 'pulse'
  | 'drone'
  | 'sample';

export type WaveformKind =
  | 'sine'
  | 'triangle'
  | 'square'
  | 'sawtooth';

export type MotionMode =
  | 'static'
  | 'orbit'
  | 'drift'
  | 'pulse'
  | 'spiral';

export interface ToneSourceConfig {
  kind: 'tone';
  frequencyHz: number;
  waveform: WaveformKind;
}

export interface BinauralSourceConfig {
  kind: 'binaural';
  carrierHz: number;
  beatHz: number;
  waveform: WaveformKind;
  safeMotion: boolean;
}

export interface NoiseSourceConfig {
  kind: 'noise';
  noiseColor: 'white' | 'pink' | 'brown';
  filterHz?: number;
}

export interface PulseSourceConfig {
  kind: 'pulse';
  carrierHz: number;
  pulseRateHz: number;
  waveform: WaveformKind;
}

export interface DroneSourceConfig {
  kind: 'drone';
  rootHz: number;
  partials: number[];
}

export interface SampleSourceConfig {
  kind: 'sample';
  bufferId: string;
  loop: boolean;
  playbackRate: number;
}

export type SourceConfig =
  | ToneSourceConfig
  | BinauralSourceConfig
  | NoiseSourceConfig
  | PulseSourceConfig
  | DroneSourceConfig
  | SampleSourceConfig;

export interface MotionConfig {
  enabled: boolean;
  mode: MotionMode;
  rateHz: number;
  depth: number;
  phaseDeg: number;
  offset: number;
}

export interface MixConfig {
  gain: number;
  muted: boolean;
  solo: boolean;
  reverbSend: number;
  delaySend: number;
}

export interface Layer {
  id: string;
  name: string;
  enabled: boolean;
  color?: string;
  source: SourceConfig;
  motion: MotionConfig;
  mix: MixConfig;
  notes?: string;
  tags?: string[];
}

export function createDefaultMotionConfig(): MotionConfig {
  return {
    enabled: false,
    mode: 'static',
    rateHz: 0.08,
    depth: 0.5,
    phaseDeg: 0,
    offset: 0,
  };
}

export function createDefaultMixConfig(): MixConfig {
  return {
    gain: 0.2,
    muted: false,
    solo: false,
    reverbSend: 0,
    delaySend: 0,
  };
}

export function createToneLayer(name = 'New Tone Layer'): Layer {
  return {
    id: crypto.randomUUID(),
    name,
    enabled: true,
    source: {
      kind: 'tone',
      frequencyHz: 432,
      waveform: 'sine',
    },
    motion: createDefaultMotionConfig(),
    mix: createDefaultMixConfig(),
  };
}

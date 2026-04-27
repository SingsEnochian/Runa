import type { Layer } from './layer';

export interface MasterConfig {
  masterGain: number;
  limiterEnabled: boolean;
  reverbAmount: number;
  outputMode: 'stereo' | 'headphones';
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  layers: Layer[];
  master: MasterConfig;
  theme?: string;
  notes?: string;
}

export function createDefaultMasterConfig(): MasterConfig {
  return {
    masterGain: 0.8,
    limiterEnabled: true,
    reverbAmount: 0.12,
    outputMode: 'headphones',
  };
}

export function createEmptyScene(name = 'Untitled Scene'): Scene {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    layers: [],
    master: createDefaultMasterConfig(),
  };
}

export type SessionType = 'zener' | 'rv' | 'gateway' | 'tone-study';

export interface SessionRecord {
  id: string;
  type: SessionType;
  createdAt: string;
  updatedAt: string;
  sceneId?: string;
  conditionLabel?: string;
  notes?: string;
  metrics?: Record<string, number | string | boolean>;
}

export function createSessionRecord(type: SessionType): SessionRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type,
    createdAt: now,
    updatedAt: now,
  };
}

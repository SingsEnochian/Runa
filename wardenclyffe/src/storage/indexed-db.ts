import type { Scene } from '../models/scene';
import type { SessionRecord } from '../models/session';
import type { Layer } from '../models/layer';

const DB_NAME = 'wardenclyffe';
const DB_VERSION = 1;
const PRESET_STORE = 'layerPresets';
const SCENE_STORE = 'scenes';
const SESSION_STORE = 'sessionRecords';

export class WardenclyffeStore {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PRESET_STORE)) {
          db.createObjectStore(PRESET_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SCENE_STORE)) {
          db.createObjectStore(SCENE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open Wardenclyffe database.'));
    });
  }

  async saveScene(scene: Scene): Promise<void> {
    const db = await this.open();
    await putValue(db, SCENE_STORE, scene);
    db.close();
  }

  async listScenes(): Promise<Scene[]> {
    const db = await this.open();
    const values = await getAllValues<Scene>(db, SCENE_STORE);
    db.close();
    return values;
  }

  async saveLayerPreset(layer: Layer): Promise<void> {
    const db = await this.open();
    await putValue(db, PRESET_STORE, layer);
    db.close();
  }

  async listLayerPresets(): Promise<Layer[]> {
    const db = await this.open();
    const values = await getAllValues<Layer>(db, PRESET_STORE);
    db.close();
    return values;
  }

  async saveSession(record: SessionRecord): Promise<void> {
    const db = await this.open();
    await putValue(db, SESSION_STORE, record);
    db.close();
  }

  async listSessions(): Promise<SessionRecord[]> {
    const db = await this.open();
    const values = await getAllValues<SessionRecord>(db, SESSION_STORE);
    db.close();
    return values;
  }
}

function putValue<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`Failed to write ${storeName}.`));
  });
}

function getAllValues<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve((request.result ?? []) as T[]);
    request.onerror = () => reject(request.error ?? new Error(`Failed to read ${storeName}.`));
  });
}

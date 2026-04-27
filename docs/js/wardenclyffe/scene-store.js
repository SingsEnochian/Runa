const DB_NAME = 'wardenclyffe-prototype';
const DB_VERSION = 1;
const STORE_NAME = 'scenes';

export async function openWardenclyffeDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open Wardenclyffe database.'));
  });
}

export async function saveScene(scene) {
  const db = await openWardenclyffeDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(structuredClone(scene));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save scene.'));
  });
  db.close();
}

export async function listScenes() {
  const db = await openWardenclyffeDb();
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error ?? new Error('Failed to list scenes.'));
  });
  db.close();
  return rows;
}

export async function loadScene(sceneId) {
  const db = await openWardenclyffeDb();
  const row = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(sceneId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error ?? new Error('Failed to load scene.'));
  });
  db.close();
  return row;
}

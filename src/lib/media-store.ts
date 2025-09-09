// Simple IndexedDB media storage for captured/uploaded blobs
// Store: saveBlob -> key; Load: loadBlobUrl -> objectURL; Remove: deleteBlob

const DB_NAME = 'zipplign-media';
const DB_VERSION = 1;
const STORE = 'media';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBlob(kind: 'image' | 'video', blob: Blob): Promise<string> {
  const db = await openDb();
  const key = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.put({ key, kind, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return key;
}

export async function loadBlobUrl(key: string): Promise<{ url: string; kind: 'image' | 'video' } | null> {
  const db = await openDb();
  const record = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!record) return null;
  const url = URL.createObjectURL(record.blob as Blob);
  return { url, kind: record.kind };
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

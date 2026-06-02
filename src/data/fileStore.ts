import type { DB } from './types';
import { idbGet, idbSet } from './idb';

// ===========================================================
// Durable on-disk persistence via the File System Access API (ARCHITECTURE §6).
// Mitigates the #1 risk (browser clears storage → data loss): the real file on
// disk survives storage clears, and the handle is remembered in IndexedDB so we
// can re-open it next session. localStorage remains the always-on autosave mirror.
// Chromium-only; degrades gracefully to Export/Import elsewhere.
// ===========================================================

type AnyHandle = FileSystemFileHandle & {
  queryPermission?: (o: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: string }) => Promise<PermissionState>;
};

let handle: AnyHandle | null = null;

export const supportsFileStore = () => typeof (window as any).showSaveFilePicker === 'function';
export const connectedName = () => handle?.name ?? null;

/** Prompt the user to pick/create a data file, remember it, and write current data. */
export async function connectFile(initial: DB): Promise<string | null> {
  if (!supportsFileStore()) return null;
  const h: AnyHandle = await (window as any).showSaveFilePicker({
    suggestedName: 'PM-Assistant.json',
    types: [{ description: 'PM Assistant data', accept: { 'application/json': ['.json'] } }],
  });
  handle = h;
  await idbSet('dataFile', h);
  await writeFile(initial);
  return h.name;
}

export async function writeFile(db: DB): Promise<void> {
  if (!handle) return;
  try {
    const w = await (handle as any).createWritable();
    await w.write(JSON.stringify(db, null, 2));
    await w.close();
  } catch {
    // permission may have lapsed; localStorage mirror still holds the data.
  }
}

/**
 * On startup: recover the saved handle. If permission is already granted and the
 * file has content, return the parsed DB (authoritative). Otherwise return just
 * the name so the UI can offer a one-click reconnect.
 */
export async function tryRestore(): Promise<{ db: DB | null; name: string | null }> {
  const h = (await idbGet<AnyHandle>('dataFile')) ?? null;
  if (!h) return { db: null, name: null };
  handle = h;
  const perm = (await h.queryPermission?.({ mode: 'readwrite' })) ?? 'prompt';
  if (perm !== 'granted') return { db: null, name: h.name };
  return { db: await readFile(), name: h.name };
}

export async function reconnect(): Promise<DB | null> {
  if (!handle) return null;
  const perm = (await handle.requestPermission?.({ mode: 'readwrite' })) ?? 'denied';
  if (perm !== 'granted') return null;
  return readFile();
}

async function readFile(): Promise<DB | null> {
  if (!handle) return null;
  try {
    const file = await (handle as any).getFile();
    const text = await file.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as DB;
  } catch {
    return null;
  }
}

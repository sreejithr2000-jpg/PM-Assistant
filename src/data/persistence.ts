import type { DB } from './types';
import { buildEmptyDB, DEFAULT_THRESHOLDS, DEFAULT_MEETING_TYPES, DEFAULT_MEETING_MEDIUMS } from '../seed/seed';
import { COACHING } from '../seed/coaching';
import { defaultCeremonies } from '../seed/ceremonies';

// Lightweight migration (ARCHITECTURE §4): backfill fields added after a DB was
// first saved, and refresh the static coaching curriculum to the latest shape.
// Curriculum content is code, not user data, so it's always taken from COACHING;
// only `coachingProgress` (the user's reviewed-resource ticks) is preserved.
export function migrate(db: DB): DB {
  const s = db.settings ?? ({} as DB['settings']);
  return {
    ...db,
    meetings: (db.meetings ?? []).map((m) => ({ ...m, medium: m.medium ?? 'In person' })),
    attendance: db.attendance ?? [],
    coaching: COACHING,
    coachingProgress: db.coachingProgress ?? {},
    ceremonies: db.ceremonies?.length ? db.ceremonies : defaultCeremonies(),
    weeklyReports: db.weeklyReports ?? [],
    settings: {
      ...s,
      thresholds: { ...DEFAULT_THRESHOLDS, ...s.thresholds },
      meetingTypes: s.meetingTypes ?? [...DEFAULT_MEETING_TYPES],
      meetingMediums: s.meetingMediums ?? [...DEFAULT_MEETING_MEDIUMS],
      sprintLengthWeeks: s.sprintLengthWeeks ?? 2,
    },
    schemaVersion: 4,
  };
}

// ===========================================================
// Persistence boundary (ARCHITECTURE §3.4/§3.5).
// The ONLY module that knows how bytes reach disk. Screens/store never see this.
// MVP backend = JSON snapshot in localStorage. The same `Persistence` shape can
// be re-implemented by a SQLite-WASM worker later with zero changes elsewhere.
// ===========================================================

export interface Persistence {
  load(): DB | null;
  save(db: DB): void;
}

const KEY = 'pm-assistant-db-v1';

export const localPersistence: Persistence = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as DB;
    } catch {
      // Per PRD §10: never silently start on an empty DB and overwrite a real one.
      // A parse failure means corruption — surface null so the caller can decide.
      return null;
    }
  },
  save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  },
};

/** First-run hydration: load the snapshot, or start a clean empty DB (setup flow). */
export function hydrate(p: Persistence = localPersistence): DB {
  const existing = p.load();
  if (existing) return migrate(existing);
  const fresh = buildEmptyDB();
  p.save(fresh);
  return fresh;
}

// ---- File System Access: the user-owned ".db-equivalent" JSON file ----------
// Used for one-click export / backup / import (data safety, no cloud net).

export function downloadJSON(db: DB, filename: string): void {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string, mime = 'text/markdown'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSONFile(): Promise<DB | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(String(reader.result)) as DB);
        } catch {
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

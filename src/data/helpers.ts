import type { DB } from './types';

// Pure lookup helpers — no store, no I/O — so the domain layer can use them
// without importing the Zustand store (which would boot localStorage).

export const roleName = (db: DB, roleId: string) =>
  db.roles.find((r) => r.id === roleId)?.name ?? 'Unassigned';

export const memberById = (db: DB, id: string | null) =>
  db.members.find((m) => m.id === id);

export const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

import { useMemo } from 'react';
import { useStore, TODAY } from './store';
import { computeClock } from '../domain/clock';
import { computeFlags } from '../domain/flags';

// Memoized derived selectors (ARCHITECTURE §3.2): recompute only when inputs change.

export function useToday() {
  return TODAY;
}

export function useClock() {
  const project = useStore((s) => s.db.project);
  return useMemo(
    () => computeClock(project.startDate, project.endDate, new Date(TODAY)),
    [project.startDate, project.endDate],
  );
}

export function useFlags() {
  const db = useStore((s) => s.db);
  return useMemo(() => computeFlags(db, TODAY), [
    db.oneOnOnes, db.standups, db.risks, db.actions, db.members, db.leave, db.settings,
  ]);
}

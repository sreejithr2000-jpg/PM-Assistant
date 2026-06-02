import { useMemo } from 'react';
import { useStore, TODAY } from './store';
import { computeClock } from '../domain/clock';
import { computeFlags } from '../domain/flags';
import { mergeCoaching } from '../seed/coaching';

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

/** The base curriculum with the user's editable live sessions woven in. */
export function useCoaching() {
  const coaching = useStore((s) => s.db.coaching);
  const program = useStore((s) => s.db.program);
  return useMemo(() => mergeCoaching(coaching, program), [coaching, program]);
}

export function useFlags() {
  const db = useStore((s) => s.db);
  return useMemo(() => computeFlags(db, TODAY), [
    db.oneOnOnes, db.standups, db.risks, db.actions, db.members, db.leave, db.settings,
  ]);
}

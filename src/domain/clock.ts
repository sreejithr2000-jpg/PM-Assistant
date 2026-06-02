// Derives "Week N of <total>" from the project's start/end dates.
// NOT hardcoded to 11 — if the project length changes, the clock re-maps (PRD §10).

export interface ProjectClock {
  weekNo: number;       // 1-based; clamped to [1, totalWeeks]
  totalWeeks: number;
  elapsedPct: number;   // 0..100
  isComplete: boolean;  // past the end date
  notStarted: boolean;  // no project dates yet
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function computeClock(
  startISO: string | null,
  endISO: string | null,
  now: Date = new Date(),
): ProjectClock {
  if (!startISO || !endISO) {
    return { weekNo: 1, totalWeeks: 11, elapsedPct: 0, isComplete: false, notStarted: true };
  }
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const totalWeeks = Math.max(1, Math.round((end - start) / MS_PER_WEEK));
  const elapsedMs = now.getTime() - start;
  const rawWeek = Math.floor(elapsedMs / MS_PER_WEEK) + 1;
  const weekNo = Math.min(Math.max(rawWeek, 1), totalWeeks);
  const elapsedPct = Math.min(Math.max((elapsedMs / (end - start)) * 100, 0), 100);
  return {
    weekNo,
    totalWeeks,
    elapsedPct,
    isComplete: now.getTime() > end,
    notStarted: now.getTime() < start,
  };
}

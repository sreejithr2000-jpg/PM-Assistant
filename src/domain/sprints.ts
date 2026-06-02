import { addDays, daysBetween } from './dates';

// Derives numbered sprints from the project dates + sprint length. Pure, no I/O.
// Sprints are sequential (Sprint 1, 2, …), each covering a contiguous week range.

export interface Sprint {
  number: number;
  startWeek: number;   // 1-based project week
  endWeek: number;
  startDate: string;
  endDate: string;     // inclusive last day
  status: 'done' | 'current' | 'upcoming';
}

export function computeSprints(
  startISO: string | null,
  endISO: string | null,
  lengthWeeks: number,
  today: string,
): Sprint[] {
  if (!startISO || !endISO) return [];
  const len = Math.max(1, lengthWeeks);
  const totalWeeks = Math.max(1, Math.round(daysBetween(startISO, endISO) / 7));
  const count = Math.ceil(totalWeeks / len);
  const sprints: Sprint[] = [];
  for (let i = 0; i < count; i++) {
    const startWeek = i * len + 1;
    const endWeek = Math.min(totalWeeks, startWeek + len - 1);
    const startDate = addDays(startISO, i * len * 7);
    const endDate = addDays(startISO, endWeek * 7 - 1);
    const status: Sprint['status'] = today > endDate ? 'done' : today < startDate ? 'upcoming' : 'current';
    sprints.push({ number: i + 1, startWeek, endWeek, startDate, endDate, status });
  }
  return sprints;
}

export function currentSprint(sprints: Sprint[]): Sprint | null {
  return sprints.find((s) => s.status === 'current') ?? null;
}

/** Which sprint a given project week falls in (1-based). */
export const sprintNumberForWeek = (weekNo: number, lengthWeeks: number) =>
  Math.max(1, Math.ceil(weekNo / Math.max(1, lengthWeeks)));

/** Total number of sprints for a project of `totalWeeks` weeks. */
export const totalSprints = (totalWeeks: number, lengthWeeks: number) =>
  Math.ceil(totalWeeks / Math.max(1, lengthWeeks));

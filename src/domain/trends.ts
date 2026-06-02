import type { DB } from '../data/types';
import { isWeekend } from './dates';

// Per-person trends + team sentiment pulse (PRD §L1/§M1). Pure, no I/O.

export interface MemberTrends {
  avgMood: number | null;
  moodSeries: { date: string; mood: number }[];
  standupCount: number;
  trackerRate: number;        // 0..1 over their standups
  kudosCount: number;
  blockersRaised: number;
  blockersResolved: number;
  lastStandup: string | null;
}

export function memberTrends(db: DB, memberId: string): MemberTrends {
  const mine = db.standups
    .filter((s) => s.memberId === memberId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const moods = mine.filter((s) => s.mood != null) as { date: string; mood: number }[];
  const trackerEntries = mine.filter((s) => s.trackerUpdated != null);
  const trackerYes = trackerEntries.filter((s) => s.trackerUpdated).length;
  const risks = db.risks.filter((r) => r.ownerId === memberId);
  return {
    avgMood: moods.length ? moods.reduce((a, s) => a + s.mood, 0) / moods.length : null,
    moodSeries: moods.map((s) => ({ date: s.date, mood: s.mood })),
    standupCount: mine.length,
    trackerRate: trackerEntries.length ? trackerYes / trackerEntries.length : 0,
    kudosCount: db.kudos.filter((k) => k.memberId === memberId).length,
    blockersRaised: risks.length,
    blockersResolved: risks.filter((r) => r.status === 'resolved').length,
    lastStandup: mine.length ? mine[mine.length - 1].date : null,
  };
}

export interface WeekMood {
  weekNo: number;
  avg: number | null;
  count: number;
}

/** Team sentiment pulse: average mood per week across all members. */
export function teamSentiment(db: DB, totalWeeks: number): WeekMood[] {
  const out: WeekMood[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const entries = db.standups.filter((s) => s.weekNo === w && s.mood != null && !isWeekend(s.date));
    out.push({
      weekNo: w,
      avg: entries.length ? entries.reduce((a, s) => a + (s.mood ?? 0), 0) / entries.length : null,
      count: entries.length,
    });
  }
  return out;
}

/** Today's standup coverage: who's checked in, pending, or on leave. */
export function standupCoverage(db: DB, today: string) {
  const active = db.members.filter((m) => m.status === 'active');
  const onLeave = (id: string) =>
    db.leave.some((l) => l.memberId === id && l.startDate <= today && today <= l.endDate);
  return active.map((m) => {
    const entry = db.standups.find((s) => s.memberId === m.id && s.date === today);
    return {
      member: m,
      done: !!entry,
      onLeave: onLeave(m.id),
      mood: entry?.mood ?? null,
    };
  });
}

export const MOOD_EMOJI = ['', '😞', '😐', '🙂', '😄', '🤩'];
export const moodEmoji = (m: number | null | undefined) => (m == null ? '–' : MOOD_EMOJI[Math.round(m)] ?? '🙂');

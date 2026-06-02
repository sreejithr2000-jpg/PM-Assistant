import type { DB } from '../data/types';
import { daysBetween, isWeekend, parseISO, workingDaysBetween } from './dates';

// ===========================================================
// Flags engine (PRD §K1) — the "catch the small things" core.
// Pure functions over the in-memory DB. Honors Mon–Fri, no-standup days,
// member leave, and dismissed flags. Each rule emits AT MOST one flag per
// member so a single situation never spams (PRD §10 dedupe/grouping).
// ===========================================================

export type FlagKind = 'one_on_one' | 'quiet' | 'tracker' | 'blocker' | 'action' | 'mood' | 'attendance';

export interface Flag {
  id: string;             // stable id so it can be dismissed (dismissed ≠ deleted)
  kind: FlagKind;
  emoji: string;
  title: string;          // may contain a member name
  subtitle: string;
  age: string;            // e.g. "15d", "4d", "now"
  ageDays: number;        // for sorting (most urgent first)
  memberId: string | null;
  cta: string;            // call-to-action label
  to: string;             // route to act on it
}

function activeMembers(db: DB) {
  return db.members.filter((m) => m.status === 'active');
}

/** Dates to exclude from working-day math: explicit no-standup days + a member's leave. */
function excludedDatesFor(db: DB, memberId: string): Set<string> {
  const out = new Set<string>(db.settings.noStandupDates);
  for (const l of db.leave.filter((x) => x.memberId === memberId)) {
    let cur = l.startDate;
    while (daysBetween(cur, l.endDate) >= 0) {
      out.add(cur);
      cur = new Date(parseISO(cur).getTime() + 86400000).toISOString().slice(0, 10);
    }
  }
  return out;
}

function isOnLeave(db: DB, memberId: string, iso: string): boolean {
  return db.leave.some(
    (l) => l.memberId === memberId && daysBetween(l.startDate, iso) >= 0 && daysBetween(iso, l.endDate) >= 0,
  );
}

export function computeFlags(db: DB, today: string, includeDismissed = false): Flag[] {
  const t = db.settings.thresholds;
  const flags: Flag[] = [];
  const fmtAge = (d: number) => (d <= 0 ? 'now' : `${d}d`);

  // --- 1:1 overdue ----------------------------------------------------------
  for (const m of activeMembers(db)) {
    const last = db.oneOnOnes
      .filter((o) => o.memberId === m.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const baseline = last?.date ?? m.startDate;
    const days = daysBetween(baseline, today);
    if (days > t.oneOnOneOverdueDays) {
      flags.push({
        id: `one_on_one:${m.id}`, kind: 'one_on_one', emoji: '☕',
        title: `Time for a 1:1 with ${m.name}`,
        subtitle: last ? `Last 1:1 was ${days} days ago — overdue` : `No 1:1 logged yet — ${days} days since they started`,
        age: fmtAge(days), ageDays: days, memberId: m.id, cta: 'Schedule →', to: `/team/${m.id}`,
      });
    }
  }

  // --- quiet / no standup ---------------------------------------------------
  for (const m of activeMembers(db)) {
    if (isOnLeave(db, m.id, today)) continue;
    const excluded = excludedDatesFor(db, m.id);
    const last = db.standups
      .filter((s) => s.memberId === m.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const baseline = last?.date ?? m.startDate;
    if (baseline === today) continue;
    const missed = workingDaysBetween(baseline, today, excluded);
    if (missed >= t.quietWorkingDays) {
      flags.push({
        id: `quiet:${m.id}`, kind: 'quiet', emoji: '🤫',
        title: `${m.name} has been quiet`,
        subtitle: `No standup for ${missed} working day${missed > 1 ? 's' : ''}`,
        age: fmtAge(missed), ageDays: missed, memberId: m.id, cta: 'Check in →', to: `/team/${m.id}`,
      });
    }
  }

  // --- tracker not updated --------------------------------------------------
  for (const m of activeMembers(db)) {
    const mine = db.standups
      .filter((s) => s.memberId === m.id && !isWeekend(s.date))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    let run = 0;
    for (const s of mine) {
      if (s.trackerUpdated === false) run++;
      else break;
    }
    if (run >= t.trackerStaleWorkingDays) {
      flags.push({
        id: `tracker:${m.id}`, kind: 'tracker', emoji: '📋',
        title: `${m.name} hasn’t updated the tracker`,
        subtitle: `${run} working days without a tracker update`,
        age: fmtAge(run), ageDays: run, memberId: m.id, cta: 'Nudge →', to: `/team/${m.id}`,
      });
    }
  }

  // --- blocker aging --------------------------------------------------------
  for (const r of db.risks.filter((x) => x.status === 'open')) {
    const age = daysBetween(r.lastMovedDate, today);
    if (age > t.blockerAgingDays) {
      const owner = db.members.find((m) => m.id === r.ownerId);
      flags.push({
        id: `blocker:${r.id}`, kind: 'blocker', emoji: '🧱',
        title: `“${r.description.slice(0, 40)}${r.description.length > 40 ? '…' : ''}” is aging`,
        subtitle: `${owner ? 'Owned by ' + owner.name + ' · ' : ''}no movement in ${age} days`,
        age: fmtAge(age), ageDays: age, memberId: r.ownerId, cta: 'Open →', to: '/project',
      });
    }
  }

  // --- action items overdue / due today (grouped) ---------------------------
  const dueSoon = db.actions.filter(
    (a) => a.status === 'open' && a.dueDate && daysBetween(a.dueDate, today) >= 0,
  );
  if (dueSoon.length > 0) {
    const overdue = dueSoon.filter((a) => a.dueDate! < today).length;
    const worst = Math.max(...dueSoon.map((a) => daysBetween(a.dueDate!, today)));
    flags.push({
      id: 'action:group', kind: 'action', emoji: '✅',
      title: `${dueSoon.length} action item${dueSoon.length > 1 ? 's' : ''} need attention`,
      subtitle: overdue > 0 ? `${overdue} overdue · ${dueSoon.length - overdue} due today` : 'Due today',
      age: fmtAge(worst), ageDays: worst, memberId: null, cta: 'View →', to: '/project',
    });
  }

  // --- meeting attendance (PRD §C3) -----------------------------------------
  const window14 = new Date(parseISO(today).getTime() - 14 * 86400000).toISOString().slice(0, 10);
  for (const m of activeMembers(db)) {
    const recentMeetingIds = new Set(db.meetings.filter((mt) => mt.date >= window14 && mt.date <= today).map((mt) => mt.id));
    const absences = db.attendance.filter((a) => a.memberId === m.id && a.status === 'absent' && recentMeetingIds.has(a.meetingId));
    if (absences.length >= (t.meetingAbsenceCount ?? 2)) {
      flags.push({
        id: `attendance:${m.id}`, kind: 'attendance', emoji: '📅',
        title: `${m.name} has missed meetings`,
        subtitle: `Absent from ${absences.length} meeting${absences.length > 1 ? 's' : ''} in the last 2 weeks`,
        age: `${absences.length}×`, ageDays: absences.length, memberId: m.id, cta: 'Review →', to: '/attendance',
      });
    }
  }

  // --- mood trending low ----------------------------------------------------
  for (const m of activeMembers(db)) {
    const mine = db.standups
      .filter((s) => s.memberId === m.id && s.mood != null && !isWeekend(s.date))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, t.moodLowRunDays);
    if (mine.length >= t.moodLowRunDays && mine.every((s) => (s.mood ?? 5) <= t.moodLowThreshold)) {
      flags.push({
        id: `mood:${m.id}`, kind: 'mood', emoji: '💛',
        title: `${m.name}’s mood has dipped`,
        subtitle: `Low for ${t.moodLowRunDays} standups running — worth checking in`,
        age: fmtAge(t.moodLowRunDays), ageDays: t.moodLowRunDays, memberId: m.id, cta: 'Check in →', to: `/team/${m.id}`,
      });
    }
  }

  // drop dismissed (unless asked to keep them for the snoozed list), most-urgent first
  return flags
    .filter((f) => includeDismissed || !(f.id in db.settings.dismissedFlags))
    .sort((a, b) => b.ageDays - a.ageDays);
}

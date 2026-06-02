import type { DB } from '../data/types';
import { computeFlags } from './flags';

// Best-practice checks engine (feature N2). Each curriculum check id maps to a
// pure predicate over the DB. Surfaced as gentle nudges, not a score.

export interface CheckResult {
  id: string;
  label: string;
  pass: boolean;
}

type Predicate = (db: DB, today: string) => boolean;

const recent = (today: string, days: number) =>
  new Date(new Date(today).getTime() - days * 86400000).toISOString().slice(0, 10);

const PREDICATES: Record<string, Predicate> = {
  goal_defined: (db) => db.project.goal.trim().length > 0,
  metrics_defined: (db) => db.project.successMetrics.trim().length > 0,
  members_have_roles: (db) => db.members.length > 0 && db.members.every((m) => !!m.roleId),
  template_configured: (db) => db.standupQuestions.some((q) => q.enabled),
  first_standup: (db, today) => db.standups.some((s) => s.weekNo === weekOf(db, today)),
  one_on_one_each: (db) => db.members.filter((m) => m.status === 'active').every((m) => db.oneOnOnes.some((o) => o.memberId === m.id)),
  career_goals_recorded: (db) => db.members.filter((m) => m.status === 'active').every((m) => m.careerGoals.trim().length > 0),
  decision_logged: (db) => db.decisions.length > 0,
  no_quiet_flags: (db, today) => !computeFlags(db, today).some((f) => f.kind === 'quiet'),
  milestones_defined: (db) => db.milestones.length > 0 && db.milestones.every((m) => m.weekNo > 0),
  milestones_span: (db) => db.milestones.some((m) => m.weekNo >= 10),
  scope_decisions: (db) => db.decisions.some((d) => d.tags.some((t) => /scope|priorit|problem|dod/i.test(t))),
  risk_register_has_entries: (db) => db.risks.length > 0,
  risks_have_owners: (db) => db.risks.filter((r) => r.status === 'open').every((r) => !!r.ownerId),
  dod_captured: (db) => db.decisions.some((d) => d.tags.includes('DoD') || /definition of done/i.test(d.title)),
  actions_closing: (db) => {
    const due = db.actions.filter((a) => a.dueDate);
    if (!due.length) return true;
    return due.filter((a) => a.status === 'done').length / due.length >= 0.7;
  },
  no_blocker_aging: (db, today) => !computeFlags(db, today).some((f) => f.kind === 'blocker'),
  no_tracker_flags: (db, today) => !computeFlags(db, today).some((f) => f.kind === 'tracker'),
  rag_set: (db) => !!db.project.rag,
  weekly_report: (db, today) => db.weeklyReports.some((r) => r.weekNo === weekOf(db, today)),
  no_one_on_one_overdue: (db, today) => !computeFlags(db, today).some((f) => f.kind === 'one_on_one'),
  feedback_recorded: (db, today) => db.oneOnOnes.some((o) => o.feedback.trim() && o.date >= recent(today, 14)),
  kudos_this_week: (db, today) => db.kudos.some((k) => k.weekNo === weekOf(db, today)),
  scope_decisions_rationale: (db, today) => db.decisions.some((d) => d.rationale.trim() && d.date >= recent(today, 14)),
  milestones_honest: (db, today) => !db.milestones.some((m) => m.status === 'on_track' && m.weekNo < weekOf(db, today)),
  risks_trending_down: (db) => db.risks.filter((r) => r.status === 'open').length <= 2,
  go_no_go: (db) => db.decisions.some((d) => d.tags.includes('go/no-go') || /go\/no-go|go no go/i.test(d.title)),
  no_high_severity: (db) => !db.risks.some((r) => r.status === 'open' && r.severity === 'high'),
  retro_logged: (db) => db.decisions.some((d) => d.tags.includes('retro') || /retro/i.test(d.title)),
  reports_ready: (db) => db.members.filter((m) => m.status === 'active').every((m) => db.standups.some((s) => s.memberId === m.id)),
  final_kudos: (db, today) => db.kudos.some((k) => k.weekNo === weekOf(db, today)),
};

function weekOf(db: DB, today: string): number {
  if (!db.project.startDate) return 1;
  const days = Math.floor((new Date(today).getTime() - new Date(db.project.startDate).getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function evaluateChecks(db: DB, today: string, checks: { id: string; label: string }[]): CheckResult[] {
  return checks.map((c) => ({
    id: c.id,
    label: c.label,
    pass: PREDICATES[c.id] ? PREDICATES[c.id](db, today) : false,
  }));
}

/** Always-on cross-week nudges (curriculum "Cross-Week Habits"). */
export function crossWeekNudges(db: DB, today: string): CheckResult[] {
  return evaluateChecks(db, today, [
    { id: 'no_quiet_flags', label: 'Standups logged on every working day' },
    { id: 'no_one_on_one_overdue', label: 'A 1:1 with each person within 14 days' },
    { id: 'no_blocker_aging', label: 'No blocker aging > 3 days without movement' },
    { id: 'actions_closing', label: 'Action items closed by their due dates' },
    { id: 'kudos_this_week', label: 'Kudos logged regularly' },
  ]);
}

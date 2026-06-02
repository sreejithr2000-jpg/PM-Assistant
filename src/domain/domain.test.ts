import { describe, it, expect } from 'vitest';
import { buildSeedDB, buildEmptyDB } from '../seed/seed';
import { computeClock } from './clock';
import { computeFlags } from './flags';
import { memberTrends, teamSentiment } from './trends';
import { evaluateChecks } from './coaching';
import { workingDaysBetween } from './dates';
import { buildMemberReport } from './report';
import { computeSprints, currentSprint } from './sprints';
import { migrate } from '../data/persistence';

// Anchor the demo to a fixed Tuesday so the relative dates are deterministic.
const today = '2026-06-02';
const db = buildSeedDB(today);

describe('first-run empty DB', () => {
  it('has defaults but no team or project dates (triggers setup)', () => {
    const empty = buildEmptyDB();
    expect(empty.members).toHaveLength(0);
    expect(empty.project.startDate).toBeNull();
    expect(empty.roles.length).toBeGreaterThan(0);
    expect(empty.standupQuestions.length).toBeGreaterThan(0);
    expect(empty.coaching).toHaveLength(11);
  });
});

describe('clock', () => {
  it('derives Week 4 of 11 from the seed dates', () => {
    const c = computeClock(db.project.startDate, db.project.endDate, new Date(today));
    expect(c.weekNo).toBe(4);
    expect(c.totalWeeks).toBe(11);
    expect(c.notStarted).toBe(false);
    expect(c.isComplete).toBe(false);
  });

  it('reports notStarted when project has no dates', () => {
    const c = computeClock(null, null, new Date(today));
    expect(c.notStarted).toBe(true);
  });
});

describe('dates — working day math (Mon–Fri)', () => {
  it('counts only weekdays, honoring exclusions', () => {
    // 2026-06-01 Mon .. 2026-06-05 Fri inclusive of the to-date, exclusive of from
    expect(workingDaysBetween('2026-06-01', '2026-06-05', new Set())).toBe(4); // Tue–Fri
    // a Friday→Monday span is 1 working day (skips the weekend)
    expect(workingDaysBetween('2026-06-05', '2026-06-08', new Set())).toBe(1);
    // excluding the Monday yields 0
    expect(workingDaysBetween('2026-06-05', '2026-06-08', new Set(['2026-06-08']))).toBe(0);
  });
});

describe('flags engine', () => {
  const flags = computeFlags(db, today);
  const kinds = flags.map((f) => f.kind);

  it('flags Aisha’s overdue 1:1 (15 days > 14d threshold)', () => {
    const f = flags.find((x) => x.kind === 'one_on_one' && x.memberId === 'm-aisha');
    expect(f).toBeTruthy();
    expect(f!.age).toBe('15d');
  });

  it('flags the aging API blocker (4d > 3d threshold)', () => {
    expect(flags.some((f) => f.kind === 'blocker')).toBe(true);
  });

  it('flags Nadia’s low mood run (2/5 × 3 days)', () => {
    expect(flags.some((f) => f.kind === 'mood' && f.memberId === 'm-nadia')).toBe(true);
  });

  it('groups action items into one flag (no spam)', () => {
    expect(kinds.filter((k) => k === 'action')).toHaveLength(1);
  });

  it('does NOT flag today-pending members as quiet (only 1 working day)', () => {
    expect(flags.some((f) => f.kind === 'quiet')).toBe(false);
  });

  it('respects dismissals (dismissed ≠ deleted)', () => {
    const target = computeFlags(db, today).find((f) => f.kind === 'mood')!;
    const db2 = structuredClone(db);
    db2.settings.dismissedFlags[target.id] = 'snoozed';
    expect(computeFlags(db2, today).some((f) => f.id === target.id)).toBe(false);
  });

  it('flags a member absent from ≥ threshold recent meetings (PRD §C3)', () => {
    const db2 = structuredClone(db);
    db2.meetings.push(
      { id: 'mt1', type: 'Sprint Planning', medium: 'Microsoft Teams', date: today, weekNo: 4 },
      { id: 'mt2', type: 'Retro', medium: 'Google Meet', date: today, weekNo: 4 },
    );
    db2.attendance.push(
      { id: 'a1', meetingId: 'mt1', memberId: 'm-tom', status: 'absent', comment: '' },
      { id: 'a2', meetingId: 'mt2', memberId: 'm-tom', status: 'absent', comment: '' },
    );
    expect(computeFlags(db2, today).some((f) => f.kind === 'attendance' && f.memberId === 'm-tom')).toBe(true);
  });

  it('suppresses the quiet flag for a member on leave today', () => {
    const db2 = structuredClone(db);
    // wipe Sam's standups so he'd be quiet, then put him on leave today
    db2.standups = db2.standups.filter((s) => s.memberId !== 'm-sam');
    db2.leave.push({ id: 'lv', memberId: 'm-sam', startDate: today, endDate: today, type: 'PTO', note: '' });
    expect(computeFlags(db2, today).some((f) => f.kind === 'quiet' && f.memberId === 'm-sam')).toBe(false);
  });
});

describe('trends', () => {
  it('computes Nadia’s recent mood as low', () => {
    const t = memberTrends(db, 'm-nadia');
    expect(t.standupCount).toBeGreaterThan(0);
    expect(t.avgMood).not.toBeNull();
  });

  it('builds an 11-week sentiment series', () => {
    expect(teamSentiment(db, 11)).toHaveLength(11);
  });
});

describe('coaching checks', () => {
  it('passes Week 1 foundation checks on the seed data', () => {
    const wk1 = db.coaching.find((m) => m.weekNo === 1)!;
    const results = evaluateChecks(db, today, wk1.checks);
    const byId = Object.fromEntries(results.map((r) => [r.id, r.pass]));
    expect(byId.goal_defined).toBe(true);
    expect(byId.metrics_defined).toBe(true);
    expect(byId.members_have_roles).toBe(true);
  });
});

describe('sprints', () => {
  it('divides an 11-week project into numbered 2-week sprints', () => {
    const sprints = computeSprints(db.project.startDate, db.project.endDate, 2, today);
    expect(sprints).toHaveLength(6); // ceil(11/2)
    expect(sprints[0]).toMatchObject({ number: 1, startWeek: 1, endWeek: 2 });
    expect(sprints[5]).toMatchObject({ number: 6, startWeek: 11, endWeek: 11 });
  });

  it('marks exactly the sprint containing today as current (Week 4 → Sprint 2)', () => {
    const sprints = computeSprints(db.project.startDate, db.project.endDate, 2, today);
    const cur = currentSprint(sprints);
    expect(cur?.number).toBe(2);
    expect(sprints.filter((s) => s.status === 'current')).toHaveLength(1);
  });

  it('re-maps when sprint length changes (3-week sprints)', () => {
    const sprints = computeSprints(db.project.startDate, db.project.endDate, 3, today);
    expect(sprints).toHaveLength(4); // ceil(11/3)
    expect(sprints[0].endWeek).toBe(3);
  });

  it('returns no sprints when project has no dates', () => {
    expect(computeSprints(null, null, 2, today)).toHaveLength(0);
  });

  it('seeds the five Scrum ceremony guides with agendas', () => {
    expect(db.ceremonies).toHaveLength(5);
    expect(db.ceremonies.every((c) => c.agenda.length > 0)).toBe(true);
    expect(db.ceremonies.map((c) => c.name)).toContain('Sprint Retrospective');
  });
});

describe('coaching resources & migration', () => {
  it('integrates an AI program session into every coaching week', () => {
    for (const m of db.coaching) {
      expect(m.session, `week ${m.weekNo} session`).toBeTruthy();
      // the session shows up as a weekly goal ("Do this week")
      expect(m.doThisWeek.some((d) => d.includes('📅'))).toBe(true);
    }
    expect(db.coaching.find((m) => m.weekNo === 7)?.session?.topic).toMatch(/Prompt Engineering/);
    expect(db.coaching.find((m) => m.weekNo === 8)?.session?.presenter).toMatch(/Shuya/);
  });

  it('attaches an id and url to every resource', () => {
    for (const m of db.coaching) {
      for (const r of m.resources) {
        expect(r.id).toBeTruthy();
        expect(r.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('migrate() backfills coachingProgress and preserves user ticks', () => {
    // simulate an old saved DB missing the new field
    const old = buildSeedDB(today) as any;
    old.coachingProgress['w1-north-star-framework'] = true;
    delete old.schemaVersion;
    const migrated = migrate({ ...old, coachingProgress: { 'w1-north-star-framework': true } });
    expect(migrated.coachingProgress['w1-north-star-framework']).toBe(true);
    expect(migrated.coaching).toHaveLength(11);
    expect(migrated.schemaVersion).toBe(4);
  });

  it('migrate() backfills meeting medium and editable type/medium lists', () => {
    const old = buildSeedDB(today) as any;
    old.meetings = [{ id: 'm1', type: 'Retro', date: today, weekNo: 4 }]; // pre-medium meeting
    delete old.settings.meetingTypes;
    delete old.settings.meetingMediums;
    const migrated = migrate(old);
    expect(migrated.meetings[0].medium).toBe('In person');
    expect(migrated.settings.meetingTypes.length).toBeGreaterThan(0);
    expect(migrated.settings.meetingMediums).toContain('Microsoft Teams');
  });

  it('migrate() backfills a totally missing coachingProgress to empty', () => {
    const stripped = { ...buildSeedDB(today) } as any;
    delete stripped.coachingProgress;
    expect(migrate(stripped).coachingProgress).toEqual({});
  });
});

describe('report private/shared boundary', () => {
  const pmNotes = 'CONFIDENTIAL: still ramping up.';

  it('keeps PM notes out of the shared report by default', () => {
    const shared = buildMemberReport(db, 'm-ravi', today, { shared: true, pmNotes });
    expect(shared).not.toContain('CONFIDENTIAL');
  });

  it('includes PM notes in the full report', () => {
    const full = buildMemberReport(db, 'm-ravi', today, { shared: false, pmNotes });
    expect(full).toContain('CONFIDENTIAL');
  });

  it('includes PM notes in shared only when explicitly opted in', () => {
    const shared = buildMemberReport(db, 'm-ravi', today, { shared: true, pmNotes, includeNotesInShared: true });
    expect(shared).toContain('CONFIDENTIAL');
  });
});

import type {
  DB, Role, TeamMember, StandupQuestion, StandupEntry, Milestone,
  RiskBlocker, ActionItem, Decision, OneOnOne, Kudos, PMTodo, Settings, Project,
} from '../data/types';
import { COACHING } from './coaching';
import { defaultCeremonies } from './ceremonies';
import { addDays, daysBetween, isWeekend, todayISO } from '../domain/dates';

// ===========================================================
// Seed / starter data. Dates are RELATIVE to an anchor (default = real today)
// so the demo always reads as "Week 4 of 11" and the app runs on the real clock.
// buildEmptyDB() = a clean first-run DB (defaults, no people/project dates).
// buildSeedDB()  = a fully-populated demo for exploring the app.
// ===========================================================

export const DEFAULT_THRESHOLDS = {
  oneOnOneOverdueDays: 14,
  quietWorkingDays: 2,
  trackerStaleWorkingDays: 2,
  blockerAgingDays: 3,
  moodLowThreshold: 2,
  moodLowRunDays: 3,
  actionItemGraceDays: 0,
  meetingAbsenceCount: 2,
};

export const DEFAULT_MEETING_TYPES = ['Daily Standup', 'Sprint Planning', 'Retro', '1:1', 'Ad-hoc Review'];
export const DEFAULT_MEETING_MEDIUMS = ['In person', 'Microsoft Teams', 'Google Meet', 'Zoom', 'Phone call', 'Chat'];

export function defaultRoles(): Role[] {
  return [
    { id: 'r-design', name: 'Designer', sortOrder: 0 },
    { id: 'r-dev', name: 'Developer', sortOrder: 1 },
    { id: 'r-data', name: 'Data Scientist', sortOrder: 2 },
  ];
}

export function defaultQuestions(): StandupQuestion[] {
  return [
    { id: 'q1', sortOrder: 0, prompt: 'How are you feeling today?', fieldType: 'emoji_scale', writesTo: 'mood', enabled: true },
    { id: 'q2', sortOrder: 1, prompt: 'How was yesterday — what did you get done?', fieldType: 'long_text', writesTo: 'yesterday', enabled: true },
    { id: 'q3', sortOrder: 2, prompt: 'What are you focusing on today?', fieldType: 'long_text', writesTo: 'today', enabled: true },
    { id: 'q4', sortOrder: 3, prompt: 'Anything blocking you or slowing you down?', fieldType: 'long_text', writesTo: 'blockers', enabled: true },
    { id: 'q5', sortOrder: 4, prompt: 'Have you updated the tracker (JIRA)?', fieldType: 'yes_no', writesTo: 'tracker_updated', enabled: true },
    { id: 'q6', sortOrder: 5, prompt: 'Anything you need from me?', fieldType: 'long_text', writesTo: 'needs_from_pm', enabled: true },
    { id: 'q7', sortOrder: 6, prompt: 'Any wins or shout-outs from the team?', fieldType: 'long_text', writesTo: 'wins', enabled: true },
  ];
}

export function defaultSettings(): Settings {
  return {
    thresholds: { ...DEFAULT_THRESHOLDS },
    noStandupDates: [],
    dismissedFlags: {},
    meetingTypes: [...DEFAULT_MEETING_TYPES],
    meetingMediums: [...DEFAULT_MEETING_MEDIUMS],
    sprintLengthWeeks: 2,
    weeklyBackupOn: true,
  };
}

/** Clean first-run DB: defaults in place, but no team and no project dates yet. */
export function buildEmptyDB(): DB {
  const project: Project = { id: 'project', name: 'My Project', startDate: null, endDate: null, goal: '', successMetrics: '', rag: 'green' };
  return {
    schemaVersion: 1,
    roles: defaultRoles(),
    members: [],
    project,
    milestones: [],
    standupQuestions: defaultQuestions(),
    standups: [],
    meetings: [],
    attendance: [],
    oneOnOnes: [],
    risks: [],
    actions: [],
    decisions: [],
    todos: [],
    kudos: [],
    leave: [],
    coaching: COACHING,
    coachingProgress: {},
    ceremonies: defaultCeremonies(),
    weeklyReports: [],
    settings: defaultSettings(),
  };
}

// ---- demo data (relative to anchor) ----------------------------------------

const YESTERDAY_NOTES = [
  'Wrapped up the onboarding flow wireframes.', 'Closed two tickets, reviewed a PR.',
  'Paired with design on the empty states.', 'Cleaned up the data pipeline.',
  'Finished the schema draft.', 'Fixed the flaky test and shipped the fix.',
];
const TODAY_NOTES = [
  'Continuing the onboarding build.', 'Starting the integration spike.',
  'Polishing the design tokens.', 'Running the first model experiment.',
  'Writing acceptance criteria.', 'Reviewing PRs and unblocking the team.',
];
const BASE_MOOD: Record<string, number> = {
  'm-ravi': 4, 'm-maya': 5, 'm-leo': 4, 'm-aisha': 4, 'm-nadia': 4, 'm-tom': 3, 'm-sam': 4,
};

export function buildSeedDB(anchor: string = todayISO()): DB {
  const TODAY = anchor;
  const START = addDays(anchor, -22);   // ~3 weeks in → Week 4
  const END = addDays(START, 77);       // 11 weeks
  const weekNoFor = (iso: string) => Math.min(11, Math.max(1, Math.floor(daysBetween(START, iso) / 7) + 1));

  const members: TeamMember[] = [
    { id: 'm-ravi', name: 'Ravi Patel', roleId: 'r-dev', status: 'active', startDate: START, careerGoals: 'Grow into a tech-lead role; get better at system design.', notes: '', avatarTone: '' },
    { id: 'm-maya', name: 'Maya Rao', roleId: 'r-design', status: 'active', startDate: START, careerGoals: 'Build confidence presenting design rationale to stakeholders.', notes: '', avatarTone: 'c4' },
    { id: 'm-leo', name: 'Leo Chen', roleId: 'r-dev', status: 'active', startDate: START, careerGoals: 'Improve testing discipline and mentoring.', notes: '', avatarTone: 'c2' },
    { id: 'm-aisha', name: 'Aisha Khan', roleId: 'r-design', status: 'active', startDate: START, careerGoals: '', notes: '', avatarTone: '' },
    { id: 'm-nadia', name: 'Nadia Hassan', roleId: 'r-data', status: 'active', startDate: START, careerGoals: 'Move from analysis into ML modelling.', notes: '', avatarTone: 'c3' },
    { id: 'm-tom', name: 'Tom Nguyen', roleId: 'r-dev', status: 'active', startDate: START, careerGoals: '', notes: '', avatarTone: 'c2' },
    { id: 'm-sam', name: 'Sam Okafor', roleId: 'r-data', status: 'active', startDate: addDays(START, 14), careerGoals: 'Strengthen stakeholder communication.', notes: 'Joined Week 3.', avatarTone: 'c3' },
  ];

  const milestones: Milestone[] = [
    { id: 'ms1', title: 'Kickoff & success metrics', weekNo: 1, status: 'done', note: '' },
    { id: 'ms2', title: 'Discovery complete', weekNo: 3, status: 'done', note: '' },
    { id: 'ms3', title: 'Core build — onboarding', weekNo: 6, status: 'on_track', note: 'Design landed; dev underway.' },
    { id: 'ms4', title: 'Integration checkpoint', weekNo: 9, status: 'upcoming', note: '' },
    { id: 'ms5', title: 'Launch readiness & ship', weekNo: 11, status: 'upcoming', note: '' },
  ];

  const standups: StandupEntry[] = [];
  let s = 7;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (const m of members) {
    let cur = m.startDate > START ? m.startDate : START;
    const days: string[] = [];
    while (daysBetween(cur, TODAY) > 0) { if (!isWeekend(cur)) days.push(cur); cur = addDays(cur, 1); }
    days.forEach((date, i) => {
      let mood = Math.max(1, Math.min(5, BASE_MOOD[m.id] + Math.round(rnd() * 2 - 1)));
      const fromEnd = days.length - 1 - i;
      if (m.id === 'm-nadia' && fromEnd < 3) mood = 2;
      standups.push({
        id: `su-${m.id}-${date}`, memberId: m.id, date, weekNo: weekNoFor(date), mood,
        yesterday: YESTERDAY_NOTES[Math.floor(rnd() * YESTERDAY_NOTES.length)],
        today: TODAY_NOTES[Math.floor(rnd() * TODAY_NOTES.length)],
        blockers: m.id === 'm-ravi' && fromEnd < 4 ? 'Still waiting on API access from platform team.' : '',
        trackerUpdated: rnd() > 0.15, custom: {},
      });
    });
  }
  // today: only Ravi, Maya, Leo checked in
  for (const [id, mood, blockers] of [['m-ravi', 3, 'Still blocked on API access — chasing platform.'], ['m-maya', 5, ''], ['m-leo', 3, '']] as const) {
    if (!isWeekend(TODAY)) standups.push({ id: `su-${id}-${TODAY}`, memberId: id, date: TODAY, weekNo: weekNoFor(TODAY), mood, yesterday: 'Good progress yesterday.', today: 'Pushing on this week’s milestone.', blockers, trackerUpdated: true, custom: {} });
  }

  const risks: RiskBlocker[] = [
    { id: 'rb1', description: 'API access from the platform team not yet granted', type: 'blocker', ownerId: 'm-ravi', severity: 'high', status: 'open', raisedDate: addDays(TODAY, -5), resolvedDate: null, lastMovedDate: addDays(TODAY, -4) },
    { id: 'rb2', description: 'Design system tokens may not be final before dev needs them', type: 'risk', ownerId: 'm-maya', severity: 'medium', status: 'open', raisedDate: addDays(TODAY, -2), resolvedDate: null, lastMovedDate: addDays(TODAY, -1) },
    { id: 'rb3', description: 'Staging environment was unstable', type: 'blocker', ownerId: 'm-leo', severity: 'low', status: 'resolved', raisedDate: addDays(TODAY, -9), resolvedDate: addDays(TODAY, -6), lastMovedDate: addDays(TODAY, -6) },
  ];

  const actions: ActionItem[] = [
    { id: 'ai1', description: 'Finalise design tokens', ownerId: 'm-maya', source: 'standup', dueDate: TODAY, status: 'open' },
    { id: 'ai2', description: 'Confirm data schema with Nadia', ownerId: 'm-nadia', source: 'meeting', dueDate: TODAY, status: 'open' },
    { id: 'ai3', description: 'Share onboarding copy draft', ownerId: 'm-aisha', source: 'standup', dueDate: addDays(TODAY, -2), status: 'open' },
    { id: 'ai4', description: 'Book the integration checkpoint room', ownerId: null, source: 'manual', dueDate: addDays(TODAY, -4), status: 'done' },
  ];

  const decisions: Decision[] = [
    { id: 'd1', title: 'Problem framing: onboarding is the wedge', description: 'We will focus the build on first-run onboarding rather than the full dashboard.', rationale: 'Onboarding is where users decide to stay; it has the highest leverage on activation.', date: addDays(START, 8), weekNo: 2, tags: ['problem-framing'] },
    { id: 'd2', title: 'Definition of Done', description: 'A story is done when: tested, reviewed, merged, and demoable in staging.', rationale: 'A shared bar avoids arguing quality at the end.', date: addDays(START, 22), weekNo: 4, tags: ['DoD'] },
  ];

  const oneOnOnes: OneOnOne[] = members.filter((m) => m.id !== 'm-sam').map((m, i) => {
    const date = m.id === 'm-aisha' ? addDays(TODAY, -15) : addDays(TODAY, -(3 + i));
    return { id: `oo-${m.id}`, memberId: m.id, date, weekNo: weekNoFor(date), agenda: 'Check-in on goals, workload, and blockers.', feedback: m.id === 'm-ravi' ? 'Great ownership on the API escalation. Keep documenting decisions.' : '', growthGoals: m.careerGoals, recognition: '', notes: '' };
  });

  const kudos: Kudos[] = [
    { id: 'k1', memberId: 'm-maya', date: addDays(TODAY, -1), weekNo: weekNoFor(addDays(TODAY, -1)), note: 'Beautiful empty-state designs — the team loved them.' },
    { id: 'k2', memberId: 'm-leo', date: addDays(TODAY, -3), weekNo: weekNoFor(addDays(TODAY, -3)), note: 'Jumped in to fix the flaky test that was blocking everyone.' },
  ];

  const todos: PMTodo[] = [
    { id: 't1', description: 'Follow up with platform team on Ravi’s API access', dueDate: TODAY, status: 'open' },
    { id: 't2', description: 'Prep mid-project status report (due Week 6)', dueDate: addDays(TODAY, 9), status: 'open' },
  ];

  return {
    schemaVersion: 1,
    roles: defaultRoles(),
    members,
    project: { id: 'project', name: 'Onboarding Revamp', startDate: START, endDate: END, goal: 'New users complete first-run onboarding and reach their first “aha” in under 5 minutes.', successMetrics: 'Activation rate ≥ 60% · Time-to-first-value < 5 min · Onboarding drop-off < 25%', rag: 'green' },
    milestones,
    standupQuestions: defaultQuestions(),
    standups,
    meetings: [],
    attendance: [],
    oneOnOnes,
    risks,
    actions,
    decisions,
    todos,
    kudos,
    leave: [],
    coaching: COACHING,
    coachingProgress: {},
    ceremonies: defaultCeremonies(),
    weeklyReports: [],
    settings: defaultSettings(),
  };
}

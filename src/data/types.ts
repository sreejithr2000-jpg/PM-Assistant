// ===========================================================
// PM Assistant — domain types (the unified data model, PRD §6.3)
// One timeline + a few "item" tables that share a skeleton.
// Every record carries a date + weekNo so trends/reports are cheap queries.
// ===========================================================

export type ID = string;

export type MemberStatus = 'active' | 'inactive' | 'left';
export type MeetingType = 'Daily Standup' | 'Sprint Planning' | 'Retro' | '1:1' | 'Ad-hoc Review';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type ItemStatus = 'open' | 'done' | 'resolved';
export type Severity = 'low' | 'medium' | 'high';
export type RAG = 'green' | 'amber' | 'red';
export type MilestoneStatus = 'on_track' | 'at_risk' | 'done' | 'upcoming';
export type FieldType = 'emoji_scale' | 'yes_no' | 'long_text' | 'choice' | '1-5';

export interface Role {
  id: ID;
  name: string;
  sortOrder: number;
}

export interface TeamMember {
  id: ID;
  name: string;
  roleId: ID;
  status: MemberStatus;
  startDate: string;        // ISO date
  careerGoals: string;
  notes: string;
  /** avatar color class: '', 'c2', 'c3', 'c4' (matches app.css .av variants) */
  avatarTone?: string;
}

export interface Project {
  id: ID;
  name: string;
  startDate: string | null; // ISO
  endDate: string | null;   // ISO
  goal: string;
  successMetrics: string;
  rag: RAG;
}

export interface Milestone {
  id: ID;
  title: string;
  weekNo: number;
  status: MilestoneStatus;
  note: string;
}

export interface StandupQuestion {
  id: ID;
  sortOrder: number;
  prompt: string;
  fieldType: FieldType;
  /** which StandupEntry field this writes to: 'mood' | 'yesterday' | 'today' | 'blockers' | 'tracker_updated' | custom key */
  writesTo: string;
  enabled: boolean;
}

export interface StandupEntry {
  id: ID;
  memberId: ID;
  date: string;             // ISO date (day granularity)
  weekNo: number;
  mood: number | null;      // 1..5, null = skipped
  yesterday: string;
  today: string;
  blockers: string;
  trackerUpdated: boolean | null;
  custom: Record<string, string>;
}

export interface Meeting {
  id: ID;
  type: string;          // editable (settings.meetingTypes) — e.g. Sprint Planning, Retro
  medium: string;        // how it happened — e.g. In person, Teams, Google Meet, Call, Chat
  date: string;
  weekNo: number;
  note?: string;
}

export interface Attendance {
  id: ID;
  meetingId: ID;
  memberId: ID;
  status: AttendanceStatus;
  comment: string;
}

export interface OneOnOne {
  id: ID;
  memberId: ID;
  date: string;
  weekNo: number;
  agenda: string;
  feedback: string;
  growthGoals: string;
  recognition: string;
  notes: string;
}

export interface RiskBlocker {
  id: ID;
  description: string;
  type: 'risk' | 'blocker';
  ownerId: ID | null;
  severity: Severity;
  status: 'open' | 'resolved';
  raisedDate: string;
  resolvedDate: string | null;
  /** ISO datetime of last status/movement, for aging calc */
  lastMovedDate: string;
}

export interface ActionItem {
  id: ID;
  description: string;
  ownerId: ID | null;
  source: string;           // 'standup' | 'meeting' | 'decision' | 'manual'
  dueDate: string | null;
  status: 'open' | 'done';
}

export interface Decision {
  id: ID;
  title: string;
  description: string;
  rationale: string;
  date: string;
  weekNo: number;
  tags: string[];
}

export interface PMTodo {
  id: ID;
  description: string;
  dueDate: string | null;
  status: 'open' | 'done';
}

export interface Kudos {
  id: ID;
  memberId: ID;
  date: string;
  weekNo: number;
  note: string;
}

export interface LeaveEntry {
  id: ID;
  memberId: ID;
  startDate: string;
  endDate: string;
  type: 'PTO' | 'partial' | 'sick';
  note: string;
}

export interface CoachingResource {
  id: string;        // stable id, used as the coachingProgress key
  label: string;
  url: string;
}

export type CeremonyCadence = 'sprint_start' | 'mid_sprint' | 'sprint_end' | 'daily';

/** An editable agenda/script for a Scrum ceremony — the "guide for the meeting". */
export interface CeremonyGuide {
  id: ID;
  name: string;
  emoji: string;
  cadence: CeremonyCadence;
  timebox: string;       // e.g. "~2h per sprint week"
  purpose: string;
  agenda: string[];      // ordered talking points the PM walks through
  enabled: boolean;
}

/** A scheduled live program session attached to a coaching week. */
export interface ProgramSession {
  topic: string;
  when: string;       // human-readable, e.g. "Wed, Jun 3 · 8pm EST"
  presenter: string;
}

export interface CoachingModule {
  weekNo: number;
  topic: string;
  theme: string;
  learn: string[];
  doThisWeek: string[];
  reflection: string;
  resources: CoachingResource[];
  /** optional live session for this week (your team's AI PM program). */
  session?: ProgramSession;
  /** best-practice checks: id + label + the signal it evaluates (evaluated in domain/coaching.ts) */
  checks: { id: string; label: string }[];
}

export interface WeeklyStatusReport {
  id: ID;
  weekNo: number;
  date: string;
  rag: RAG;
  highlights: string;
  risks: string;
  asks: string;
}

/** Editable flag thresholds (PRD §K1 defaults). */
export interface Thresholds {
  oneOnOneOverdueDays: number;
  quietWorkingDays: number;
  trackerStaleWorkingDays: number;
  blockerAgingDays: number;
  moodLowThreshold: number;   // <= this value
  moodLowRunDays: number;     // for N days running
  actionItemGraceDays: number;
  meetingAbsenceCount: number; // absences (in last 14 days) before flagging
}

export interface Settings {
  thresholds: Thresholds;
  /** ISO dates explicitly marked "no standup today" (B4). */
  noStandupDates: string[];
  /** dismissed flag ids -> reason (dedupe/snooze, PRD §10). dismissed ≠ deleted. */
  dismissedFlags: Record<string, string>;
  /** editable meeting types (PRD §C1) and how meetings happened. */
  meetingTypes: string[];
  meetingMediums: string[];
  /** Scrum sprint cadence — how the project weeks divide into numbered sprints. */
  sprintLengthWeeks: number;
  weeklyBackupOn: boolean;
  /** ISO date of last backup export, for the weekly-backup reminder. */
  lastBackupDate?: string;
}

/** The entire in-memory database — serialized as the JSON snapshot. */
export interface DB {
  schemaVersion: number;
  roles: Role[];
  members: TeamMember[];
  project: Project;
  milestones: Milestone[];
  standupQuestions: StandupQuestion[];
  standups: StandupEntry[];
  meetings: Meeting[];
  attendance: Attendance[];
  oneOnOnes: OneOnOne[];
  risks: RiskBlocker[];
  actions: ActionItem[];
  decisions: Decision[];
  todos: PMTodo[];
  kudos: Kudos[];
  leave: LeaveEntry[];
  coaching: CoachingModule[];
  /** resource id -> reviewed. Powers "weekly coaching module reviewed" (PRD §7.2). */
  coachingProgress: Record<string, boolean>;
  /** editable Scrum ceremony guides (Planning, Refinement, Review, Retro). */
  ceremonies: CeremonyGuide[];
  weeklyReports: WeeklyStatusReport[];
  settings: Settings;
}

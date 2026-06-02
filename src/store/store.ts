import { create } from 'zustand';
import type {
  DB, TeamMember, StandupEntry, RiskBlocker, ActionItem, Decision,
  PMTodo, Kudos, LeaveEntry, OneOnOne, Milestone, Project, Settings,
  WeeklyStatusReport, StandupQuestion, Meeting, AttendanceStatus, CeremonyGuide,
  Profile, ProgramWeek,
} from '../data/types';
import { hydrate, localPersistence, migrate } from '../data/persistence';
import { buildSeedDB, buildEmptyDB } from '../seed/seed';
import { todayISO } from '../domain/dates';
import * as fileStore from '../data/fileStore';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

// "Today" = the real wall clock. The seed builds its dates relative to today,
// so the demo always reads as Week 4 while real usage tracks the calendar.
export const TODAY = todayISO();

// debounced persist — many rapid edits (a standup run) collapse to one write.
// Always writes the localStorage mirror; also writes the durable file if connected.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(db: DB) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localPersistence.save(db);
    void fileStore.writeFile(db);
  }, 600);
}

interface StoreState {
  db: DB;
  /** name of the connected durable file, or null. 'reconnect' state = name set but data not loaded. */
  fileName: string | null;
  fileNeedsReconnect: boolean;
  /** apply a pure mutation to the DB and persist */
  mutate: (fn: (db: DB) => void) => void;
  replaceDB: (db: DB) => void;
  loadDemo: () => void;
  startFresh: () => void;
  // durable file persistence
  initPersistence: () => Promise<void>;
  connectFile: () => Promise<void>;
  reconnectFile: () => Promise<void>;

  // profile + live-session program
  updateProfile: (patch: Partial<Profile>) => void;
  updateProgram: (program: ProgramWeek[]) => void;
  // members
  addMember: (m: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, patch: Partial<TeamMember>) => void;
  // roles
  addRole: (name: string) => void;
  updateRole: (id: string, name: string) => void;
  // standups
  saveStandup: (entry: Omit<StandupEntry, 'id'> & { id?: string }) => void;
  // questions
  updateQuestions: (qs: StandupQuestion[]) => void;
  // scrum ceremony guides
  updateCeremonies: (cs: CeremonyGuide[]) => void;
  // items
  addRisk: (r: Omit<RiskBlocker, 'id'>) => void;
  updateRisk: (id: string, patch: Partial<RiskBlocker>) => void;
  addAction: (a: Omit<ActionItem, 'id'>) => void;
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  addDecision: (d: Omit<Decision, 'id'>) => void;
  addTodo: (t: Omit<PMTodo, 'id'>) => void;
  updateTodo: (id: string, patch: Partial<PMTodo>) => void;
  addKudos: (k: Omit<Kudos, 'id'>) => void;
  addLeave: (l: Omit<LeaveEntry, 'id'>) => void;
  removeLeave: (id: string) => void;
  addOneOnOne: (o: Omit<OneOnOne, 'id'>) => void;
  // meetings & attendance
  addMeeting: (m: Omit<Meeting, 'id'>) => string;
  setAttendance: (meetingId: string, memberId: string, status: AttendanceStatus, comment?: string) => void;
  // project
  updateProject: (patch: Partial<Project>) => void;
  addMilestone: (m: Omit<Milestone, 'id'>) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  // reports + settings
  addWeeklyReport: (r: Omit<WeeklyStatusReport, 'id'>) => void;
  toggleResource: (resourceId: string, done?: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  dismissFlag: (flagId: string, reason: string) => void;
  restoreFlag: (flagId: string) => void;
  recordBackup: (iso: string) => void;
  toggleNoStandupDay: (iso: string) => void;
}

export const useStore = create<StoreState>((set, get) => {
  const apply = (fn: (db: DB) => void) =>
    set((s) => {
      const next = structuredClone(s.db);
      fn(next);
      scheduleSave(next);
      return { db: next };
    });

  return {
    db: hydrate(),
    fileName: null,
    fileNeedsReconnect: false,
    mutate: apply,
    replaceDB: (raw) => { const db = migrate(raw); localPersistence.save(db); void fileStore.writeFile(db); set({ db }); },
    loadDemo: () => { const db = buildSeedDB(); localPersistence.save(db); void fileStore.writeFile(db); set({ db }); },
    startFresh: () => { const db = buildEmptyDB(); localPersistence.save(db); void fileStore.writeFile(db); set({ db }); },

    initPersistence: async () => {
      const { db: raw, name } = await fileStore.tryRestore();
      if (name) set({ fileName: name, fileNeedsReconnect: !raw });
      if (raw) { const db = migrate(raw); localPersistence.save(db); set({ db }); }
    },
    connectFile: async () => {
      try {
        const name = await fileStore.connectFile(get().db);
        if (name) set({ fileName: name, fileNeedsReconnect: false });
      } catch { /* user cancelled the picker */ }
    },
    reconnectFile: async () => {
      const raw = await fileStore.reconnect();
      if (raw) { const db = migrate(raw); localPersistence.save(db); set({ db, fileNeedsReconnect: false }); }
      else set({ fileNeedsReconnect: false });
    },

    updateProfile: (patch) => apply((db) => { db.profile = { ...db.profile, ...patch }; }),
    updateProgram: (program) => apply((db) => { db.program = program; }),

    addMember: (m) => apply((db) => { db.members.push({ ...m, id: uid() }); }),
    updateMember: (id, patch) => apply((db) => {
      const i = db.members.findIndex((x) => x.id === id);
      if (i >= 0) db.members[i] = { ...db.members[i], ...patch };
    }),

    addRole: (name) => apply((db) => {
      db.roles.push({ id: uid(), name, sortOrder: db.roles.length });
    }),
    updateRole: (id, name) => apply((db) => {
      const r = db.roles.find((x) => x.id === id);
      if (r) r.name = name;
    }),

    saveStandup: (entry) => apply((db) => {
      const existingId = entry.id ?? db.standups.find((s) => s.memberId === entry.memberId && s.date === entry.date)?.id;
      if (existingId) {
        const i = db.standups.findIndex((s) => s.id === existingId);
        db.standups[i] = { ...db.standups[i], ...entry, id: existingId };
      } else {
        db.standups.push({ ...entry, id: uid() } as StandupEntry);
      }
    }),

    updateQuestions: (qs) => apply((db) => { db.standupQuestions = qs; }),
    updateCeremonies: (cs) => apply((db) => { db.ceremonies = cs; }),

    addRisk: (r) => apply((db) => { db.risks.push({ ...r, id: uid() }); }),
    updateRisk: (id, patch) => apply((db) => {
      const i = db.risks.findIndex((x) => x.id === id);
      if (i >= 0) db.risks[i] = { ...db.risks[i], ...patch };
    }),
    addAction: (a) => apply((db) => { db.actions.push({ ...a, id: uid() }); }),
    updateAction: (id, patch) => apply((db) => {
      const i = db.actions.findIndex((x) => x.id === id);
      if (i >= 0) db.actions[i] = { ...db.actions[i], ...patch };
    }),
    addDecision: (d) => apply((db) => { db.decisions.push({ ...d, id: uid() }); }),
    addTodo: (t) => apply((db) => { db.todos.push({ ...t, id: uid() }); }),
    updateTodo: (id, patch) => apply((db) => {
      const i = db.todos.findIndex((x) => x.id === id);
      if (i >= 0) db.todos[i] = { ...db.todos[i], ...patch };
    }),
    addKudos: (k) => apply((db) => { db.kudos.push({ ...k, id: uid() }); }),
    addLeave: (l) => apply((db) => { db.leave.push({ ...l, id: uid() }); }),
    removeLeave: (id) => apply((db) => { db.leave = db.leave.filter((x) => x.id !== id); }),
    addOneOnOne: (o) => apply((db) => { db.oneOnOnes.push({ ...o, id: uid() }); }),

    addMeeting: (m) => {
      const id = uid();
      apply((db) => { db.meetings.push({ ...m, id }); });
      return id;
    },
    setAttendance: (meetingId, memberId, status, comment = '') => apply((db) => {
      const i = db.attendance.findIndex((a) => a.meetingId === meetingId && a.memberId === memberId);
      if (i >= 0) db.attendance[i] = { ...db.attendance[i], status, comment };
      else db.attendance.push({ id: uid(), meetingId, memberId, status, comment });
    }),

    updateProject: (patch) => apply((db) => { db.project = { ...db.project, ...patch }; }),
    addMilestone: (m) => apply((db) => { db.milestones.push({ ...m, id: uid() }); }),
    updateMilestone: (id, patch) => apply((db) => {
      const i = db.milestones.findIndex((x) => x.id === id);
      if (i >= 0) db.milestones[i] = { ...db.milestones[i], ...patch };
    }),

    addWeeklyReport: (r) => apply((db) => { db.weeklyReports.push({ ...r, id: uid() }); }),
    toggleResource: (resourceId, done) => apply((db) => {
      const next = done ?? !db.coachingProgress[resourceId];
      if (next) db.coachingProgress[resourceId] = true;
      else delete db.coachingProgress[resourceId];
    }),
    updateSettings: (patch) => apply((db) => { db.settings = { ...db.settings, ...patch }; }),
    dismissFlag: (flagId, reason) => apply((db) => { db.settings.dismissedFlags[flagId] = reason; }),
    restoreFlag: (flagId) => apply((db) => { delete db.settings.dismissedFlags[flagId]; }),
    recordBackup: (iso) => apply((db) => { db.settings.lastBackupDate = iso; }),
    toggleNoStandupDay: (iso) => apply((db) => {
      const set = new Set(db.settings.noStandupDates);
      if (set.has(iso)) set.delete(iso); else set.add(iso);
      db.settings.noStandupDates = [...set];
    }),
  };
});

// convenience helpers — re-exported from the pure helpers module so screens can
// keep importing them from the store, while the domain layer imports them directly.
export { roleName, memberById, initials } from '../data/helpers';

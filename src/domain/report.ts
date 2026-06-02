import type { DB } from '../data/types';
import { memberTrends, moodEmoji } from './trends';
import { roleName } from '../data/helpers';
import { shortDate } from './dates';

// Report builder (PRD §L2). Template-filled in MVP (AI-drafted later behind the
// same interface). Enforces the private/shared boundary: PM notes are private by
// default and only appear in the FULL export, never the SHARED one.

export interface ReportOptions {
  /** shared = the version given to the team member (no private PM notes). */
  shared: boolean;
  /** PM's free-text assessment — private by default. */
  pmNotes?: string;
  includeNotesInShared?: boolean;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function buildMemberReport(db: DB, memberId: string, today: string, opts: ReportOptions): string {
  const m = db.members.find((x) => x.id === memberId);
  if (!m) return '# Member not found';
  const t = memberTrends(db, memberId);
  const role = roleName(db, m.roleId);
  const weekNo = Math.max(1, Math.floor((new Date(today).getTime() - new Date(m.startDate).getTime()) / (7 * 86400000)) + 1);

  const kudos = db.kudos.filter((k) => k.memberId === memberId);
  const oneOnOnes = db.oneOnOnes.filter((o) => o.memberId === memberId).sort((a, b) => (a.date < b.date ? 1 : -1));
  const risks = db.risks.filter((r) => r.ownerId === memberId);
  const lines: string[] = [];

  lines.push(`# Developmental Report — ${m.name}`);
  lines.push('');
  lines.push(`**Role:** ${role}  ·  **Period:** through ${shortDate(today)}  ·  **Week ${weekNo} of the project**`);
  lines.push('');
  lines.push(opts.shared ? '_Shared with you as a mirror to reflect on — not a score._' : '_PM copy (full, private)._');
  lines.push('');

  // Summary (template-filled narrative)
  lines.push('## Summary');
  if (t.standupCount === 0) {
    lines.push('_Insufficient data yet — not enough check-ins to summarise. This section will fill out as the weeks go._');
  } else {
    const moodWord = t.avgMood == null ? 'steady' : t.avgMood >= 4 ? 'positive and engaged' : t.avgMood >= 3 ? 'steady' : 'under some strain';
    lines.push(
      `${m.name} has been ${moodWord} over ${t.standupCount} check-ins, keeping the tracker current ${pct(t.trackerRate)} of the time. ` +
        `${t.kudosCount > 0 ? `Recognised ${t.kudosCount} time${t.kudosCount > 1 ? 's' : ''} for standout work. ` : ''}` +
        `${t.blockersRaised > 0 ? `Surfaced ${t.blockersRaised} blocker${t.blockersRaised > 1 ? 's' : ''}, ${t.blockersResolved} now resolved.` : ''}`,
    );
  }
  lines.push('');

  // Engagement & reliability
  lines.push('## Engagement & reliability');
  lines.push(`- Standups logged: **${t.standupCount}**`);
  lines.push(`- Tracker-update rate: **${pct(t.trackerRate)}**`);
  lines.push(`- Last check-in: **${t.lastStandup ? shortDate(t.lastStandup) : '—'}**`);
  lines.push('');

  // Wellbeing
  lines.push('## Wellbeing');
  if (t.avgMood == null) lines.push('- _No mood data yet._');
  else lines.push(`- Average mood: **${t.avgMood.toFixed(1)} / 5** ${moodEmoji(t.avgMood)}`);
  lines.push('');

  // Contributions & wins
  lines.push('## Contributions & wins');
  if (kudos.length === 0) lines.push('- _No kudos logged yet — worth noticing a win this week._');
  else kudos.forEach((k) => lines.push(`- ${shortDate(k.date)} — ${k.note}`));
  lines.push('');

  // Growth
  lines.push('## Growth');
  lines.push(m.careerGoals.trim() ? `- Career/growth goals: ${m.careerGoals}` : '- _Growth goals not captured yet — a question for your next 1:1._');
  const feedback = oneOnOnes.filter((o) => o.feedback.trim());
  if (feedback.length) {
    lines.push('- Feedback given:');
    feedback.forEach((o) => lines.push(`  - ${shortDate(o.date)} — ${o.feedback}`));
  }
  lines.push('');

  // Blockers they hit
  lines.push('## Blockers & risks they hit');
  if (risks.length === 0) lines.push('- _None recorded._');
  else risks.forEach((r) => lines.push(`- ${r.description} — **${r.status}**${r.resolvedDate ? ` (resolved ${shortDate(r.resolvedDate)})` : ''}`));
  lines.push('');

  // PM notes — private by default
  const showNotes = !opts.shared || opts.includeNotesInShared;
  if (showNotes && opts.pmNotes?.trim()) {
    lines.push(opts.shared ? '## Notes' : '## PM notes _(private)_');
    lines.push(opts.pmNotes.trim());
    lines.push('');
  }

  return lines.join('\n');
}

export function buildWeeklyStatus(db: DB, weekNo: number, today: string): string {
  const openRisks = db.risks.filter((r) => r.status === 'open');
  const overdueActions = db.actions.filter((a) => a.status === 'open' && a.dueDate && a.dueDate < today);
  const kudosThisWeek = db.kudos.filter((k) => k.weekNo === weekNo);
  const lines: string[] = [];
  lines.push(`# Weekly Status — Week ${weekNo}`);
  lines.push('');
  lines.push(`**Project:** ${db.project.name}  ·  **RAG:** ${db.project.rag.toUpperCase()}`);
  lines.push('');
  lines.push('## Highlights');
  if (kudosThisWeek.length) kudosThisWeek.forEach((k) => lines.push(`- ${k.note}`));
  else lines.push('- _Add highlights for this week._');
  lines.push('');
  lines.push('## Risks & blockers');
  if (openRisks.length) openRisks.forEach((r) => lines.push(`- [${r.severity}] ${r.description}`));
  else lines.push('- None open.');
  lines.push('');
  lines.push('## Asks');
  if (overdueActions.length) lines.push(`- ${overdueActions.length} action item(s) need attention/escalation.`);
  else lines.push('- _What do you need from above this week?_');
  lines.push('');
  return lines.join('\n');
}

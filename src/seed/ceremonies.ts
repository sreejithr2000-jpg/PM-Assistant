import type { CeremonyGuide } from '../data/types';

// Default Scrum ceremony scripts — the "guide for the meetings". Editable like the
// standup script (the Daily Scrum is run on the Standup screen, person-by-person).
export function defaultCeremonies(): CeremonyGuide[] {
  return [
    {
      id: 'cer-planning',
      name: 'Sprint Planning',
      emoji: '🗓️',
      cadence: 'sprint_start',
      timebox: '~2 hours per sprint week',
      purpose: 'Agree what the team will deliver this sprint, and how. Held on the first day of the sprint.',
      enabled: true,
      agenda: [
        'State the sprint goal in one sentence everyone understands',
        'Review the prioritised backlog — walk the top items',
        'Team pulls work to its real capacity (pull, don’t push)',
        'Clarify acceptance criteria & the Definition of Done for each item',
        'Identify dependencies and risks for this sprint',
        'Confirm everyone leaves knowing their first task',
      ],
    },
    {
      id: 'cer-standup',
      name: 'Daily Scrum (Standup)',
      emoji: '☀️',
      cadence: 'daily',
      timebox: '15 minutes, same time daily',
      purpose: 'Re-plan the next 24 hours and surface blockers. Run it person-by-person on the Standup screen.',
      enabled: true,
      agenda: [
        'Each person: yesterday / today / blockers',
        'Note blockers to resolve right after (not during) standup',
        'Glance at the sprint goal — are we still on track for it?',
        'Keep it to 15 minutes — take deep-dives offline',
      ],
    },
    {
      id: 'cer-refinement',
      name: 'Backlog Refinement',
      emoji: '🔍',
      cadence: 'mid_sprint',
      timebox: '~1 hour, mid-sprint',
      purpose: 'Keep the backlog ready so next sprint’s planning is fast. Held around the middle of the sprint.',
      enabled: true,
      agenda: [
        'Review upcoming backlog items for the next sprint or two',
        'Add detail and acceptance criteria where thin',
        'Estimate / size items the team is unsure about',
        'Split items too big to finish in one sprint',
        'Re-prioritise with the project goal in mind',
      ],
    },
    {
      id: 'cer-review',
      name: 'Sprint Review (Demo)',
      emoji: '🎯',
      cadence: 'sprint_end',
      timebox: '~1 hour, last day of the sprint',
      purpose: 'Inspect the increment with stakeholders and adapt the backlog. Held at the end of the sprint.',
      enabled: true,
      agenda: [
        'Demo completed work against its acceptance criteria',
        'Gather stakeholder feedback live',
        'Review the sprint goal: met / partially met / not met',
        'Update the product backlog from what you heard',
        'Note what’s carrying over to next sprint and why',
      ],
    },
    {
      id: 'cer-retro',
      name: 'Sprint Retrospective',
      emoji: '🔁',
      cadence: 'sprint_end',
      timebox: '~45 minutes, after the review',
      purpose: 'Improve how the team works. Held at the very end of the sprint, team-only and safe.',
      enabled: true,
      agenda: [
        'What went well? (Continue)',
        'What didn’t go well? (Stop)',
        'What should we try next? (Start)',
        'Pick 1–2 concrete improvement actions — no more',
        'Log them as action items / decisions so they actually happen',
      ],
    },
  ];
}

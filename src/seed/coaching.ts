import type { CoachingModule, CoachingResource } from '../data/types';

// Seeded from COACHING_CURRICULUM.md (feature N1). Each week → one module.
// The `checks` ids are evaluated against live data in domain/coaching.ts (feature N2).

type RawModule = Omit<CoachingModule, 'resources'> & { resources: string[] };

// Resources are named free frameworks. We attach a reliable lookup link (a search
// for the named concept) so the PM can open it and have it tracked — without the
// risk of hardcoding a specific article URL that later 404s.
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const toResource = (weekNo: number, label: string): CoachingResource => ({
  id: `w${weekNo}-${slug(label)}`,
  label,
  url: `https://www.google.com/search?q=${encodeURIComponent(label + ' product management')}`,
});

const RAW: RawModule[] = [
  {
    weekNo: 1,
    topic: 'Kickoff & Foundations',
    theme: 'Set the project up so it can succeed. Most projects are won or lost in Week 1 by being vague about the goal.',
    learn: ['Defining success metrics (outputs vs. outcomes; North Star)', 'Working Backwards / PR-FAQ (Amazon)', 'Standup anti-patterns'],
    doThisWeek: ['Add every team member with their role', 'Enter the project: name, dates, goal, success metrics', 'Set up your standup script', 'Run your first standup and hold a kickoff'],
    reflection: 'Can you state your project’s goal in one sentence a non-expert would understand? If not, that’s your first job.',
    resources: ['North Star Framework', 'Amazon Working Backwards / PR-FAQ', 'The Daily Standup (Scrum guide)'],
    checks: [
      { id: 'goal_defined', label: 'Project goal is defined' },
      { id: 'metrics_defined', label: 'At least one success metric defined' },
      { id: 'members_have_roles', label: 'All team members added with a role' },
      { id: 'template_configured', label: 'Standup template configured' },
      { id: 'first_standup', label: 'First standup logged this week' },
    ],
  },
  {
    weekNo: 2,
    topic: 'Discovery & Alignment',
    theme: 'Make sure you’re solving the right problem and that the team feels safe. Align deeply before building.',
    learn: ['Problem framing (JTBD, 5 Whys)', 'Psychological safety (Project Aristotle)', 'The 1:1 & the GROW model'],
    doThisWeek: ['Hold a first 1:1 with every member; record growth goals', 'Capture the problem statement & assumptions as decisions', 'Watch the standup mood signal — learn each person’s normal'],
    reflection: 'For each person, do you know one thing they want to get better at during this project?',
    resources: ['Jobs To Be Done', '5 Whys', 'Google re:Work — Psychological Safety', 'GROW coaching model'],
    checks: [
      { id: 'one_on_one_each', label: 'A 1:1 held with every active member' },
      { id: 'career_goals_recorded', label: 'Career/growth goals recorded for each member' },
      { id: 'decision_logged', label: 'At least one decision logged' },
      { id: 'no_quiet_flags', label: 'Standups running daily (no quiet flags)' },
    ],
  },
  {
    weekNo: 3,
    topic: 'Scope & Prioritization',
    theme: 'Turn discovery into a concrete, prioritized plan. What you choose not to do matters as much as what you do.',
    learn: ['Prioritization (MoSCoW, RICE)', 'MVP thinking', 'User stories & INVEST'],
    doThisWeek: ['Draft milestones across remaining weeks with target dates', 'Write down your explicit Won’t list', 'Confirm each milestone ladders to the goal'],
    reflection: 'What is the one thing this product must do well? If you cut everything else, would that alone be worth shipping?',
    resources: ['MoSCoW method', 'RICE scoring', 'INVEST criteria', 'MVP (Ries)'],
    checks: [
      { id: 'milestones_defined', label: 'Milestones defined with target weeks' },
      { id: 'milestones_span', label: 'Milestones cover through the final week' },
      { id: 'scope_decisions', label: 'Scope/priority decisions captured' },
    ],
  },
  {
    weekNo: 4,
    topic: 'De-risk & Sequence',
    theme: 'Find what could kill the project before it does. Sequence the riskiest unknowns first, not last.',
    learn: ['RAID / risk registers', 'Premortem', 'Definition of Done', 'Cross-functional spikes (dev/design/data)'],
    doThisWeek: ['Run a premortem and populate the risk register', 'Map dependencies between roles', 'Agree a Definition of Done; log it as a decision'],
    reflection: 'What’s the single biggest risk to hitting the final week? Who owns reducing it, and what happens this week to shrink it?',
    resources: ['RAID log', 'Premortem (Gary Klein, HBR)', 'Definition of Done (Scrum)'],
    checks: [
      { id: 'risk_register_has_entries', label: 'Risk register has entries' },
      { id: 'risks_have_owners', label: 'Each open risk has an owner' },
      { id: 'dod_captured', label: 'Definition of Done captured as a decision' },
    ],
  },
  {
    weekNo: 5,
    topic: 'Execution Rhythm',
    theme: 'Protect momentum. Your job shifts from planning to unblocking and keeping the loop closed.',
    learn: ['Servant leadership / unblocking', 'Closing the loop', 'Healthy tracking'],
    doThisWeek: ['Triage action items daily; drive overdue to closure', 'Work the blocker register — every open blocker moves daily', 'Keep tracker-updated rates high'],
    reflection: 'Did you remove at least one obstacle for someone this week? That, not status-collecting, is the job.',
    resources: ['Servant Leadership (Greenleaf)', 'Getting Things Done — open loops'],
    checks: [
      { id: 'actions_closing', label: 'Action items being closed (≥70% of due)' },
      { id: 'no_blocker_aging', label: 'No blocker aging without movement' },
      { id: 'no_tracker_flags', label: 'Tracker-update rate healthy' },
    ],
  },
  {
    weekNo: 6,
    topic: 'Mid-Project Health Check',
    theme: 'Past halfway. Honestly assess both the project and the people — the cheapest moment to course-correct.',
    learn: ['RAG status reporting (honest Amber)', 'Team health signals', 'Managing up'],
    doThisWeek: ['Set an honest project RAG', 'Review sentiment; plan a real conversation for any low-trend person', 'Send your first weekly status report', 'Hold the mid-project 1:1 round'],
    reflection: 'If you had to bet your own money: will you hit the goal? What’s the most honest reason for doubt — and have you told anyone?',
    resources: ['RAG status reporting', 'Radical Candor', 'Managing up basics'],
    checks: [
      { id: 'rag_set', label: 'Project RAG status set' },
      { id: 'weekly_report', label: 'Weekly status report generated this week' },
      { id: 'no_one_on_one_overdue', label: '1:1s current for everyone' },
    ],
  },
  {
    weekNo: 7,
    topic: 'Feedback & Quality',
    theme: 'Quality and people-growth compound when addressed early. Give real feedback now; make quality visible.',
    learn: ['SBI feedback model', 'Recognition', 'Demos / showcases'],
    doThisWeek: ['Give each person one specific (SBI) piece of feedback; log it', 'Record real kudos', 'Run a demo against milestones'],
    reflection: 'Who on the team has done great work that you haven’t acknowledged out loud? Fix that today.',
    resources: ['SBI feedback model (CCL)', 'Radical Candor', 'The art of the demo'],
    checks: [
      { id: 'feedback_recorded', label: 'Feedback recorded in recent 1:1s' },
      { id: 'kudos_this_week', label: 'Kudos being logged this week' },
    ],
  },
  {
    weekNo: 8,
    topic: 'Scope Decisions Under Pressure',
    theme: 'Reality has diverged from the plan. Make clear scope cuts and communicate them without drama.',
    learn: ['Scope-cutting (defend the Must)', 'One-way vs. two-way door decisions', 'Expectation management'],
    doThisWeek: ['Make explicit scope decisions; log each with rationale', 'Update milestones to reality', 'Send a status report naming scope changes'],
    reflection: 'What are you still trying to deliver that you secretly know won’t make it? Decide now.',
    resources: ['One-way vs. two-way doors (Bezos)', 'MVP scope discipline', 'Expectation management'],
    checks: [
      { id: 'scope_decisions_rationale', label: 'Scope decisions logged with rationale' },
      { id: 'milestones_honest', label: 'Milestones updated to reality (no overdue marked on-track)' },
    ],
  },
  {
    weekNo: 9,
    topic: 'Integration & Risk Burn-down',
    theme: 'Pieces must come together. Cross-functional integration is where hidden gaps appear. Drive risks to zero.',
    learn: ['Integration risk', 'Risk burn-down', 'Critical path'],
    doThisWeek: ['Drive an integration checkpoint end-to-end', 'Burn down the risk register — resolve or accept each item', 'Identify and protect the critical path'],
    reflection: 'What hasn’t been tested working together yet? That untested seam is your highest risk into launch.',
    resources: ['Critical Path Method', 'Integration testing concepts', 'Risk burn-down'],
    checks: [
      { id: 'risks_trending_down', label: 'Open risks trending down' },
      { id: 'no_blocker_aging', label: 'No aging blockers near launch' },
    ],
  },
  {
    weekNo: 10,
    topic: 'Launch Readiness',
    theme: 'Get to shippable. Resist new scope; focus on testing, polish, and a clear go/no-go.',
    learn: ['Launch checklists & go/no-go', 'Feature freeze', 'Communication plan'],
    doThisWeek: ['Build a launch checklist mapped to success metrics & DoD', 'Declare a feature freeze', 'Run a go/no-go review; log it', 'Pre-draft the per-person reports'],
    reflection: 'Are you adding things, or finishing things? In Week 10, adding is a warning sign.',
    resources: ['Launch readiness checklist', 'Go/no-go criteria', 'Feature freeze rationale'],
    checks: [
      { id: 'go_no_go', label: 'Go/no-go decision logged' },
      { id: 'no_high_severity', label: 'No critical (high-severity) blocker open' },
    ],
  },
  {
    weekNo: 11,
    topic: 'Launch, Retro & Reflection',
    theme: 'Ship it, then learn from it. Close loops, celebrate, reflect, and deliver the developmental reports.',
    learn: ['Retrospectives (Start/Stop/Continue)', 'Recognition & closure', 'PM self-assessment'],
    doThisWeek: ['Launch against the go/no-go criteria', 'Run a team retrospective; log takeaways', 'Finalize & share per-person reports', 'Celebrate the team; log final kudos', 'Do your own PM self-assessment'],
    reflection: 'Compared to Week 1, what’s the single biggest way you grew as a PM? What one habit will you carry forward?',
    resources: ['Start/Stop/Continue retro', 'The Five Dysfunctions of a Team', 'Writing a personal PM growth review'],
    checks: [
      { id: 'retro_logged', label: 'Retrospective takeaways logged' },
      { id: 'reports_ready', label: 'Every member has an exportable report' },
      { id: 'final_kudos', label: 'Final kudos recorded this week' },
    ],
  },
];

// ── Team AI PM program (live sessions woven into each coaching week) ──────────
interface ProgramWeek { topic: string; when: string; presenter: string; learn: string; do: string; resource: string }
const PROGRAM: Record<number, ProgramWeek> = {
  1: { topic: 'AI 101 & program kick-off', when: 'Wed, Jun 3 · 8pm EST', presenter: 'Dr. Nancy Li',
       learn: 'AI 101 — what ML & LLMs are, and where they actually help a PM',
       do: '📅 Attend the live session: AI 101 & program kick-off (Wed Jun 3, 8pm EST · Dr. Nancy Li)',
       resource: 'AI fundamentals for product managers' },
  2: { topic: 'AI PM life cycle', when: 'Mon, Jun 8 · 8pm EST', presenter: 'Dr. Nancy Li',
       learn: 'The AI product life cycle: data → model → evaluation → launch → monitoring',
       do: '📅 Attend the live session: AI PM life cycle (Mon Jun 8, 8pm EST · Dr. Nancy Li)',
       resource: 'AI product development life cycle' },
  3: { topic: 'AI models and LLMs', when: 'Wed, Jun 17 · 8pm EST', presenter: 'Mentor Mark Walker',
       learn: 'How LLMs work: tokens, context windows, embeddings, temperature',
       do: '📅 Attend the live session: AI models and LLMs (Wed Jun 17, 8pm EST · Mentor Mark Walker)',
       resource: 'how large language models work' },
  4: { topic: 'Advanced AI', when: 'Mon, Jun 22 · 8pm EST', presenter: 'Mentor Mark Walker',
       learn: 'Advanced AI for PMs: RAG vs fine-tuning, evals, guardrails & hallucination risk',
       do: '📅 Attend the live session: Advanced AI (Mon Jun 22, 8pm EST · Mentor Mark)',
       resource: 'RAG vs fine-tuning for AI products' },
  5: { topic: 'Cross-functional team collaboration', when: 'Mon, Jun 29 · 8pm EST', presenter: 'Dr. Nancy Li & Mentor Mark',
       learn: 'Leading cross-functional AI teams — data scientists, ML engineers, design & eng',
       do: '📅 Attend the live session: Cross-functional team collaboration (Mon Jun 29, 8pm EST · Dr. Nancy & Mentor Mark)',
       resource: 'cross-functional collaboration for AI product teams' },
  6: { topic: 'Go-to-market strategy', when: 'Mon, Jul 6 · 8pm EST', presenter: 'Dr. Nancy Li',
       learn: 'Go-to-market & positioning for an AI product',
       do: '📅 Attend the live session: Go-to-market strategy (Mon Jul 6, 8pm EST · Dr. Nancy Li)',
       resource: 'go-to-market strategy for AI products' },
  7: { topic: 'Advanced Prompt Engineering', when: 'Mon, Jul 13 · 8pm EST', presenter: 'Mentor Mark Walker',
       learn: 'Advanced prompt engineering: patterns, few-shot, chaining, and prompt evaluation',
       do: '📅 Attend the live session: Advanced Prompt Engineering (Mon Jul 13, 8pm EST · Mentor Mark)',
       resource: 'advanced prompt engineering guide' },
  8: { topic: 'Prototyping & Building with Vibe Coding', when: 'Mon, Jul 20 · 8pm EST', presenter: 'Mentor Shuya Zong',
       learn: 'Rapid AI prototyping ("vibe coding") to validate product ideas fast',
       do: '📅 Attend the live session: Prototyping & Building with Vibe Coding (Mon Jul 20, 8pm EST · Mentor Shuya Zong)',
       resource: 'AI prototyping and vibe coding' },
  9: { topic: 'AI Product Portfolio Development', when: 'Mon, Jul 27 · 8pm EST', presenter: 'Dr. Nancy Li',
       learn: 'Building an AI PM portfolio: case studies that show product judgment',
       do: '📅 Attend the live session: AI Product Portfolio Development (Mon Jul 27, 8pm EST · Dr. Nancy Li)',
       resource: 'AI product manager portfolio examples' },
  10: { topic: 'PM interview questions & answers', when: 'Mon, Aug 3 · 8pm EST', presenter: 'Dr. Nancy Li',
       learn: 'PM interview prep: product sense, AI case studies, behavioral (STAR)',
       do: '📅 Attend the live session: PM interview Q&A (Mon Aug 3, 8pm EST · Dr. Nancy Li)',
       resource: 'product manager interview questions' },
  11: { topic: '1:1 Resume Review', when: 'On-demand from Mon, Aug 10', presenter: 'Dr. Nancy Li (1:1)',
       learn: 'PM resume: framing impact with metrics; tailoring for AI PM roles',
       do: '📅 Book your 1:1 resume review (on-demand from Mon Aug 10 · Dr. Nancy Li)',
       resource: 'product manager resume tips' },
};

export const COACHING: CoachingModule[] = RAW.map((m) => {
  const p = PROGRAM[m.weekNo];
  return {
    ...m,
    session: p ? { topic: p.topic, when: p.when, presenter: p.presenter } : undefined,
    learn: p ? [...m.learn, p.learn] : m.learn,
    doThisWeek: p ? [p.do, ...m.doThisWeek] : m.doThisWeek,
    resources: [...m.resources, ...(p ? [p.resource] : [])].map((label) => toResource(m.weekNo, label)),
  };
});

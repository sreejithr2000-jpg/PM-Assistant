# PM Assistant

A personal **PM operating system + coach** — a single-user, local-first, $0 web app that helps a first-time Product Manager lead a small cross-functional team through an 11-week product build. It complements JIRA/Confluence: those track *the work*; PM Assistant handles the softer, easily-missed layer of *being a good PM* — running consistent standups, closing the loop on commitments, surfacing what's slipping, and coaching the PM to grow week by week.

> Pure-browser, installable PWA. No backend, no accounts, no cloud — your data never leaves your machine.

## Features

- **Home** — daily roll-up: Week N of M · Sprint X of Y, standup checklist, today's flags, blockers, actions due, sentiment, milestones.
- **Standup** — run mode, person-by-person, with inline *promote-to-blocker / create-action / log-kudos*.
- **Team** — roster, editable roles, per-person timeline, mood trend, 1:1s, kudos, leave, status (active/inactive/left).
- **Meetings & attendance** — editable types + medium (Teams/Meet/Zoom/Call/Chat), present/late/absent, feeds flags.
- **Flags engine** — deterministic "catch the small things" rules (overdue 1:1, quiet, tracker stale, blocker aging, action overdue, mood dip, meeting absence), Mon–Fri / leave / no-standup aware, snooze-with-reason.
- **Coaching** — 11-week PM curriculum with best-practice checks auto-evaluated against your data, trackable resource links, and embedded live program sessions.
- **Sprints & Scrum guide** — numbered sprints derived from the project clock + editable ceremony scripts (Planning, Daily Scrum, Refinement, Review, Retro).
- **Project** — goal, success metrics, RAG, milestones, risks, decisions, PM to-dos, weekly status report.
- **Insights** — dense per-person analytics + team sentiment.
- **Reports** — per-person developmental reports with a private/shared boundary, Markdown + print-to-PDF.
- **Search**, **Settings**, durable file storage, backups.

## Tech

React 18 · Vite · TypeScript · Zustand · hand-written CSS · Vitest. In-memory store with a swappable persistence layer (localStorage mirror + File System Access durable file), pure/testable domain logic (flags, trends, coaching checks, report builder), and schema migrations.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run preview    # serve the build (also :5173)
npm test           # Vitest domain tests
```

On Windows you can also double-click **`Launch PM Assistant.cmd`** (see [`LAUNCH.md`](./LAUNCH.md)), or install it from Chrome as a desktop PWA.

## Docs

- [`PRD.md`](./PRD.md) — product requirements
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architecture & build plan
- [`COACHING_CURRICULUM.md`](./COACHING_CURRICULUM.md) · [`STANDUP_TEMPLATE.md`](./STANDUP_TEMPLATE.md) — seed content
- [`LAUNCH.md`](./LAUNCH.md) — opening it from your desktop

---

Local-first and private by construction: there is no server and no analytics. Built at $0.

# PM Assistant

A **PM operating system + coach** — a local-first web app that helps a Product Manager lead a small cross-functional team through an 11-week product build. It complements JIRA/Confluence: those track *the work*; PM Assistant handles the softer, easily-missed layer of *being a good PM* — running consistent standups, closing the loop on commitments, surfacing what's slipping, and coaching you to grow week by week.

> Pure-browser, installable PWA. No backend, no accounts, no cloud — your data never leaves your machine.

**▶ Use it now: https://sreejithr2000-jpg.github.io/PM-Assistant/** — nothing to install. Open the link, enter your name, and you're set. In Chrome or Edge you can also click the install icon in the address bar to keep it as a desktop app.

## Features

- **Home** — daily roll-up: Week N of M · Sprint X of Y, standup checklist, today's flags, blockers, actions due, sentiment, milestones.
- **Standup** — run mode, person-by-person, with inline *promote-to-blocker / create-action / log-kudos*.
- **Team** — roster, editable roles, per-person timeline, mood trend, 1:1s, kudos, leave, status (active/inactive/left).
- **Meetings & attendance** — editable types + medium (Teams/Meet/Zoom/Call/Chat), present/late/absent, feeds flags.
- **Flags engine** — deterministic "catch the small things" rules (overdue 1:1, quiet, tracker stale, blocker aging, action overdue, mood dip, meeting absence), Mon–Fri / leave / no-standup aware, snooze-with-reason.
- **Coaching** — 11-week PM curriculum with best-practice checks auto-evaluated against your data and trackable resource links. Optionally pin your own live sessions (classes, mentor calls) to specific weeks from **Settings → Live program sessions**.
- **Sprints & Scrum guide** — numbered sprints derived from the project clock + editable ceremony scripts (Planning, Daily Scrum, Refinement, Review, Retro).
- **Project** — goal, success metrics, RAG, milestones, risks, decisions, PM to-dos, weekly status report.
- **Insights** — dense per-person analytics + team sentiment.
- **Reports** — per-person developmental reports with a private/shared boundary, Markdown + print-to-PDF.
- **Search**, **Settings**, durable file storage, backups.

## Getting started

The easiest way to use PM Assistant is the hosted version above — no setup at all.

To run it locally (for development, or to keep everything fully offline) you'll need [Node.js](https://nodejs.org) 18 or newer. Then:

```bash
npm install
npm run dev        # open the URL it prints (http://localhost:5173 by default)
```

On **first run** you'll be asked for your **name** and your project — no account, no login. Everything you enter stays on this computer.

You get the full **11-week PM curriculum** out of the box. If your project has live sessions, classes, or mentor calls tied to specific weeks, add them from **Settings → Live program sessions** and they'll show up in the matching Coaching week.

Your data autosaves in the browser, and you can bind it to a real file on disk (**Settings → Data & backups → Connect file**) so it survives a browser-storage clear. Use **Export / Import** to keep backups or move your data between machines.

On Windows you can also double-click **`Launch PM Assistant.cmd`** (see [`LAUNCH.md`](./LAUNCH.md)), or install it from Chrome/Edge as a desktop app.

### Other commands

```bash
npm run build      # production build
npm run preview    # serve the production build locally
npm test           # run the test suite
```

## Tech

React 18 · Vite · TypeScript · Zustand · hand-written CSS · Vitest. In-memory store with a swappable persistence layer (localStorage mirror + File System Access durable file), pure/testable domain logic (flags, trends, coaching checks, report builder), and schema migrations.

## Docs

- [`PRD.md`](./PRD.md) — product requirements
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architecture & build plan
- [`COACHING_CURRICULUM.md`](./COACHING_CURRICULUM.md) · [`STANDUP_TEMPLATE.md`](./STANDUP_TEMPLATE.md) — seed content
- [`LAUNCH.md`](./LAUNCH.md) — opening it from your desktop

## License

[MIT](./LICENSE) — free to use, modify, and share.

---

Local-first and private by design: there is no server and no analytics.

# PM Assistant — Architecture & Implementation Plan

| | |
|---|---|
| **Companion to** | `PRD.md` (requirements), `COACHING_CURRICULUM.md`, `STANDUP_TEMPLATE.md`, `prototype/` (UI) |
| **Status** | Draft v1.0 |
| **Date** | 2026-06-01 |
| **Guiding constraints** | **$0**, **performance-first**, **single-user**, **local & private**, **least tech fuss** |

---

## 1. Architecture at a Glance

PM Assistant is a **pure-browser, installable Progressive Web App (PWA)**. There is **no backend server**. The whole application — UI, logic, and database — runs inside Chrome on the user's machine. Data is stored in a **real local `.db` file** the user owns, via the **File System Access API**.

```
┌──────────────────────────────────────────────────────────────┐
│  Chrome (installed PWA — runs offline)                         │
│                                                                │
│   ┌──────────────┐     ┌────────────────────────────────┐     │
│   │  UI LAYER     │     │  DOMAIN LAYER (pure TS)          │    │
│   │  React+Vite   │◄───►│  • Flags engine                  │    │
│   │  6 screens    │     │  • Trend / sentiment calculators │    │
│   │  (warm theme) │     │  • Report builder (templates)    │    │
│   └──────┬───────┘     │  • Coaching best-practice checks │    │
│          │             │  • CoachProvider (interface)     │    │
│          ▼             └────────────────────────────────┘     │
│   ┌──────────────┐                                             │
│   │ STATE STORE   │  in-memory, hydrated once at startup        │
│   │ (Zustand)     │  → every read is instant                    │
│   └──────┬───────┘                                             │
│          │ mutations                                            │
│          ▼                                                      │
│   ┌──────────────┐   postMessage    ┌───────────────────────┐  │
│   │ REPOSITORY    │ ───────────────► │  WEB WORKER            │  │
│   │ (typed CRUD)  │ ◄─────────────── │  SQLite-WASM           │  │
│   └──────────────┘                  │  (off the UI thread)   │  │
│                                     └──────────┬────────────┘  │
│                                                │ debounced      │
│                                                ▼  autosave       │
│                              ┌─────────────────────────────┐   │
│                              │ File System Access API       │   │
│                              │  → PM-Assistant.db (on disk) │   │
│                              │ OPFS snapshot (crash safety) │   │
│                              └─────────────────────────────┘   │
│                                                                │
│   (Phase 2) CoachProvider → fetch localhost:11434 (Ollama)     │
└──────────────────────────────────────────────────────────────┘
        ▲ app shell served once as static files (free host) → cached by service worker
        ▼ NO user data ever leaves this machine
```

**Why this shape:** with a tiny dataset (<10 people × 11 weeks ≈ a few thousand rows, <1 MB), the fastest and simplest design is to **load everything into memory** and treat SQLite purely as durable storage. No server means no network latency, no process to run, and far fewer moving parts.

---

## 2. The Stack

| Concern | Choice | Why (simple + fast + $0) |
|---|---|---|
| **Packaging** | **Installable PWA** (Web App Manifest + service worker) | Double-click app icon, opens offline, no terminal. |
| **Hosting** | Static files on a **free host** (Cloudflare Pages / GitHub Pages / Netlify) | $0. Serves only *code*; data stays local. Needed for a "secure context" so storage APIs work. |
| **Language** | **TypeScript** | Type safety catches errors before runtime; pairs with the typed data model. |
| **UI framework** | **React 18 + Vite** | Huge ecosystem & support; Vite gives instant dev + tiny optimized builds. *(Svelte is a leaner alt — swappable at scaffold time; React chosen for maintainability.)* |
| **Styling** | **Hand-written CSS + CSS variables** (port `prototype/app.css`) | No CSS framework = tiny bundle, full control, already designed. |
| **State** | **Zustand** (tiny store) | Minimal boilerplate; in-memory data + derived selectors. No React Query needed — there's no server to fetch from. |
| **Database** | **SQLite-WASM** (`@sqlite.org/sqlite-wasm`) in a **Web Worker** | Real SQL, runs off the UI thread so saves never jank. |
| **Persistence** | **File System Access API** → user-owned `.db` file; **OPFS** snapshot as crash-safety mirror | Durable, portable, backup-able real file — the best part of "desktop" without a desktop app. |
| **Charts** | **Hand-rolled SVG/CSS** (as in the prototype) | Mood/sentiment sparklines need no library; keeps bundle small. |
| **PDF export** | **Browser print-to-PDF** via a print stylesheet (`window.print()`) | $0, no dependency. Markdown export = generated string → file download. |
| **AI (Phase 2)** | **Ollama** at `localhost:11434`, behind `CoachProvider` | Local, free, private. MVP uses `RuleBasedCoach`; no AI dependency. |
| **Testing** | **Vitest** for domain logic (flags, trends, reports) | The logic is pure functions — cheap and high-value to unit test. |

**Dependency budget:** intentionally tiny — React, Zustand, the SQLite-WASM package, Vite + a PWA plugin. Every dependency is a bundle-size and startup-time cost, so we keep the list short.

---

## 3. Layered Design

### 3.1 UI layer (`src/screens`, `src/components`)
The six screens from the prototype, as React components: **Home, Team, Insights, Coaching, Project, Standup**, plus **Reports** and **Settings**. Components read from the store via selectors and call repository actions on user input. The warm `app.css` becomes the global stylesheet + per-component styles.

### 3.2 State store (`src/store`)
A single **Zustand** store hydrated once at startup from SQLite. Holds all entities in memory. Mutations update the store *and* enqueue a persist to the worker. **Derived data (flags, trends, the "Week N of 11" cursor) are computed by memoized selectors** so they only recompute when inputs change — this keeps re-renders cheap.

### 3.3 Domain layer (`src/domain`) — pure, testable, no I/O
- **`flags.ts`** — the rules engine (1:1 overdue, quiet, tracker stale, blocker aging, action overdue, mood low). Pure functions over the in-memory data; honors Mon–Fri, `no_standup_dates`, and leave.
- **`trends.ts`** — per-person mood/attendance/tracker rates; team sentiment pulse.
- **`coaching.ts`** — evaluates the curriculum's best-practice checks against data (feature N2).
- **`report.ts`** — builds per-person developmental reports & weekly status reports from templates; respects the **private/shared** boundary.
- **`coachProvider.ts`** — the swappable interface; `RuleBasedCoach` now, `LocalLLMCoach` later.
- **`clock.ts`** — derives `Week N of 11` from project dates (not hardcoded to 11).

### 3.4 Repository layer (`src/data`)
Typed CRUD functions (`addStandup`, `listTimeline(memberId)`, `upsertRisk`, …) that translate to SQL and talk to the worker via a thin RPC. This is the *only* layer that knows SQL exists — screens and domain logic never see it.

### 3.5 Persistence (`src/data/worker`)
- SQLite-WASM runs in a **Web Worker**. The main thread sends SQL/params and gets rows back via `postMessage`.
- **Save strategy:** keep the DB image in memory in the worker; on mutation, **debounce ~1.5 s**, then serialize and write the bytes to the user's `.db` file (File System Access API) **and** an OPFS snapshot.
- **Load strategy:** on startup, reopen the saved file handle (remembered in IndexedDB with a persisted permission grant), read bytes into the in-memory SQLite DB, hydrate the store. If no file/permission, fall back to the OPFS snapshot, else first-run setup.

---

## 4. Data Model (SQLite)

Mirrors `PRD.md` §6.3 — **one timeline + a few shared "item" tables**. Even at this scale we add indexes for cleanliness and to keep selectors trivial.

```sql
-- core
team_member(id PK, name, role_id FK, status, start_date, career_goals, notes)
role(id PK, name, sort_order)
project(id PK, name, start_date, end_date, goal, success_metrics)
milestone(id PK, project_id FK, title, week_no, status)

-- the daily ritual + meetings
standup_template_question(id PK, sort_order, prompt, field_type, enabled)
standup_entry(id PK, member_id FK, date, week_no, mood, yesterday, today,
              blockers, tracker_updated, custom_json)
meeting(id PK, type, date, week_no)
attendance(id PK, meeting_id FK, member_id FK, status, comment)
one_on_one(id PK, member_id FK, date, agenda, feedback, growth_goals,
           recognition, notes)

-- shared "item" tables (owner + date + status + week_no)
risk_blocker(id PK, description, type, owner_id FK, severity, status,
             raised_date, resolved_date)
action_item(id PK, description, owner_id FK, source, due_date, status)
decision(id PK, title, description, rationale, date, week_no)
pm_todo(id PK, description, due_date, status)
kudos(id PK, member_id FK, date, note)
leave_entry(id PK, member_id FK, start_date, end_date, type, note)

-- coaching + reporting + settings
coaching_module(id PK, week_no, topic, body, best_practices_json, resources_json)
weekly_status_report(id PK, week_no, rag, highlights, risks, asks)
app_setting(key PK, value)          -- thresholds, working days, no_standup_dates

-- indexes
CREATE INDEX ix_standup_member_date ON standup_entry(member_id, date);
CREATE INDEX ix_attendance_member   ON attendance(member_id);
CREATE INDEX ix_item_owner_status   ON risk_blocker(owner_id, status);
```

**Migrations:** a simple `schema_version` row in `app_setting` + an ordered list of migration functions run at startup. No migration framework needed.

---

## 5. Performance Plan (the explicit priority)

| Technique | Effect |
|---|---|
| **Load entire DB into an in-memory store at startup** | All reads are synchronous, microsecond-scale. No query latency, ever. |
| **SQLite in a Web Worker** | Serialization & disk writes never block the UI thread → no jank. |
| **Debounced autosave (~1.5 s)** | Many rapid edits (a standup run) = one write, not dozens. |
| **Memoized selectors for flags/trends** | Derived data recomputes only when its inputs change. |
| **Route-level code-splitting (Vite lazy imports)** | Small initial payload; screens load on demand. After first visit, the **service worker serves everything from cache** → instant cold start, offline. |
| **Tiny dependency budget** | Small bundle → fast parse/boot. |
| **No network at runtime** | Zero round-trips; the single biggest latency source is simply absent. |

**Targets (from PRD §7):** cold start < 2 s, navigation < 150 ms, save < 100 ms perceived, report generation < 1 s, flags < 200 ms. At this data scale, these are comfortable.

---

## 6. Data Safety & Backup (no cloud net)

- **Primary store = a real `.db` file** at **`D:\PM-Assistant\PM-Assistant.db`** (a dedicated data folder, kept separate from the app's source in `D:\Cursor Projects\PM Assistant`). Chosen on first run via the file picker; durable across browser-data clears; you can copy it anywhere.
- **OPFS snapshot** mirrors every autosave for crash recovery if the file handle is temporarily unavailable.
- **One-click exports:** copy the `.db`, plus **JSON** and **Markdown** dumps.
- **Weekly auto-backup (ON by default):** a timestamped copy (e.g., `PM-Assistant-2026-06-08.db`) into **`D:\PM-Assistant\backups\`**, keeping the last ~8–10 snapshots and auto-pruning older ones.
- **Guardrails:** confirm + offer export before destructive actions (deleting a member); never start on a silently empty DB and overwrite a real one (per PRD §10).

---

## 7. Security & Privacy posture

Security is explicitly out of scope per the PRD (single local user), but the architecture is **private by construction**: there is no server and no analytics, so **no data leaves the machine**. The static host only ever serves code. Phase-2 Ollama also runs locally. The one sensitive surface is the **shared vs. private report boundary** (PRD §10) — enforced in `report.ts`, with distinct "full" and "shared" export paths so PM notes never leak.

---

## 8. Implementation Plan (build sequence)

> Sequenced so the app is **usable early** and the **data model + Home** land first (everything hangs off them). This is the build order for the *tool*, independent of the team's 11-week project.

**Phase 0 — Scaffold (foundation)**
- Vite + React + TS project; PWA manifest + service worker; port `app.css`.
- SQLite-WASM Web Worker bootstrap; repository RPC; File System Access persistence + OPFS fallback; schema + migrations; Zustand store + hydration.
- Routing for the 8 screens (empty shells).

**Phase 1 — Core loop (most value, fastest)**
- Roster + editable roles; project setup + `Week N/11` clock.
- Standup template (seed from `STANDUP_TEMPLATE.md`) + **run mode** writing to the timeline.
- **Flags engine v1** + **Home** dashboard (roll-up, checklist, flags).

**Phase 2 — Team & meetings**
- Per-person timeline, attendance (all meeting types), 1:1 substance, trends + sentiment.

**Phase 3 — The "items" (close the loop)**
- Action items, risks/blockers, decisions, PM to-do, kudos, leave — plus the **inline actions** from standup (promote-to-blocker, create action, log kudos).

**Phase 4 — Coaching, Project, Insights**
- Seed `coaching_module` from `COACHING_CURRICULUM.md`; **best-practice checks engine (N2)**.
- Project goals/milestones/RAG; the dense **Insights** analytics screen.

**Phase 5 — Reports**
- Per-person developmental report (private/shared toggle) + weekly status report; **Markdown + print-to-PDF** export.

**Phase 6 — Polish & safety**
- Settings (edit roles, standup script, thresholds, working days, "no standup today"); backups/exports; PWA hardening; Vitest coverage on domain logic.

**Phase 7 — AI (later, optional, $0)**
- `LocalLLMCoach` calling Ollama behind `CoachProvider`: AI-drafted reports, personalized coaching, trend summaries. Always falls back to the rule/template path.

---

## 9. Proposed Folder Structure

```
pm-assistant/
├─ public/                 # manifest.json, icons, service worker
├─ src/
│  ├─ screens/             # Home, Team, Insights, Coaching, Project, Standup, Reports, Settings
│  ├─ components/          # cards, pills, flags, avatars, charts (SVG)
│  ├─ store/               # Zustand store + selectors (flags, trends, clock)
│  ├─ domain/              # flags.ts, trends.ts, coaching.ts, report.ts, clock.ts, coachProvider.ts
│  ├─ data/                # repository.ts, types.ts
│  │  └─ worker/           # sqlite.worker.ts, migrations.ts, persistence.ts
│  ├─ seed/                # coaching curriculum + default standup script
│  └─ styles/              # app.css (warm theme)
└─ tests/                  # vitest — domain logic
```

---

## 10. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Browser clears storage** → data loss | Primary store is a **real file on disk** (not browser-only) + auto-backups. |
| **File System Access API limited to Chromium** | We standardized on Chrome (user's browser); OPFS fallback covers edge cases. |
| **Losing the file handle / permission between sessions** | Persist the handle in IndexedDB; re-request permission on launch; OPFS snapshot as backstop. |
| **UI jank during big saves** | SQLite in a Web Worker + debounced autosave. |
| **Scope creep delaying a usable app** | Phased plan delivers the core loop (Phase 1) before everything else. |
| **AI integration flakiness** | Out of MVP; behind a swappable interface that always degrades to rules/templates. |

---

## 11. Resolved Decisions (was: Open Questions)
| # | Decision | Resolution |
|---|---|---|
| 1 | **Data file location** | **`D:\PM-Assistant\PM-Assistant.db`** — a dedicated new folder on the D: drive, kept separate from the app source. Suggested as the default in the first-run file picker. |
| 2 | **Weekly auto-backup** | **ON by default** — timestamped copies into `D:\PM-Assistant\backups\`, last ~8–10 kept, older auto-pruned. |
| 3 | **PWA icon** | The warm **rounded peach "blob" with a "PM" monogram** on cream. Exported at 192×192 and 512×512 PNG plus a **maskable** variant (padded for squircle/circle cropping). |

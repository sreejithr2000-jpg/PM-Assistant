# Product Requirements Document — **PM Assistant**

| | |
|---|---|
| **Product** | PM Assistant — a personal PM operating system & coach |
| **Author** | Sreejith R (Product Manager) |
| **Status** | Draft v1.0 |
| **Date** | 2026-06-01 |
| **Type** | Single-user, local-first web application |
| **Build budget** | **$0** (no paid services in MVP) |

---

## 1. Overview & Vision

PM Assistant is a **single-user, local-first web app** for a **first-time Product Manager** leading a small (<10 person) cross-functional team — designers, developers, and data scientists — through an **11-week product build**.

It is **not** a replacement for JIRA, Confluence, or doc control. Those handle the *work artifacts*. PM Assistant handles the **softer, easily-missed layer of being a good PM**: knowing your people, running consistent standups, closing the loop on commitments, surfacing what's slipping, and — uniquely — **coaching the PM to grow week-by-week** alongside the project.

> **One-line vision:** *A warm, personal assistant that helps a new PM lead their team consistently, catch the small things, and become a better PM over an 11-week project.*

### Three product surfaces (+ a daily Home)
1. **Team** — people, attendance, standups, 1:1s, trends, per-person reports.
2. **Coaching** — week-by-week PM curriculum, best-practice checks, self-development nudges.
3. **Project** — the 11-week plan: goals, success metrics, milestones, RAG status.
4. **Home** *(daily landing)* — "Today = Week N of 11," standup checklist, today's flags, who's still pending.

---

## 2. Problem Statement

**Who:** A first-time PM with no prior PM experience, suddenly leading a serious 11-week product build with a small cross-functional team.

**The problem:**
- As a new PM, I don't yet have the **instincts or habits** that experienced PMs rely on — so I miss the small, easily-forgotten things (skipped 1:1s, dropped action items, aging blockers, a quiet team member) that quietly derail teams and timelines.
- Existing tools (JIRA, docs) track **the work**, but nothing helps me **know my team as people**, run **consistent standups**, **close the loop** on commitments, or tell me **whether I'm doing a good job as a PM**.
- I have no structured way to **develop as a PM** during the very project where I most need those skills.
- At the end, I'll need **per-person reports** and **status updates**, but the underlying information is scattered across my head, chats, and notes.

**Consequence if unsolved:** Inconsistent leadership, missed commitments, late discovery of risks, a team that feels unseen, a stalled 11-week timeline, and a PM who finishes the project no better than they started.

**Why now:** The 11-week clock is the forcing function. Habits and structure must exist from Week 1, or the project is over before the learning lands.

---

## 3. Goals & Non-Goals

### Goals
- **G1 — Consistency:** Make it effortless to run a structured daily standup and track attendance across all meeting types.
- **G2 — Catch the small things:** Surface easily-missed items (overdue 1:1s, aging blockers, dropped action items, quiet/absent members, un-updated trackers) via automatic flags.
- **G3 — Close the loop:** Track commitments, decisions, and risks from creation to resolution.
- **G4 — Know the team:** Build a per-person picture over time (mood, engagement, growth, recognition) that produces review-grade reports.
- **G5 — Grow the PM:** Coach the user week-by-week with curated best practices tied to where the project is.
- **G6 — Hit the goal:** Keep the 11-week project goal and milestones visible with honest RAG status.

### Non-Goals (explicitly out of scope)
- **Not** a replacement for JIRA / issue trackers / doc control.
- **Not** multi-user. No team logins, no member-facing views, no permissions model.
- **Not** a hosted SaaS. No accounts, no cloud database, no scalability concerns.
- **Not** focused on security/compliance (single local user, accepted by owner).
- **Not** live-integrated with JIRA in MVP (manual "tracker updated? Y/N" field instead).

---

## 4. Target User & Context

| Attribute | Detail |
|---|---|
| **Primary (only) user** | The PM — Sreejith |
| **People tracked** | <10 team members: designers, developers, data scientists; possibly leads/other roles later |
| **Roles** | **Editable data, not hardcoded** — user creates/renames/reorders roles in settings |
| **Usage pattern** | Daily, especially morning (standup) and end-of-day (wrap-up); weekly (reports, coaching) |
| **Environment** | Runs locally on the user's own machine; data stays local |

---

## 5. Scope of MVP

The MVP is **AI-free** and runs at **$0**. All "smart" behavior (trends, flags, reports, coaching) is delivered via **deterministic rules + a curated knowledge base**. AI is a deliberate Phase 2 enhancement behind a swappable interface.

### 5.1 MVP Feature List

#### A. Team & People
- **A1. Team roster** — add/edit/deactivate members; name, editable role, status (active/inactive/left), start date, notes.
- **A2. Editable roles** — manage the list of roles in settings.
- **A3. Per-person timeline** — a single chronological view of everything tied to a person (standups, attendance, 1:1s, action items, kudos, notes).

#### B. Daily Standup (the core ritual)
- **B1. Editable standup script/template** — an ordered list of questions the PM edits/reorders/adds to (e.g., "How are you feeling today?", "How was yesterday?", "Team updates?", "Updated the tracker?"). **Default questions drafted in [`STANDUP_TEMPLATE.md`](./STANDUP_TEMPLATE.md)** — seeds the `StandupTemplateQuestion` table. Includes structured fields:
  - **Mood/energy** — **emoji scale (😞 😐 🙂 😄 🤩) stored as 1–5 underneath** (warm on screen, clean number for trends)
  - **Yesterday recap** (free text)
  - **Today's plan** (free text)
  - **Blockers** (free text → can be promoted to a Risk/Blocker, see E)
  - **Tracker updated?** (Yes/No — the manual JIRA stand-in)
  - Any custom questions the PM adds
- **B2. Run-the-standup mode** — PM goes person-by-person; the app shows the script and saves each entry, date-stamped and tagged with `Week N of 11`.
- **B3. Today's standup checklist** — who's been checked in with vs. still pending (on Home).
- **B4. "No standup today" button** — one tap marks the current date as a non-standup day (holiday, off-site, etc.); stored as a `no_standup_date` so missed-standup/quiet flags **and** trend/report calculations all ignore that day. Replaces a maintained holiday list with a manual-when-it-matters override.

#### C. Meetings & Attendance
- **C1. Meeting types** — Daily Standup, Sprint Planning, Retro, 1:1, Ad-hoc Review (types editable).
- **C2. Attendance** — per person per meeting: **Present / Absent / Late + comments**.
- **C3. Attendance feeds flags** (e.g., "X missed 3 standups this week") and per-person reports.

#### D. 1:1s (substance, not just attendance)
- **D1. 1:1 record per person** — date, agenda, feedback given, the person's **career/growth goals**, recognition noted, free-text notes.
- **D2. 1:1 cadence flag** — surfaces when a 1:1 with someone is overdue (configurable, default 14 days).

#### E. Risks & Blockers (RAID-lite)
- **E1. Register** — list of risks/blockers: description, type, owner, severity, status (open/resolved), raised date, resolved date.
- **E2. Aging** — open items accrue age; old items get flagged.
- **E3. Promote from standup** — a blocker mentioned in standup can become a tracked item in one click.

#### F. Action Items / Follow-ups
- **F1. Action item tracker** — description, owner, source (standup/meeting/decision), due date, status (open/done).
- **F2. Overdue flag** — open items past due surface on Home.

#### G. Decision Log
- **G1. Decisions** — title, description, **rationale (the "why")**, date, `Week N of 11`. Searchable.

#### H. Personal PM To-Do
- **H1. PM's own task list** — reminders separate from the team's work, with due dates and done state. ("Follow up with design on X.")

#### I. Recognition / Kudos Log *(feature #12)*
- **I1. Kudos entries** — per person: date + note of a small win or recognition. Feeds reports and morale.

#### J. Capacity / Leave Tracker *(feature #8)*
- **J1. Leave/availability** — per person: date range, type (PTO/partial/sick), note. Contextualizes "absent" in attendance and informs planning.

#### K. Flags & Daily Roll-up (the "catch the small things" engine)
- **K1. Flags engine** — deterministic rules over all the above. **Work week = Mon–Fri**; `no_standup_date` days (B4) and members on leave (J1) are excluded so flags never fire falsely. All thresholds are **editable in settings**; starting defaults:
  - **1:1 overdue** — > **14 days** since last 1:1 with a person
  - **Quiet / no standup** — no standup for **2 working days**
  - **Tracker not updated** — **2 working days**
  - **Blocker aging** — open **> 3 days** with no status change
  - **Action item overdue** — open past its due date (items with no due date are never flagged)
  - **Mood trending low** — **≤ 2/5 for 3 days running**
- **K2. Daily roll-up (Home)** — Week N of 11, standup pending list, today's flags, open blockers, overdue action items.

#### L. Trends & Per-Person Reports
- **L1. Per-person trends** — mood over time, attendance rate, tracker-update rate, blockers raised/resolved, kudos.
- **L2. Per-person report** — accumulates weekly; **exportable (Markdown + PDF)**. Audience is **both the PM (to lead better) and the team member (to learn about themselves)** — so the tone is a **constructive, growth-oriented "developmental mirror,"** not a score/surveillance document. MVP = **template-filled** from data (not AI-generated). Default section structure:
  - **Header** — name, role, period covered, Week N of 11
  - **Summary** — 2–3 line narrative (template-filled in MVP, AI-drafted later)
  - **Engagement & reliability** — attendance rate, standup consistency, tracker-update rate (framed constructively)
  - **Wellbeing** — mood trend + sentiment notes
  - **Contributions & wins** — from kudos + standup highlights
  - **Growth** — career/growth goals from 1:1s + feedback given
  - **Blockers/risks they hit** — and how they were resolved
  - **PM notes** — free-text assessment, **private by default** with an explicit *"include in shared report?"* toggle (see §10) so raw reflections never accidentally merge into the version shared with the person.

#### M. Team Sentiment Pulse *(feature #10)*
- **M1. Aggregate morale trend** — roll per-person mood into a team-health line over the 11 weeks.

#### N. Coaching (curated, no AI in MVP)
- **N1. Week-by-week PM curriculum** — a curated knowledge base mapped to `Week N of 11` (e.g., W1 "set standup cadence & define success metrics," W9 "scope-cut & launch readiness"). **Content drafted in [`COACHING_CURRICULUM.md`](./COACHING_CURRICULUM.md)** — seeds the `CoachingModule` table; its "best-practice checks" are the spec for N2.
- **N2. Best-practice checks** — a checklist the app evaluates against your data (e.g., "Have you defined success metrics? Are 1:1s happening? Is there a risk register?") and nudges where you're falling short.
- **N3. Self-development nudges** — periodic prompts: a topic to learn, a habit to reinforce.

#### O. Project (11-week) Tracking
- **O1. Project setup** — name, start/end dates, **goal**, **success metrics** (entered when the build starts).
- **O2. Milestones** — milestone per week/phase with status; on-track / at-risk / done.
- **O3. RAG status** — overall project Red/Amber/Green, driven by milestones + open risks.

#### P. Weekly Status Report *(feature #6)*
- **P1. Weekly RAG report** — generated weekly summary for managing up: RAG + highlights + risks + asks. **Exportable.** Template-filled in MVP.

### 5.2 Out of MVP (later phases)
- **Phase 1.5:** Stakeholder map (feature #7); deeper project goals/OKRs (feature #9 beyond basic success metrics).
- **Phase 2 (AI add-on, free/local model):** AI-generated coaching, AI-summarized trends, AI-drafted per-person & status reports, AI-suggested standup questions, proactive PM-development suggestions.
- **Later / nice-to-have:** meeting agenda+notes templates (#11), end-of-project retro + PM self-assessment (#13), context/knowledge scratchpad (#14), live JIRA integration.

---

## 6. Technical Considerations

### 6.1 Architecture principles
- **Local-first, single-user.** Everything runs on the user's machine; data persists locally. No auth, no network dependency to function.
- **$0 to build and run.** No paid services in MVP. No cloud DB, no hosting.
- **Performance is the explicit priority.** Target near-instant interactions (see §7). With a single user and <10 people, the dataset is tiny — performance comes free if we avoid over-engineering.
- **Time-series from day one.** Every record is stamped with `date` and `week_of_11` and attributed to a person/project. Trends and reports are then cheap queries, not special cases.
- **Capabilities behind swappable interfaces.** A single `CoachProvider` / `ReportProvider` interface is implemented by `RuleBasedCoach` + `TemplateReporter` in MVP; later swapped for `LocalLLMCoach` / `LLMReporter` with **no changes elsewhere**. This is what makes "AI later" a config change, not a rewrite.

### 6.2 Recommended stack *(user may override)*
- **Data store:** **SQLite** (single local file) — zero-config, fast, easy to back up (it's one file).
- **Backend:** lightweight local server (e.g., **Python + FastAPI** or **Node + Fastify**) serving a local API.
- **Frontend:** built later with the **frontend-design skill** (see §8). React/Vite-class SPA, light theme.
- **Export:** Markdown natively; PDF via a local renderer (e.g., print-to-PDF or a local HTML→PDF lib) — no paid service.
- **AI (Phase 2):** **Local-first via Ollama** (keeps personal feedback on-device — important now that reports are shared with people), with a **free-tier API** (e.g., Gemini/Groq) as optional fallback — both behind the `CoachProvider` interface. Keeps $0.

### 6.3 Unified data model (conceptual)
The whole app is essentially **one timeline + a few "item" tables that share a skeleton**:

```
TeamMember(id, name, role_id, status, start_date, career_goals, notes)
Role(id, name, order)                      # editable
Project(id, name, start_date, end_date, goal, success_metrics)
Milestone(id, project_id, title, week_no, status)           # on_track/at_risk/done

# Shared "timeline event" skeleton: { owner(person/project), date, week_of_11, type, status, payload }
StandupEntry(id, member_id, date, week_no, mood, yesterday, today, blockers, tracker_updated, custom{})
Meeting(id, type, date, week_no)
Attendance(id, meeting_id, member_id, status[present/absent/late], comment)
OneOnOne(id, member_id, date, agenda, feedback, growth_goals, recognition, notes)
RiskBlocker(id, description, type, owner_id, severity, status, raised_date, resolved_date)
ActionItem(id, description, owner_id, source, due_date, status)
Decision(id, title, description, rationale, date, week_no)
PMTodo(id, description, due_date, status)
Kudos(id, member_id, date, note)
LeaveEntry(id, member_id, start_date, end_date, type, note)
CoachingModule(id, week_no, topic, best_practices[], resources[])   # curated KB content
StandupTemplateQuestion(id, order, prompt, field_type)              # editable script
WeeklyStatusReport(id, week_no, rag, highlights, risks, asks)
```

- **Flags engine** = a set of pure functions over the above (no stored state needed; computed on load).
- **Reports** = queries over a member's timeline rendered into a template.

### 6.4 Backup & data safety
- One-click **export/backup** of the SQLite file (and a Markdown dump). Since there's no cloud, local backup is the only safety net — make it trivial.

### 6.5 Resolved contradiction (for the record)
- Original brief said *"no budget limit"*; user later clarified **$0 budget**. **$0 governs.** This is why MVP is AI-free and AI uses free/local models only.

---

## 7. Success Metrics

### 7.1 Technical success metrics (performance-first, per the brief)
| Metric | Target |
|---|---|
| App cold start (local) | < 2 s |
| Page/section navigation | < 150 ms (feels instant) |
| Save a standup/attendance entry | < 100 ms perceived |
| Generate a per-person report | < 1 s |
| Compute Home flags & roll-up | < 200 ms |
| Data integrity | 0 lost entries; every write durably persisted to SQLite |
| Backup/export | < 3 s for full dataset |

### 7.2 Product success metrics (is it making me a better PM?)
| Metric | Target / signal |
|---|---|
| Standup consistency | ≥ 90% of working days have standups logged for all active members |
| 1:1 cadence | 0 members with an overdue 1:1 flag standing > 1 week |
| Loop closure | ≥ 80% of action items closed by their due date |
| Risk hygiene | No blocker open > 5 days without status change |
| Coaching engagement | Weekly coaching module reviewed each of the 11 weeks |
| Report readiness | A per-person report can be exported for every member at end of period with no manual backfill |
| Project outcome | 11-week goal met; milestones tracked to Green by target dates |

---

## 8. UI / UX Style Preferences

- **Theme:** **Light mode** (MVP). Clean, bright.
- **Aesthetic:** **Apple-clean + Notion-structured + warm/friendly.** Generous whitespace, rounded friendly cards, soft accent color, human/encouraging copy (it's a *personal assistant*, not a dashboard SaaS).
- **Density resolution:** **Home is dashboard-dense** (stats, flags, roll-up at a glance); **working screens are calm** (focused, low-clutter). Density where you scan, calm where you work.
- **Navigation:** **Three core sections + Home always one click away** — Home · Team · Coaching · Project (Notion-style left nav / block sections).
- **Daily landing (Home):** "**Today = Week N of 11**," standup checklist (pending vs. done), today's flags, open blockers, overdue action items, today's coaching tip.
- **Inspiration:** Apple (feel, spacing, restraint) + Notion (structure, blocks, navigability).
- **Build approach:** Visual implementation done **later via the `frontend-design` skill**; this PRD fixes the principles so the design doesn't drift generic.

---

## 9. Phasing / Roadmap

> The **11 weeks is the team's product build**, not this tool's deadline. PM Assistant should be **usable from Week 1** of that build, so the MVP is sequenced to be functional fast.

| Phase | Contents | Goal |
|---|---|---|
| **MVP (build first)** | Roster & roles, standup template + run mode, meetings & attendance, flags engine, daily roll-up/Home, action items, risks/blockers, decisions, 1:1 substance, PM to-do, kudos, leave, per-person trends + template reports, team sentiment pulse, curated coaching, project + milestones + RAG, weekly status report, backup/export | A fully usable, $0, AI-free assistant from Week 1 |
| **Phase 1.5** | Stakeholder map, richer goals/OKRs | Round out the PM toolkit |
| **Phase 2 (AI, free/local)** | AI coaching, AI trend summaries, AI-drafted per-person & status reports, AI-suggested standup questions, proactive growth suggestions | Layer intelligence with $0 via local/free-tier model |
| **Later** | Meeting agenda/notes templates, end-of-project retro + PM self-assessment, knowledge scratchpad, live JIRA integration | Nice-to-haves |

---

## 10. Corner Cases & Edge Conditions

**People & roster**
- Member **joins mid-project** (e.g., Week 5) — trends/reports must handle partial history, not assume Week 1 start.
- Member **leaves mid-project** — set inactive; keep history; exclude from "pending standup" but retain in reports.
- **Role renamed/deleted** while members hold it — reassign or preserve label; never orphan a member.
- **Duplicate names** (two "Alex") — disambiguate by id, not name.

**Standups & attendance**
- **Weekend/no-standup day** — work week is **Mon–Fri**; no missed-standup flags on Sat/Sun, nor on any date marked via the **"No standup today" button** (B4). A no-standup date must also be excluded from attendance rates and trend math, not just from flags.
- Member **on leave** — attendance "Absent" should be reconciled with the **leave tracker** so it doesn't trigger a false "quiet/absent" flag.
- **Late/partial standup** — entry saved partway; must persist drafts, not lose data.
- **Editing a past standup** — allowed, but date stamp stays the original (don't silently re-date history).
- Standup **script edited mid-project** — old entries keep their original questions; reports must render historical answers even if a question was later removed.

**Flags & thresholds**
- **Threshold collisions** — a single event triggering multiple flags shouldn't spam; dedupe/group.
- **Flag fatigue** — allow snooze/dismiss with reason; dismissed ≠ deleted (keep an audit trail).
- **Day rollover** — "today" boundary and `Week N of 11` must update correctly at local midnight; Week 11→ "project complete" state.
- Project **not yet set up** — Home should degrade gracefully ("Week N of 11" hidden until project dates entered).

**Action items / risks / decisions**
- **Owner removed** from team while an open action/risk is assigned — reassign or mark orphaned, never crash.
- **Blocker resolved then recurs** — reopen vs. new entry (define: reopening keeps history).
- **Overdue with no due date** — items without due dates shouldn't be flagged overdue.

**Reports & exports**
- **Private vs. shared report** — "PM notes" is **private by default**; only fields explicitly toggled "include in shared report" appear in the version given to the team member. The export must clearly distinguish the **private (full)** export from the **shared (filtered)** export so the two never leak into each other.
- **Empty/sparse data** — exporting a report for a member with little history must produce a sensible "insufficient data" section, not blanks/errors.
- **Long free-text** — reports/PDF must wrap/paginate; no truncation of content.
- **Export while data is open/being edited** — snapshot consistency (don't export half-written state).

**Coaching & project clock**
- **Project shorter/longer than 11 weeks** or **dates changed mid-flight** — week numbering and the coaching curriculum must re-map, not break (don't hardcode 11).
- **Past Week 11** (overrun) — coaching/Home handle "extra time" gracefully.

**Data safety (no cloud net)**
- **App closed mid-entry** — unsaved input recovered or clearly discarded; never silent partial corruption.
- **SQLite file moved/locked/corrupt** — clear error + guidance to restore from backup; never start with a silently empty DB and overwrite.
- **Backup before destructive actions** (e.g., deleting a member) — confirm + offer export first.

**Phase 2 / AI (forward-looking)**
- **AI provider unavailable/offline** (local model not running, free-tier rate-limited) — gracefully **fall back to the rule-based/template path**; the app must never hard-depend on AI.
- **AI output low-confidence** — present as a *suggestion to review*, never auto-commit into reports the PM will submit.

---

## 11. Resolved Decisions (was: Open Questions)
| # | Decision | Resolution |
|---|---|---|
| 1 | **Mood scale** | **Emoji scale (😞 😐 🙂 😄 🤩) stored as 1–5** underneath. Warm on screen, clean for trends. |
| 2 | **Working days / holidays** | **Mon–Fri** work week + a **"No standup today" button** (B4) for ad-hoc off-days. No maintained holiday list. |
| 3 | **Flag thresholds (defaults, editable)** | 1:1 overdue **14d** · quiet/no-standup **2 working days** · tracker not updated **2 working days** · blocker aging **3d** · mood low **≤2/5 for 3 days**. Tune after Weeks 1–2. |
| 4 | **Per-person report** | Audience = **PM + the team member** (a constructive "developmental mirror," not a score). Suggested section structure (§5 L2). Exports **Markdown + PDF**. **PM notes private-by-default** with an "include in shared report" toggle. |
| 5 | **Phase 2 AI provider** | **Local-first (Ollama)** for $0 + privacy (reports contain personal feedback), with a **free-tier API as optional fallback** — both behind the swappable `CoachProvider`. |

### Still to tune with real data (non-blocking)
- Exact mood-emoji-to-number mapping wording, and whether to add a 0 ("no entry") state.
- Whether any flag thresholds need adjusting after the first two weeks of real use.

---

## 12. Appendix — Feature Origin Map
- Original asks: roster/roles, standups, attendance (all meeting types), trends, per-person reports, daily roll-up, flags/reminders, PM coaching/self-development, 11-week project tracking, complements JIRA.
- Added in discovery (chosen for MVP): action items (#1), risks/blockers RAID-lite (#2), decision log (#3), 1:1 substance (#4), personal PM to-do (#5), weekly status report (#6), capacity/leave (#8), team sentiment pulse (#10), recognition/kudos (#12).
- Deferred: stakeholder map (#7), goals/OKRs depth (#9), meeting agenda/notes (#11), end-of-project retro (#13), knowledge scratchpad (#14), live JIRA integration.

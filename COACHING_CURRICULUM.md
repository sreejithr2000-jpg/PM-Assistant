# PM Assistant — Week-by-Week Coaching Curriculum (Weeks 1–11)

> **Purpose:** Seed content for the **Coaching** section (feature N1) and the **best-practice checks** engine (feature N2). Each week is surfaced on Home when `Today = Week N of 11`.
> **Audience:** A first-time PM leading a small cross-functional team (designers, developers, data scientists) through an 11-week product build.
> **Tone:** Encouraging, practical, "do this now." No paid resources — all frameworks are free and named so you can look them up.

**How each week is structured**
- **🎯 Theme & where the project should be** — the focus for the week.
- **📚 Learn this week** — 2–3 PM concepts to actually study.
- **✅ Do this week** — concrete actions/rituals.
- **🔎 Best-practice checks** — things the app evaluates against your data and nudges you on. *(Each shows the data signal it maps to.)*
- **🪞 Reflection** — a self-development prompt for *you*.
- **📦 Resources** — free frameworks/reading to look up.

---

## PHASE 1 — FOUNDATION (Weeks 1–2)

### Week 1 — Kickoff & Foundations
**🎯 Theme:** Set the project up so it *can* succeed. Most projects are won or lost in Week 1 by being vague about the goal. Get the team in, define what success means, and establish the daily rhythm.

**📚 Learn this week**
- **Defining success metrics** — the difference between outputs ("we shipped X") and outcomes ("users can do Y in under Z seconds"). Learn the idea of a **North Star metric**.
- **Working Backwards / PR-FAQ** (Amazon) — writing the "press release" for your product before building it, to force clarity on the goal.
- **Standup anti-patterns** — why standups become status-theater and how to keep them about blockers and coordination.

**✅ Do this week**
- Add **every team member** with their role.
- Enter the **Project**: name, start/end dates, **the goal**, and **success metrics**.
- Set up your **standup script** (edit the template to fit your team).
- Run your **first standup** and hold a **kickoff** where the whole team hears the goal in your words.

**🔎 Best-practice checks**
- [ ] Project goal is defined → `Project.goal ≠ empty`
- [ ] At least one **success metric** defined → `Project.success_metrics ≠ empty`
- [ ] All team members added with a role → `TeamMember` count > 0, none missing `role_id`
- [ ] Standup template configured → `StandupTemplateQuestion` exists
- [ ] First standup logged → `StandupEntry` exists this week

**🪞 Reflection:** *Can you state your project's goal in one sentence a non-expert would understand? If not, that's your first job.*

**📦 Resources:** North Star Framework; Amazon Working Backwards / PR-FAQ; "The Daily Standup" (Scrum guide).

---

### Week 2 — Discovery & Alignment
**🎯 Theme:** Make sure you're solving the *right* problem and that the team feels safe. A new PM's instinct is to rush to build; the better move is to align deeply first.

**📚 Learn this week**
- **Problem framing** — "Jobs To Be Done" and the "5 Whys" for getting to root problems.
- **Psychological safety** — the #1 predictor of high-performing teams (Google's Project Aristotle). What it is and how a PM creates it.
- **The 1:1** — its purpose (the person's growth & blockers, not status) and the **GROW model** for structuring it.

**✅ Do this week**
- Hold a **first 1:1 with every team member** — learn their goals, working style, and concerns. Record growth goals.
- Capture the **problem statement** and key **assumptions** as decisions.
- Watch your standup **mood signal** — establish what "normal" looks like per person.

**🔎 Best-practice checks**
- [ ] A 1:1 held with **every** active member → `OneOnOne` exists per `TeamMember`
- [ ] Career/growth goals recorded for each member → `TeamMember.career_goals ≠ empty`
- [ ] At least one **decision** logged (problem framing/assumptions) → `Decision` count > 0
- [ ] Standups running daily on working days → no `quiet` flags open

**🪞 Reflection:** *For each person, do you know one thing they want to get better at during this project? If not, that's what next week's 1:1 is for.*

**📦 Resources:** Jobs To Be Done; "5 Whys"; Google re:Work — Psychological Safety; The GROW coaching model.

---

## PHASE 2 — DEFINE & PLAN (Weeks 3–4)

### Week 3 — Scope & Prioritization
**🎯 Theme:** Turn discovery into a concrete, prioritized plan. With only 8 weeks of build left, what you choose *not* to do matters as much as what you do.

**📚 Learn this week**
- **Prioritization frameworks** — **MoSCoW** (Must/Should/Could/Won't) and **RICE** (Reach, Impact, Confidence, Effort). When to use each.
- **MVP thinking** — the smallest thing that delivers the core outcome; avoiding gold-plating.
- **User stories & acceptance criteria** — the **INVEST** checklist for good stories.

**✅ Do this week**
- Draft your **milestones** across the remaining weeks with target dates.
- Explicitly mark your **"Must vs. Won't"** list — write the *Won'ts* down so scope creep has a wall to hit.
- Confirm each milestone ladders up to the project goal.

**🔎 Best-practice checks**
- [ ] Milestones defined with target weeks → `Milestone` count > 0, each has `week_no`
- [ ] Milestones cover through Week 11 → milestones span to project end
- [ ] Scope decisions captured → `Decision` entries tagged scope/priority
- [ ] No milestone already at-risk this early without a note

**🪞 Reflection:** *What is the one thing this product must do well? If you cut everything else, would that alone be worth shipping?*

**📦 Resources:** MoSCoW method; RICE scoring; INVEST criteria for user stories; "Minimum Viable Product" (Ries).

---

### Week 4 — De-risk & Sequence
**🎯 Theme:** Find what could kill the project *before* it does. Sequence work so dependencies and the riskiest unknowns come first, not last.

**📚 Learn this week**
- **RAID / risk registers** — Risks, Assumptions, Issues, Dependencies; severity and ownership.
- **Premortem** — imagine it's Week 11 and the project failed; work backwards to causes.
- **Definition of Done (DoD)** — a shared bar for "complete" so quality isn't argued at the end.
- *(Cross-functional note:)* identify **technical spikes** (devs), **design unknowns** (designers), and **data/experiment readiness** (data scientists) that need early resolution.

**✅ Do this week**
- Run a **premortem** and populate the **Risk/Blocker register**.
- Map **dependencies** between roles (e.g., design must land before dev starts X).
- Agree a **Definition of Done** with the team; log it as a decision.

**🔎 Best-practice checks**
- [ ] Risk register has entries → `RiskBlocker` count > 0
- [ ] Each open risk has an owner → no `RiskBlocker` with empty `owner_id`
- [ ] Definition of Done captured → `Decision` titled/tagged "DoD"
- [ ] Highest-risk work scheduled in early milestones, not Week 10

**🪞 Reflection:** *What's the single biggest risk to hitting Week 11? Who owns reducing it, and what happens this week to shrink it?*

**📦 Resources:** RAID log; Premortem (Gary Klein, HBR); Definition of Done (Scrum).

---

## PHASE 3 — BUILD (Weeks 5–7)

### Week 5 — Execution Rhythm
**🎯 Theme:** Protect momentum. Your job shifts from planning to **unblocking** and keeping the loop closed on commitments. Track honestly.

**📚 Learn this week**
- **Servant leadership / unblocking** — the PM as obstacle-remover, not taskmaster.
- **Closing the loop** — why dropped action items quietly kill trust and timelines.
- **Healthy tracking** — keeping JIRA/your tracker current without it becoming busywork.

**✅ Do this week**
- Triage the **action items** list daily; drive overdue items to closure.
- Work the **blocker register** — every open blocker should move each day.
- Keep **tracker-updated** rates high (watch the flag).

**🔎 Best-practice checks**
- [ ] Action items being closed → closure rate ≥ 70% of due items
- [ ] No blocker open > 3 days without status change → no `blocker aging` flags
- [ ] Tracker-update rate healthy → no `tracker not updated` flags standing
- [ ] Standup consistency ≥ 90% this week

**🪞 Reflection:** *Did you remove at least one obstacle for someone this week? That, not status-collecting, is the job.*

**📦 Resources:** Servant Leadership (Greenleaf); "Getting Things Done" — open loops.

---

### Week 6 — Mid-Project Health Check
**🎯 Theme:** You're past halfway. Step back and honestly assess **both the project and the people**. This is the cheapest moment to course-correct.

**📚 Learn this week**
- **RAG status reporting** — Red/Amber/Green, and the discipline of an *honest* Amber instead of a hopeful Green.
- **Team health signals** — reading the **sentiment pulse** and acting on dips before they become attrition.
- **Managing up** — keeping your manager informed with no surprises.

**✅ Do this week**
- Set an honest **project RAG** status.
- Review the **team sentiment pulse**; for any low-trend person, plan a real conversation.
- Send your **first weekly status report** upward (RAG + highlights + risks + asks).
- Hold the **mid-project 1:1 round**.

**🔎 Best-practice checks**
- [ ] Project RAG status set → `Project`/`Milestone` status current
- [ ] Weekly status report generated → `WeeklyStatusReport` exists this week
- [ ] No member with a standing low-mood trend left unaddressed
- [ ] 1:1s current for everyone → no `1:1 overdue` flags

**🪞 Reflection:** *If you had to bet your own money: will you hit the Week 11 goal? What's the most honest reason for doubt — and have you told anyone?*

**📦 Resources:** RAG status reporting; "Radical Candor" (caring + challenging); managing up basics.

---

### Week 7 — Feedback & Quality
**🎯 Theme:** Quality and people-growth compound when addressed early. Give real feedback now, and make quality visible through demos.

**📚 Learn this week**
- **The SBI feedback model** (Situation–Behavior–Impact) — specific, kind, actionable feedback.
- **Recognition** — why naming small wins publicly is one of the cheapest, highest-impact tools you have.
- **Demos / showcases** — surfacing work-in-progress to catch quality and direction issues early.

**✅ Do this week**
- Give each person **one piece of specific feedback** (SBI) and log it in their 1:1.
- Record at least a few **kudos** — real wins you noticed.
- Run a **demo/showcase** of progress against milestones.

**🔎 Best-practice checks**
- [ ] Feedback recorded in recent 1:1s → `OneOnOne.feedback ≠ empty` (recent)
- [ ] Kudos being logged → `Kudos` entries this week > 0
- [ ] Milestones tracking to date → at-risk milestones have mitigation notes

**🪞 Reflection:** *Who on the team has done great work that you haven't acknowledged out loud? Fix that today.*

**📦 Resources:** SBI feedback model (CCL); "Radical Candor"; the art of the demo.

---

## PHASE 4 — STABILIZE (Weeks 8–9)

### Week 8 — Scope Decisions Under Pressure
**🎯 Theme:** This is where new PMs are truly tested. Reality has diverged from the plan. The skill now is making **clear scope cuts** and communicating them without drama.

**📚 Learn this week**
- **Scope-cutting** — defending the *Must*, sacrificing the *Could*; "what would we cut to ship on time?"
- **Decision-making under uncertainty** — making a *good enough, reversible* call fast vs. waiting for perfect info (one-way vs. two-way doors).
- **Expectation management** — renegotiating scope/time with stakeholders early, not at the deadline.

**✅ Do this week**
- Make the **explicit scope decisions** and log each with its **rationale** in the Decision Log.
- Update **milestones** to reflect the real plan (don't let them lie).
- Send a **status report** that names any scope changes and asks clearly.

**🔎 Best-practice checks**
- [ ] Scope decisions logged with rationale → recent `Decision` entries with `rationale ≠ empty`
- [ ] Milestones updated to reality → no overdue milestone still marked "on track"
- [ ] Status report reflects changes → `WeeklyStatusReport` this week mentions scope/risk

**🪞 Reflection:** *What are you still trying to deliver that you secretly know won't make it? Decide now — ambiguity costs the team more than a clear cut.*

**📦 Resources:** One-way vs. two-way door decisions (Bezos); MVP scope discipline; expectation management.

---

### Week 9 — Integration & Risk Burn-down
**🎯 Theme:** Pieces must come together. Cross-functional integration (design + dev + data) is where hidden gaps appear. Drive open risks to zero.

**📚 Learn this week**
- **Integration risk** — why "done in isolation" ≠ "works together," and the value of an early integration checkpoint.
- **Risk burn-down** — actively closing the register, not just watching it.
- **Critical path** — knowing which remaining tasks, if late, push the whole launch.

**✅ Do this week**
- Drive an **integration checkpoint** — get the parts working together end-to-end once.
- **Burn down the risk register** — resolve or explicitly accept every open item.
- Identify the **critical path** to launch and protect it.

**🔎 Best-practice checks**
- [ ] Open risks trending down → fewer open `RiskBlocker` than last week
- [ ] No aging blockers near launch → no `blocker aging` flags
- [ ] Milestones for integration marked done/at-risk honestly
- [ ] Action item closure rate high → ≥ 80%

**🪞 Reflection:** *What hasn't been tested working together yet? That untested seam is your highest risk into launch.*

**📦 Resources:** Critical Path Method (CPM) basics; integration testing concepts; risk burn-down.

---

## PHASE 5 — LAND (Weeks 10–11)

### Week 10 — Launch Readiness
**🎯 Theme:** Get to "shippable." Resist new scope; focus on testing, polish, and a clear go/no-go. Calm, deliberate, checklist-driven.

**📚 Learn this week**
- **Launch checklists & go/no-go** — defining launch criteria against your Week 1 success metrics.
- **Feature freeze** — why stopping new work *before* the end is how you actually finish.
- **Communication plan** — who needs to know what, when you ship.

**✅ Do this week**
- Build a **launch checklist** mapped to your **success metrics** and **Definition of Done**.
- Declare a **feature freeze**; everything now is fix/polish/test.
- Run a **go/no-go** review; log the decision.
- Pre-draft the **per-person reports** so Week 11 isn't a scramble.

**🔎 Best-practice checks**
- [ ] Launch criteria tie back to success metrics → checklist references `Project.success_metrics`
- [ ] Go/no-go decision logged → `Decision` tagged "go/no-go"
- [ ] Per-person reports near-ready → each member has exportable report data
- [ ] No critical blocker open → register clear of high-severity items

**🪞 Reflection:** *Are you adding things, or finishing things? In Week 10, adding is a warning sign.*

**📦 Resources:** Launch readiness checklist; go/no-go criteria; feature freeze rationale.

---

### Week 11 — Launch, Retro & Reflection
**🎯 Theme:** Ship it, then *learn from it*. The project ends; the PM you've become is the lasting output. Close loops, celebrate, reflect, and deliver the developmental reports.

**📚 Learn this week**
- **Retrospectives** — the **Start / Stop / Continue** format and how to make them safe and actionable.
- **Recognition & closure** — ending a project well so the team wants to work with you again.
- **PM self-assessment** — turning 11 weeks of data into honest growth insight.

**✅ Do this week**
- **Launch** against the go/no-go criteria.
- Run a **team retrospective** (Start/Stop/Continue); log the takeaways as decisions.
- Finalize and **share the per-person developmental reports** (private notes kept private; shared sections shared).
- **Celebrate** the team publicly — log final kudos.
- Do your own **PM self-assessment**: review the 11 weeks of flags, what you caught, what you missed.

**🔎 Best-practice checks**
- [ ] Project goal outcome recorded → `Project` marked complete with result vs. success metrics
- [ ] Retrospective takeaways logged → `Decision` entries tagged "retro"
- [ ] Every member has a finalized per-person report → all reports exportable
- [ ] Final kudos recorded → `Kudos` entries this week

**🪞 Reflection:** *Compared to Week 1, what's the single biggest way you grew as a PM? And what's the one habit you want to carry into your next project?*

**📦 Resources:** Start/Stop/Continue retro; "The Five Dysfunctions of a Team" (closure); writing a personal PM growth review.

---

## Cross-Week Habits (surfaced any week, not tied to one)
These run as **always-on best-practice nudges** regardless of week:
- Daily standups logged on every working day (Mon–Fri, minus "No standup today").
- A 1:1 with each person at least every 14 days.
- No blocker left aging > 3 days without movement.
- Action items closed by their due dates.
- Weekly status report sent every week from Week 6 onward.
- Kudos logged regularly — recognition is not a once-a-project event.
- Decision Log kept current — every significant call captured with its *why*.

---

## Notes for the build
- This document **seeds the `CoachingModule` table**: each `Week N` block → one row (`week_no`, `topic`, `best_practices[]`, `resources[]`). The "Do this week" and "Reflection" become module body fields.
- **Best-practice checks** are the spec for feature **N2**: each checkbox names the **data signal** to evaluate. Implement them as pure functions over the data model and surface failures as gentle nudges on Home.
- Curriculum is **calendar-mapped but not hardcoded to 11**: if project dates change, map weeks proportionally (e.g., compress Build weeks) rather than breaking. Foundation = first ~18%, Define ~18%, Build ~27%, Stabilize ~18%, Land ~18%.
- **Phase 2 (AI):** later, the LLM can *personalize* each week's coaching using the user's actual data ("you have 2 aging blockers and skipped Ravi's 1:1 — here's this week's focus"). The curriculum here is the grounding it builds on.

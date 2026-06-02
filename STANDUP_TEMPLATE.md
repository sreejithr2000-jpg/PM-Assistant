# PM Assistant — Default Standup Script Template (Feature B1)

> **Purpose:** The default, editable standup questions the PM runs through person-by-person each morning (feature B1/B2). Seeds the `StandupTemplateQuestion` table.
> **Editable:** The PM can add, remove, reorder, and reword any question in settings. These are sensible defaults, not a fixed form.
> **Tone:** Warm and human — it's a check-in with a person, not a status form.

## How to read this
Each question maps to a `StandupTemplateQuestion(order, prompt, field_type)` row and writes into the corresponding `StandupEntry` field. `field_type` tells the UI what control to render and how the data is stored for trends/reports.

| # | Prompt (default wording) | `field_type` | Writes to | Notes |
|---|---|---|---|---|
| 1 | **"Hey [name] 👋 — how are you feeling today?"** | `emoji_scale` (😞😐🙂😄🤩 → 1–5) | `mood` | Powers per-person mood trend + team sentiment pulse. Allow a "skip/no answer" state. |
| 2 | **"How was yesterday — what did you get done?"** | `long_text` | `yesterday` | Free text. Highlights here can become **kudos** in one tap. |
| 3 | **"What are you focusing on today?"** | `long_text` | `today` | The plan; useful for spotting drift vs. milestones. |
| 4 | **"Anything blocking you or slowing you down?"** | `long_text` + **"Promote to blocker"** action | `blockers` | If non-empty, offer one-tap **promote to Risk/Blocker register** (feature E3) with owner = this person. |
| 5 | **"Have you updated the tracker (JIRA)?"** | `yes_no` | `tracker_updated` | The manual JIRA stand-in. Feeds the "tracker not updated" flag. |
| 6 | **"Anything you need from me?"** | `long_text` + **"Create action item / PM to-do"** action | `custom.needs_from_pm` | Lets you turn a request into an **action item** (owner = you) or **PM to-do** on the spot. |
| 7 | **"Any wins or shout-outs from the team?"** *(optional)* | `long_text` + **"Log kudos"** action | `custom.wins` | Prompts recognition; one tap logs a **Kudos** entry. |

## Behaviors tied to the script
- **Person-by-person run mode (B2):** the app walks you through questions 1→7 for each member, saving as you go. Partial entries persist (no lost data if you stop midway).
- **Date & week stamping:** every entry is stamped with `date` and `week_of_11`, attributed to the member.
- **No-standup days (B4):** if today is marked "No standup today" (or Sat/Sun), the run mode is disabled and the day is excluded from coverage/trend math.
- **On-leave members (J1):** members on leave today are shown as "on leave," skipped in the pending list, and not flagged as quiet.
- **Editing history safely:** rewording/removing a question later does **not** alter past entries — historical answers still render against the question text they were asked under (see PRD §10).

## Suggested optional questions (off by default — add if useful)
- "How confident are you about hitting your part of this week's milestone?" → `emoji_scale` or `1–5` (early risk signal).
- "What did you learn yesterday?" → `long_text` (growth signal, good 1:1 fuel).
- "Capacity today — full / partial / out?" → `choice` (lightweight capacity input that complements the leave tracker).

## Notes for the build
- This seeds the **`StandupTemplateQuestion`** table; questions 1–6 enabled by default, 7 optional-on.
- `field_type` set: `emoji_scale`, `yes_no`, `long_text`, `choice`, `1-5`. New types should be additive (data, not code).
- The **inline actions** (promote-to-blocker, create-action-item, log-kudos) are what make the standup the *hub* of the app — one ritual feeds the blocker register, action items, and kudos log without extra navigation.

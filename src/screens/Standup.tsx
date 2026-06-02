import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore, initials } from '../store/store';
import { useClock, useToday } from '../store/selectors';
import { sprintNumberForWeek, totalSprints } from '../domain/sprints';
import { MOOD_EMOJI } from '../domain/trends';
import { isWeekend, prettyDate } from '../domain/dates';
import type { StandupEntry } from '../data/types';

interface Draft {
  mood: number | null;
  yesterday: string;
  today: string;
  blockers: string;
  trackerUpdated: boolean | null;
  custom: Record<string, string>;
}

const emptyDraft = (): Draft => ({ mood: null, yesterday: '', today: '', blockers: '', trackerUpdated: null, custom: {} });

function seedDraft(e?: StandupEntry): Draft {
  if (!e) return emptyDraft();
  return { mood: e.mood, yesterday: e.yesterday, today: e.today, blockers: e.blockers, trackerUpdated: e.trackerUpdated, custom: { ...e.custom } };
}

const textareaStyle: React.CSSProperties = {
  width: '100%', borderRadius: 12, border: '1px solid var(--line-2)', padding: '10px 12px',
  fontFamily: 'var(--body)', fontSize: 14.5, color: 'var(--ink)', resize: 'vertical', background: 'var(--card)',
};

function fieldVal(d: Draft, key: string): string {
  if (key === 'yesterday') return d.yesterday;
  if (key === 'today') return d.today;
  if (key === 'blockers') return d.blockers;
  return d.custom[key] ?? '';
}
function setField(d: Draft, set: (d: Draft) => void, key: string, val: string) {
  if (key === 'yesterday') set({ ...d, yesterday: val });
  else if (key === 'today') set({ ...d, today: val });
  else if (key === 'blockers') set({ ...d, blockers: val });
  else set({ ...d, custom: { ...d.custom, [key]: val } });
}

export function Standup() {
  const db = useStore((s) => s.db);
  const saveStandup = useStore((s) => s.saveStandup);
  const addRisk = useStore((s) => s.addRisk);
  const addAction = useStore((s) => s.addAction);
  const addKudos = useStore((s) => s.addKudos);
  const toggleNoStandupDay = useStore((s) => s.toggleNoStandupDay);
  const today = useToday();
  const clock = useClock();

  const isNoStandup = db.settings.noStandupDates.includes(today) || isWeekend(today);
  const questions = db.standupQuestions.filter((q) => q.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  const onLeave = (id: string) => db.leave.some((l) => l.memberId === id && l.startDate <= today && today <= l.endDate);
  const roster = useMemo(() => db.members.filter((m) => m.status === 'active' && !onLeave(m.id)), [db.members, db.leave]);

  const [idx, setIdx] = useState(() => {
    const firstPending = roster.findIndex((m) => !db.standups.some((s) => s.memberId === m.id && s.date === today));
    return firstPending === -1 ? 0 : firstPending;
  });
  const member = roster[idx];
  const [draft, setDraft] = useState<Draft>(() => seedDraft(member && db.standups.find((s) => s.memberId === member.id && s.date === today)));
  const [toast, setToast] = useState('');

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2200); }

  function goTo(newIdx: number) {
    const e = db.standups.find((s) => s.memberId === roster[newIdx].id && s.date === today);
    setIdx(newIdx);
    setDraft(seedDraft(e));
    setToast('');
  }

  function save(advance: boolean) {
    if (!member) return;
    saveStandup({
      memberId: member.id, date: today, weekNo: clock.weekNo,
      mood: draft.mood, yesterday: draft.yesterday, today: draft.today,
      blockers: draft.blockers, trackerUpdated: draft.trackerUpdated, custom: draft.custom,
    });
    if (advance && idx < roster.length - 1) goTo(idx + 1);
    else flash('Saved ✓');
  }

  function promoteBlocker() {
    if (!draft.blockers.trim() || !member) return;
    addRisk({ description: draft.blockers.trim(), type: 'blocker', ownerId: member.id, severity: 'medium', status: 'open', raisedDate: today, resolvedDate: null, lastMovedDate: today });
    flash('Promoted to blocker register ✓');
  }
  function createAction() {
    const text = draft.custom.needs_from_pm?.trim();
    if (!text) return;
    addAction({ description: text, ownerId: null, source: 'standup', dueDate: null, status: 'open' });
    flash('Action item created ✓');
  }
  function logKudos() {
    const text = draft.custom.wins?.trim();
    if (!text || !member) return;
    addKudos({ memberId: member.id, date: today, weekNo: clock.weekNo, note: text });
    flash('Kudos logged ✓');
  }

  const Topbar = (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton fallback="/" />
        <div>
          <div className="crumb"><Link to="/">Home</Link> · Standup · Sprint {sprintNumberForWeek(clock.weekNo, db.settings.sprintLengthWeeks)} of {totalSprints(clock.totalWeeks, db.settings.sprintLengthWeeks)}</div>
          <div className="tt">Run standup — {prettyDate(today)}</div>
        </div>
      </div>
      <div className="top-actions"><Link className="btn btn-ghost" to="/">Done</Link></div>
    </div>
  );

  if (isNoStandup) {
    return (
      <>
        {Topbar}
        <div className="content">
          <div className="card reveal d1" style={{ maxWidth: 520, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40 }}>🌙</div>
            <p className="display" style={{ fontWeight: 600, fontSize: 20, margin: '12px 0 6px' }}>No standup today</p>
            <p style={{ color: 'var(--ink-2)' }}>
              {isWeekend(today) ? 'It’s the weekend — enjoy the break.' : 'This day is marked as a non-standup day. It won’t count against coverage or trends.'}
            </p>
            {!isWeekend(today) && (
              <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => toggleNoStandupDay(today)}>Actually, run standup →</button>
            )}
          </div>
        </div>
      </>
    );
  }

  const donePicker = roster.map((m) => ({ m, done: db.standups.some((s) => s.memberId === m.id && s.date === today) }));
  const doneCount = donePicker.filter((d) => d.done).length;

  return (
    <>
      {Topbar}
      <div className="content">
        <div className="row r2-1" style={{ alignItems: 'start' }}>
          <div className="panel reveal d1">
            <div className="panel-h">
              <h3><span className={`av md ${member?.avatarTone ?? ''}`} style={{ marginRight: 4 }}>{member ? initials(member.name) : '–'}</span>{member?.name}</h3>
              <span className="pill peach">Person {idx + 1} / {roster.length}</span>
            </div>
            <div className="panel-b" style={{ padding: '16px 20px 20px' }}>
              {questions.map((q) => (
                <div key={q.id} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 14.5, marginBottom: 8 }}>{q.prompt}</label>

                  {q.fieldType === 'emoji_scale' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setDraft({ ...draft, mood: n })}
                          style={{ fontSize: 26, padding: '6px 8px', borderRadius: 12, cursor: 'pointer', background: draft.mood === n ? 'var(--accent-tint)' : 'var(--cream-2)', border: draft.mood === n ? '2px solid var(--accent)' : '2px solid transparent' }}>
                          {MOOD_EMOJI[n]}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.fieldType === 'yes_no' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([['Yes', true], ['No', false]] as const).map(([label, val]) => (
                        <button key={label} onClick={() => setDraft({ ...draft, trackerUpdated: val })}
                          className="btn btn-ghost" style={{ background: draft.trackerUpdated === val ? 'var(--accent-tint)' : undefined, borderColor: draft.trackerUpdated === val ? 'var(--accent)' : undefined }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.fieldType === 'long_text' && (
                    <>
                      <textarea value={fieldVal(draft, q.writesTo)} onChange={(e) => setField(draft, setDraft, q.writesTo, e.target.value)}
                        rows={2} placeholder="…" style={textareaStyle} />
                      {q.writesTo === 'blockers' && draft.blockers.trim() && (
                        <button className="go" onClick={promoteBlocker}>🧱 Promote to blocker</button>
                      )}
                      {q.writesTo === 'needs_from_pm' && draft.custom.needs_from_pm?.trim() && (
                        <button className="go" onClick={createAction}>✅ Create action item</button>
                      )}
                      {q.writesTo === 'wins' && draft.custom.wins?.trim() && (
                        <button className="go" onClick={logKudos}>💛 Log kudos</button>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost" disabled={idx === 0} onClick={() => goTo(idx - 1)}>← Prev</button>
                {idx < roster.length - 1
                  ? <button className="btn btn-p" onClick={() => save(true)}>Save & next →</button>
                  : <button className="btn btn-dark" onClick={() => save(false)}>Save & finish ✓</button>}
                {toast && <span className="pill green" style={{ marginLeft: 4 }}>{toast}</span>}
              </div>
            </div>
          </div>

          <div className="panel reveal d2">
            <div className="panel-h"><h3>☀️ Today</h3><span className="pill peach">{doneCount}/{roster.length}</span></div>
            <div className="panel-b">
              <div className="checks">
                {donePicker.map(({ m, done }, i) => (
                  <button key={m.id} className={`check${done ? ' done' : ''}`} onClick={() => goTo(i)}
                    style={{ width: '100%', background: i === idx ? 'var(--cream-2)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10 }}>
                    <span className="tick">{done ? '✓' : ''}</span>
                    <div><div className="nm">{m.name}</div><div className="role">{db.roles.find((r) => r.id === m.roleId)?.name}</div></div>
                    <div className="right">{i === idx && <span className="pill blue">current</span>}</div>
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => toggleNoStandupDay(today)}>🌙 No standup today</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore } from '../store/store';
import { useClock, useToday } from '../store/selectors';
import { computeSprints, currentSprint } from '../domain/sprints';
import { addDays, daysBetween, shortDate } from '../domain/dates';
import type { CeremonyGuide } from '../data/types';

export function Sprints() {
  const db = useStore((s) => s.db);
  const updateCeremonies = useStore((s) => s.updateCeremonies);
  const updateSettings = useStore((s) => s.updateSettings);
  const addMeeting = useStore((s) => s.addMeeting);
  const today = useToday();
  const clock = useClock();
  const navigate = useNavigate();

  const len = db.settings.sprintLengthWeeks;
  const sprints = computeSprints(db.project.startDate, db.project.endDate, len, today);
  const cur = currentSprint(sprints);

  const setCeremony = (id: string, patch: Partial<CeremonyGuide>) =>
    updateCeremonies(db.ceremonies.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const setAgenda = (id: string, agenda: string[]) => setCeremony(id, { agenda });

  function ceremonyWhen(c: CeremonyGuide): string {
    if (!cur) return 'Set project dates to schedule';
    if (c.cadence === 'sprint_start') return shortDate(cur.startDate);
    if (c.cadence === 'sprint_end') return shortDate(cur.endDate);
    if (c.cadence === 'mid_sprint') return shortDate(addDays(cur.startDate, Math.floor(daysBetween(cur.startDate, cur.endDate) / 2)));
    return 'Every working day';
  }

  function logMeeting(c: CeremonyGuide) {
    addMeeting({ type: c.name, medium: db.settings.meetingMediums[0] ?? 'In person', date: today, weekNo: clock.weekNo });
    navigate('/attendance');
  }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton fallback="/project" />
          <div><div className="crumb"><Link to="/project">Project</Link> · Sprints</div><div className="tt">Sprints & Scrum guide</div></div>
        </div>
        <div className="top-actions" style={{ alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Sprint length</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => updateSettings({ sprintLengthWeeks: Math.max(1, len - 1) })}>−</button>
            <b className="mono-num" style={{ minWidth: 56, textAlign: 'center' }}>{len} wk{len > 1 ? 's' : ''}</b>
            <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => updateSettings({ sprintLengthWeeks: Math.min(6, len + 1) })}>+</button>
          </div>
        </div>
      </div>

      <div className="content">
        {sprints.length === 0 ? (
          <div className="card reveal d1" style={{ maxWidth: 520 }}>
            <p style={{ color: 'var(--ink-2)' }}>Set your project start & end dates on the <Link to="/project" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>Project</Link> screen to generate the sprint timeline.</p>
          </div>
        ) : (
          <>
            {/* sprint timeline */}
            <div className="panel reveal d1">
              <div className="panel-h"><h3>🏃 Sprint timeline</h3><span className="pill peach">{sprints.length} sprints · {len}-week cadence</span></div>
              <div className="panel-b" style={{ paddingTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {sprints.map((s) => (
                  <div key={s.number} style={{
                    flex: '1 1 150px', minWidth: 150, borderRadius: 14, padding: '14px 16px',
                    border: s.status === 'current' ? '2px solid var(--accent)' : '1px solid var(--line)',
                    background: s.status === 'current' ? 'var(--accent-tint)' : 'var(--card)',
                    opacity: s.status === 'done' ? 0.65 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="display" style={{ fontWeight: 700, fontSize: 18 }}>Sprint {s.number}</div>
                      <span className={`pill ${s.status === 'done' ? 'green' : s.status === 'current' ? 'peach' : 'blue'}`}>{s.status}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>Weeks {s.startWeek}–{s.endWeek}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{shortDate(s.startDate)} → {shortDate(s.endDate)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* current sprint ceremony schedule */}
            {cur && (
              <div className="panel reveal d2 mt4">
                <div className="panel-h"><h3>📋 Sprint {cur.number} — ceremony schedule</h3><span className="pill peach">Weeks {cur.startWeek}–{cur.endWeek}</span></div>
                <div className="panel-b">
                  {db.ceremonies.filter((c) => c.enabled).map((c) => (
                    <div className="flag" key={c.id}>
                      <span className="e">{c.emoji}</span>
                      <div className="txt">{c.name}<small>{c.timebox}</small></div>
                      <span className="age">{ceremonyWhen(c)}</span>
                      {c.cadence === 'daily'
                        ? <Link className="go" to="/standup">Run →</Link>
                        : <button className="go" onClick={() => logMeeting(c)}>Log meeting →</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ceremony guides (the scripts) */}
        <div className="mt4" style={{ marginBottom: 10, fontWeight: 600, fontSize: 16 }}>📖 Ceremony guides — your meeting scripts</div>
        <div className="row r2-1" style={{ alignItems: 'start' }}>
          <div>
            {db.ceremonies.map((c, i) => (
              <div className={`panel reveal d${(i % 4) + 1}${i > 0 ? ' mt3' : ''}`} key={c.id} style={{ opacity: c.enabled ? 1 : 0.6 }}>
                <div className="panel-h">
                  <h3>{c.emoji} {c.name}</h3>
                  <button className="go" onClick={() => setCeremony(c.id, { enabled: !c.enabled })}>{c.enabled ? 'On' : 'Off'}</button>
                </div>
                <div className="panel-b" style={{ paddingTop: 12 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 4 }}>{c.purpose}</p>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 10 }}>⏱ {c.timebox}</p>
                  {c.agenda.map((item, idx) => (
                    <div className="check" key={idx} style={{ cursor: 'default' }}>
                      <span className="tick" style={{ background: 'var(--cream-2)', borderColor: 'var(--line-2)', color: 'var(--ink-3)', fontSize: 11 }}>{idx + 1}</span>
                      <input defaultValue={item} onBlur={(e) => setAgenda(c.id, c.agenda.map((x, j) => (j === idx ? e.target.value : x)))} style={{ ...inp, flex: 1 }} />
                      <button className="go" onClick={() => setAgenda(c.id, c.agenda.filter((_, j) => j !== idx))} title="Remove">×</button>
                    </div>
                  ))}
                  <AddAgendaItem onAdd={(text) => setAgenda(c.id, [...c.agenda, text])} />
                </div>
              </div>
            ))}
          </div>

          {/* scrum primer */}
          <div className="card reveal d2" style={{ background: 'linear-gradient(165deg,var(--ink),#3a332b)', color: 'var(--cream)', border: 'none' }}>
            <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Scrum in one minute</div>
            <p style={{ fontSize: 14, color: '#D9CFC4', lineHeight: 1.6, marginTop: 10 }}>
              Work happens in fixed <b style={{ color: 'var(--cream)' }}>sprints</b>. Each starts with <b style={{ color: 'var(--cream)' }}>Planning</b> (commit to a goal),
              runs on a <b style={{ color: 'var(--cream)' }}>Daily Scrum</b> (re-plan 24h, surface blockers), stays healthy with mid-sprint
              <b style={{ color: 'var(--cream)' }}> Refinement</b>, and ends with a <b style={{ color: 'var(--cream)' }}>Review</b> (demo + feedback) and
              <b style={{ color: 'var(--cream)' }}> Retro</b> (improve how you work). These scripts are starting points — edit them to fit your team.
            </p>
            <Link className="btn" style={{ background: 'var(--accent)', color: '#3a2a1c', marginTop: 14 }} to="/coaching">See this week's coaching →</Link>
          </div>
        </div>
      </div>
    </>
  );
}

function AddAgendaItem({ onAdd }: { onAdd: (text: string) => void }) {
  return (
    <input placeholder="+ Add an agenda point…" style={{ ...inp, width: '100%', marginTop: 8, borderStyle: 'dashed' }}
      onKeyDown={(e) => {
        const v = (e.target as HTMLInputElement).value.trim();
        if (e.key === 'Enter' && v) { onAdd(v); (e.target as HTMLInputElement).value = ''; }
      }} />
  );
}

const inp: React.CSSProperties = { borderRadius: 10, border: '1px solid var(--line-2)', padding: '8px 11px', fontFamily: 'var(--body)', fontSize: 14, background: 'var(--card)', color: 'var(--ink)' };

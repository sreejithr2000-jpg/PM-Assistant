import { useState } from 'react';
import { useStore } from '../store/store';
import { useClock, useToday } from '../store/selectors';
import { daysBetween, shortDate } from '../domain/dates';
import { sprintNumberForWeek } from '../domain/sprints';
import { buildWeeklyStatus } from '../domain/report';
import { downloadText } from '../data/persistence';
import type { MilestoneStatus, RAG, Severity } from '../data/types';

const RAGS: RAG[] = ['green', 'amber', 'red'];
const MS_STATUS: MilestoneStatus[] = ['upcoming', 'on_track', 'at_risk', 'done'];
const pillFor = (s: MilestoneStatus) => (s === 'done' ? 'green' : s === 'on_track' ? 'amber' : s === 'at_risk' ? 'red' : 'blue');

export function Project() {
  const db = useStore((s) => s.db);
  const { project } = db;
  const updateProject = useStore((s) => s.updateProject);
  const addMilestone = useStore((s) => s.addMilestone);
  const updateMilestone = useStore((s) => s.updateMilestone);
  const addRisk = useStore((s) => s.addRisk);
  const updateRisk = useStore((s) => s.updateRisk);
  const addAction = useStore((s) => s.addAction);
  const updateAction = useStore((s) => s.updateAction);
  const addDecision = useStore((s) => s.addDecision);
  const addTodo = useStore((s) => s.addTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const addWeeklyReport = useStore((s) => s.addWeeklyReport);
  const today = useToday();
  const clock = useClock();

  const [goal, setGoal] = useState(project.goal);
  const [metrics, setMetrics] = useState(project.successMetrics);
  const [newMs, setNewMs] = useState('');
  const [newRisk, setNewRisk] = useState('');
  const [newAction, setNewAction] = useState('');
  const [dec, setDec] = useState({ title: '', rationale: '' });
  const [newTodo, setNewTodo] = useState('');

  const memberName = (id: string | null) => db.members.find((m) => m.id === id)?.name ?? 'Unassigned';
  const openRisks = db.risks.filter((r) => r.status === 'open');

  function genWeekly() {
    const md = buildWeeklyStatus(db, clock.weekNo, today);
    addWeeklyReport({ weekNo: clock.weekNo, date: today, rag: project.rag, highlights: '', risks: '', asks: '' });
    downloadText(md, `weekly-status-week-${clock.weekNo}.md`);
  }

  return (
    <>
      <div className="topbar">
        <div><div className="crumb">Project</div><div className="tt">{project.name}</div></div>
        <div className="top-actions"><button className="btn btn-p" onClick={genWeekly}>📤 Weekly status</button></div>
      </div>

      <div className="content">
        {/* goal + RAG */}
        <div className="card reveal d1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>🎯 Goal & success metrics</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {RAGS.map((r) => (
                <button key={r} onClick={() => updateProject({ rag: r })} className={`rag ${r}`}
                  style={{ cursor: 'pointer', border: project.rag === r ? '2px solid var(--ink)' : '2px solid var(--line)', borderRadius: 999, padding: '4px 12px', background: 'var(--card)' }}>
                  <span className="dot" />{r}
                </button>
              ))}
            </div>
          </div>
          <label style={lbl}>Goal</label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} onBlur={() => updateProject({ goal })} rows={2} style={ta} />
          <label style={{ ...lbl, marginTop: 12 }}>Success metrics</label>
          <textarea value={metrics} onChange={(e) => setMetrics(e.target.value)} onBlur={() => updateProject({ successMetrics: metrics })} rows={2} style={ta} />
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-3)' }}>
            {project.startDate && project.endDate ? `${shortDate(project.startDate)} → ${shortDate(project.endDate)} · Week ${clock.weekNo} of ${clock.totalWeeks}` : 'Dates not set'}
          </div>
        </div>

        <div className="row r1-1 mt4" style={{ alignItems: 'start' }}>
          {/* milestones */}
          <div className="panel reveal d2">
            <div className="panel-h"><h3>🎯 Milestones</h3></div>
            <div className="panel-b">
              {db.milestones.sort((a, b) => a.weekNo - b.weekNo).map((m) => (
                <div className="flag" key={m.id}>
                  <span className={`pill ${pillFor(m.status)}`}>{m.status.replace('_', ' ')}</span>
                  <div className="txt" style={{ marginLeft: 4 }}>{m.title}<small>Week {m.weekNo}{m.note ? ` · ${m.note}` : ''}</small></div>
                  <select value={m.status} onChange={(e) => updateMilestone(m.id, { status: e.target.value as MilestoneStatus })} style={selStyle}>
                    {MS_STATUS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={newMs} onChange={(e) => setNewMs(e.target.value)} placeholder="New milestone…" style={{ ...inp, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newMs.trim()) { addMilestone({ title: newMs.trim(), weekNo: clock.weekNo, status: 'upcoming', note: '' }); setNewMs(''); } }} />
              </div>
            </div>
          </div>

          {/* risk register */}
          <div className="panel reveal d3">
            <div className="panel-h"><h3>🧱 Risk & blocker register</h3><span className="pill amber">{openRisks.length} open</span></div>
            <div className="panel-b">
              {db.risks.sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1)).map((r) => {
                const age = daysBetween(r.lastMovedDate, today);
                return (
                  <div className="flag" key={r.id}>
                    <span className="e">{r.type === 'blocker' ? '🧱' : '⚠️'}</span>
                    <div className="txt">{r.description}<small>{memberName(r.ownerId)} · {r.severity}{r.status === 'open' ? ` · ${age}d no movement` : ' · resolved'}</small></div>
                    {r.status === 'open'
                      ? <button className="go" onClick={() => updateRisk(r.id, { status: 'resolved', resolvedDate: today, lastMovedDate: today })}>Resolve ✓</button>
                      : <span className="pill green">resolved</span>}
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={newRisk} onChange={(e) => setNewRisk(e.target.value)} placeholder="New risk/blocker…" style={{ ...inp, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newRisk.trim()) { addRisk({ description: newRisk.trim(), type: 'blocker', ownerId: null, severity: 'medium' as Severity, status: 'open', raisedDate: today, resolvedDate: null, lastMovedDate: today }); setNewRisk(''); } }} />
              </div>
            </div>
          </div>
        </div>

        <div className="row r1-1 mt4" style={{ alignItems: 'start' }}>
          {/* action items */}
          <div className="panel reveal d2">
            <div className="panel-h"><h3>✅ Action items</h3></div>
            <div className="panel-b">
              {db.actions.sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1)).map((a) => {
                const overdue = a.status === 'open' && a.dueDate && a.dueDate < today;
                return (
                  <div className="check" key={a.id}>
                    <button className="tick" onClick={() => updateAction(a.id, { status: a.status === 'done' ? 'open' : 'done' })}
                      style={{ background: a.status === 'done' ? 'var(--green)' : 'transparent', borderColor: a.status === 'done' ? 'var(--green)' : 'var(--line-2)', cursor: 'pointer' }}>{a.status === 'done' ? '✓' : ''}</button>
                    <div className="nm" style={{ textDecoration: a.status === 'done' ? 'line-through' : undefined, color: a.status === 'done' ? 'var(--ink-3)' : 'var(--ink)' }}>{a.description}</div>
                    <div className="right">
                      <span className="role">{memberName(a.ownerId)}</span>
                      {a.dueDate && <span className={`pill ${overdue ? 'red' : 'peach'}`}>{overdue ? 'overdue' : shortDate(a.dueDate)}</span>}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="New action item…" style={{ ...inp, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newAction.trim()) { addAction({ description: newAction.trim(), ownerId: null, source: 'manual', dueDate: today, status: 'open' }); setNewAction(''); } }} />
              </div>
            </div>
          </div>

          {/* PM todos */}
          <div className="panel reveal d3">
            <div className="panel-h"><h3>📌 My PM to-dos</h3></div>
            <div className="panel-b">
              {db.todos.map((t) => (
                <div className="check" key={t.id}>
                  <button className="tick" onClick={() => updateTodo(t.id, { status: t.status === 'done' ? 'open' : 'done' })}
                    style={{ background: t.status === 'done' ? 'var(--green)' : 'transparent', borderColor: t.status === 'done' ? 'var(--green)' : 'var(--line-2)', cursor: 'pointer' }}>{t.status === 'done' ? '✓' : ''}</button>
                  <div className="nm" style={{ textDecoration: t.status === 'done' ? 'line-through' : undefined, color: t.status === 'done' ? 'var(--ink-3)' : 'var(--ink)' }}>{t.description}</div>
                  {t.dueDate && <div className="right"><span className="pill peach">{shortDate(t.dueDate)}</span></div>}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Remind myself to…" style={{ ...inp, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newTodo.trim()) { addTodo({ description: newTodo.trim(), dueDate: today, status: 'open' }); setNewTodo(''); } }} />
              </div>
            </div>
          </div>
        </div>

        {/* decision log */}
        <div className="panel reveal d4 mt4">
          <div className="panel-h"><h3>📔 Decision log</h3></div>
          <div className="panel-b">
            {db.decisions.sort((a, b) => (a.date < b.date ? 1 : -1)).map((d) => (
              <div className="flag" key={d.id}>
                <span className="e">📔</span>
                <div className="txt"><b>{d.title}</b><small>Why: {d.rationale}</small></div>
                <span className="age">W{d.weekNo} · S{sprintNumberForWeek(d.weekNo, db.settings.sprintLengthWeeks)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <input value={dec.title} onChange={(e) => setDec({ ...dec, title: e.target.value })} placeholder="Decision…" style={{ ...inp, flex: 1, minWidth: 180 }} />
              <input value={dec.rationale} onChange={(e) => setDec({ ...dec, rationale: e.target.value })} placeholder="The why (rationale)" style={{ ...inp, flex: 1, minWidth: 180 }} />
              <button className="btn btn-dark" onClick={() => { if (dec.title.trim()) { addDecision({ title: dec.title.trim(), description: '', rationale: dec.rationale.trim(), date: today, weekNo: clock.weekNo, tags: [] }); setDec({ title: '', rationale: '' }); } }}>Log</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)', marginBottom: 6 };
const ta: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid var(--line-2)', padding: '10px 12px', fontFamily: 'var(--body)', fontSize: 14.5, color: 'var(--ink)', resize: 'vertical', background: 'var(--card)' };
const inp: React.CSSProperties = { borderRadius: 11, border: '1px solid var(--line-2)', padding: '9px 12px', fontFamily: 'var(--body)', fontSize: 14, background: 'var(--card)', color: 'var(--ink)' };
const selStyle: React.CSSProperties = { ...inp, padding: '5px 8px', fontSize: 13 };

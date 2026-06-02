import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore, initials } from '../store/store';
import { useToday, useClock } from '../store/selectors';
import { memberTrends, moodEmoji } from '../domain/trends';
import { shortDate } from '../domain/dates';
import type { MemberStatus } from '../data/types';

function Sparkline({ data }: { data: { date: string; mood: number }[] }) {
  if (data.length < 2) return <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Not enough data yet</span>;
  const w = 220, h = 48, pad = 4;
  const xs = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const ys = (m: number) => h - pad - ((m - 1) / 4) * (h - pad * 2);
  const d = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.mood).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((p, i) => <circle key={i} cx={xs(i)} cy={ys(p.mood)} r={2.5} fill={p.mood <= 2 ? 'var(--red)' : 'var(--accent-deep)'} />)}
    </svg>
  );
}

type TimelineItem = { date: string; icon: string; text: string; sub?: string };

export function MemberDetail() {
  const { id = '' } = useParams();
  const db = useStore((s) => s.db);
  const addOneOnOne = useStore((s) => s.addOneOnOne);
  const addKudos = useStore((s) => s.addKudos);
  const addLeave = useStore((s) => s.addLeave);
  const removeLeave = useStore((s) => s.removeLeave);
  const updateMember = useStore((s) => s.updateMember);
  const today = useToday();
  const clock = useClock();

  const m = db.members.find((x) => x.id === id);
  const [oo, setOO] = useState({ agenda: '', feedback: '', growthGoals: '', notes: '' });
  const [kudosNote, setKudosNote] = useState('');
  const [goals, setGoals] = useState(m?.careerGoals ?? '');
  const [leaveForm, setLeaveForm] = useState({ start: today, end: today, type: 'PTO' as 'PTO' | 'partial' | 'sick' });

  if (!m) return <div className="content"><p>Member not found. <Link to="/team">Back to team</Link></p></div>;
  const t = memberTrends(db, m.id);
  const role = db.roles.find((r) => r.id === m.roleId)?.name;

  const timeline: TimelineItem[] = [
    ...db.standups.filter((s) => s.memberId === m.id).map((s) => ({ date: s.date, icon: moodEmoji(s.mood), text: `Standup — ${s.today || s.yesterday || 'checked in'}`, sub: s.blockers ? `Blocker: ${s.blockers}` : undefined })),
    ...db.oneOnOnes.filter((o) => o.memberId === m.id).map((o) => ({ date: o.date, icon: '☕', text: '1:1', sub: o.feedback || o.agenda })),
    ...db.kudos.filter((k) => k.memberId === m.id).map((k) => ({ date: k.date, icon: '💛', text: 'Kudos', sub: k.note })),
    ...db.risks.filter((r) => r.ownerId === m.id).map((r) => ({ date: r.raisedDate, icon: '🧱', text: `${r.type} — ${r.status}`, sub: r.description })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);

  function saveOO() {
    if (!oo.agenda.trim() && !oo.feedback.trim()) return;
    addOneOnOne({ memberId: m!.id, date: today, weekNo: clock.weekNo, agenda: oo.agenda, feedback: oo.feedback, growthGoals: oo.growthGoals, recognition: '', notes: oo.notes });
    setOO({ agenda: '', feedback: '', growthGoals: '', notes: '' });
  }
  function saveKudos() {
    if (!kudosNote.trim()) return;
    addKudos({ memberId: m!.id, date: today, weekNo: clock.weekNo, note: kudosNote.trim() });
    setKudosNote('');
  }
  function saveLeave() {
    if (leaveForm.end < leaveForm.start) return;
    addLeave({ memberId: m!.id, startDate: leaveForm.start, endDate: leaveForm.end, type: leaveForm.type, note: '' });
  }
  const myLeave = db.leave.filter((l) => l.memberId === m.id).sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton fallback="/team" />
          <div><div className="crumb"><Link to="/team">Team</Link> · {m.name}</div><div className="tt">{m.name}</div></div>
        </div>
        <div className="top-actions"><Link className="btn btn-p" to={`/reports?member=${m.id}`}>Generate report →</Link></div>
      </div>

      <div className="content">
        <div className="row r2-1" style={{ alignItems: 'start' }}>
          <div>
            {/* header card */}
            <div className="card reveal d1" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span className={`av lg ${m.avatarTone ?? ''}`}>{initials(m.name)}</span>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontWeight: 600, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {m.name}
                  {m.status !== 'active' && <span className="pill blue" style={{ fontWeight: 500 }}>{m.status}</span>}
                </div>
                <div style={{ color: 'var(--ink-2)' }}>{role} · since {shortDate(m.startDate)}</div>
                <select value={m.status} onChange={(e) => updateMember(m.id, { status: e.target.value as MemberStatus })}
                  style={{ marginTop: 8, borderRadius: 9, border: '1px solid var(--line-2)', padding: '5px 8px', fontFamily: 'var(--body)', fontSize: 13, background: 'var(--card)', color: 'var(--ink-2)' }}>
                  <option value="active">● Active</option>
                  <option value="inactive">○ Inactive (paused)</option>
                  <option value="left">↩ Left the team</option>
                </select>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>{moodEmoji(t.avgMood)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>avg mood {t.avgMood ? t.avgMood.toFixed(1) : '–'}</div>
              </div>
            </div>

            {/* mood trend */}
            <div className="panel reveal d2 mt3">
              <div className="panel-h"><h3>💛 Mood trend</h3><span className="pill peach">{t.standupCount} check-ins</span></div>
              <div className="panel-b" style={{ paddingTop: 16 }}><Sparkline data={t.moodSeries} /></div>
            </div>

            {/* timeline */}
            <div className="panel reveal d3 mt3">
              <div className="panel-h"><h3>🗒️ Timeline</h3></div>
              <div className="panel-b">
                {timeline.length === 0 && <p style={{ color: 'var(--ink-2)', padding: '12px 0' }}>No history yet.</p>}
                {timeline.map((it, i) => (
                  <div className="flag" key={i}>
                    <span className="e">{it.icon}</span>
                    <div className="txt">{it.text}{it.sub && <small>{it.sub}</small>}</div>
                    <span className="age">{shortDate(it.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right rail: actions */}
          <div className="row" style={{ gap: 18 }}>
            <div className="panel reveal d2">
              <div className="panel-h"><h3>🎯 Growth goals</h3></div>
              <div className="panel-b" style={{ paddingTop: 14 }}>
                <textarea value={goals} onChange={(e) => setGoals(e.target.value)} onBlur={() => updateMember(m.id, { careerGoals: goals })}
                  rows={3} placeholder="What do they want to get better at?" style={taStyle} />
              </div>
            </div>

            <div className="panel reveal d3">
              <div className="panel-h"><h3>☕ Log a 1:1</h3></div>
              <div className="panel-b" style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={oo.agenda} onChange={(e) => setOO({ ...oo, agenda: e.target.value })} placeholder="Agenda" style={inStyle} />
                <textarea value={oo.feedback} onChange={(e) => setOO({ ...oo, feedback: e.target.value })} rows={2} placeholder="Feedback given (SBI)" style={taStyle} />
                <button className="btn btn-dark" onClick={saveOO}>Save 1:1</button>
              </div>
            </div>

            <div className="panel reveal d4">
              <div className="panel-h"><h3>💛 Log kudos</h3></div>
              <div className="panel-b" style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea value={kudosNote} onChange={(e) => setKudosNote(e.target.value)} rows={2} placeholder="A win worth recognising" style={taStyle} />
                <button className="btn btn-p" onClick={saveKudos}>Add kudos</button>
              </div>
            </div>

            <div className="panel reveal d5">
              <div className="panel-h"><h3>🌴 Leave</h3></div>
              <div className="panel-b" style={{ paddingTop: 14 }}>
                {myLeave.map((l) => (
                  <div className="flag" key={l.id}>
                    <span className="e">🌴</span>
                    <div className="txt">{l.type}<small>{shortDate(l.startDate)} → {shortDate(l.endDate)}</small></div>
                    <button className="go" onClick={() => removeLeave(l.id)}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="date" value={leaveForm.start} onChange={(e) => setLeaveForm({ ...leaveForm, start: e.target.value })} style={inStyle} />
                  <input type="date" value={leaveForm.end} onChange={(e) => setLeaveForm({ ...leaveForm, end: e.target.value })} style={inStyle} />
                  <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as 'PTO' | 'partial' | 'sick' })} style={inStyle}>
                    <option value="PTO">PTO</option><option value="partial">Partial</option><option value="sick">Sick</option>
                  </select>
                  <button className="btn btn-dark" onClick={saveLeave}>Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const inStyle: React.CSSProperties = { borderRadius: 11, border: '1px solid var(--line-2)', padding: '10px 12px', fontFamily: 'var(--body)', fontSize: 14, background: 'var(--card)', color: 'var(--ink)' };
const taStyle: React.CSSProperties = { ...inStyle, resize: 'vertical', width: '100%' };

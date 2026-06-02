import { useState } from 'react';
import { useStore } from '../store/store';
import { useToday } from '../store/selectors';
import { addDays, shortDate } from '../domain/dates';

interface Row { name: string; roleId: string }

export function Setup() {
  const db = useStore((s) => s.db);
  const updateProject = useStore((s) => s.updateProject);
  const addMember = useStore((s) => s.addMember);
  const addRole = useStore((s) => s.addRole);
  const loadDemo = useStore((s) => s.loadDemo);
  const today = useToday();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [weeks, setWeeks] = useState(11);
  const [goal, setGoal] = useState('');
  const [metrics, setMetrics] = useState('');
  const [rows, setRows] = useState<Row[]>([{ name: '', roleId: db.roles[0]?.id ?? '' }, { name: '', roleId: db.roles[0]?.id ?? '' }, { name: '', roleId: db.roles[0]?.id ?? '' }]);
  const [newRole, setNewRole] = useState('');

  const endDate = addDays(startDate, weeks * 7);
  const filled = rows.filter((r) => r.name.trim());
  const canFinish = name.trim() && filled.length > 0;

  const tones = ['', 'c2', 'c3', 'c4'];

  function finish() {
    if (!canFinish) return;
    updateProject({ name: name.trim(), startDate, endDate, goal: goal.trim(), successMetrics: metrics.trim(), rag: 'green' });
    filled.forEach((r, i) => addMember({ name: r.name.trim(), roleId: r.roleId || db.roles[0]?.id || '', status: 'active', startDate, careerGoals: '', notes: '', avatarTone: tones[i % 4] }));
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '40px 20px', position: 'relative', zIndex: 2 }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        <div className="reveal d1" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="s-brand" style={{ justifyContent: 'center', fontSize: 22 }}><span className="blob" />PM Assistant</div>
          <div className="greet" style={{ marginTop: 10 }}>Let’s set up your project 👋</div>
          <div className="greet-sub">A couple of details and you’re ready to lead from Week 1. You can change all of this later.</div>
        </div>

        {/* project */}
        <div className="card reveal d2">
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>🎯 Your project</div>
          <label style={lbl}>Project name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Onboarding Revamp" style={inp} />
          <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={lbl}>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inp} />
            </div>
            <div style={{ width: 120 }}>
              <label style={lbl}>Length (weeks)</label>
              <input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Math.max(1, Number(e.target.value)))} style={inp} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={lbl}>Ends</label>
              <div style={{ ...inp, color: 'var(--ink-2)', background: 'var(--cream-2)' }}>{shortDate(endDate)}</div>
            </div>
          </div>
          <label style={{ ...lbl, marginTop: 12 }}>Goal <span style={{ color: 'var(--ink-3)' }}>(optional now — Week 1 coaching helps you sharpen it)</span></label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="In one sentence a non-expert would understand…" style={{ ...inp, resize: 'vertical' }} />
          <label style={{ ...lbl, marginTop: 12 }}>Success metrics <span style={{ color: 'var(--ink-3)' }}>(optional)</span></label>
          <input value={metrics} onChange={(e) => setMetrics(e.target.value)} placeholder="e.g. Activation ≥ 60% · drop-off < 25%" style={inp} />
        </div>

        {/* team */}
        <div className="card reveal d3 mt3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>👥 Your team</div>
            <button className="go" onClick={() => setRows([...rows, { name: '', roleId: db.roles[0]?.id ?? '' }])}>+ Add row</button>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={r.name} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={`Teammate ${i + 1}`} style={{ ...inp, flex: 1 }} />
              <select value={r.roleId} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, roleId: e.target.value } : x))} style={{ ...inp, width: 160 }}>
                {db.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Add a custom role…" style={{ ...inp, flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter' && newRole.trim()) { addRole(newRole.trim()); setNewRole(''); } }} />
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Roles: {db.roles.map((r) => r.name).join(' · ')}</span>
          </div>
        </div>

        <div className="reveal d4 mt3" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-p" disabled={!canFinish} onClick={finish} style={{ opacity: canFinish ? 1 : 0.5 }}>Start leading →</button>
          <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>or</span>
          <button className="btn btn-ghost" onClick={loadDemo}>🎬 Explore with demo data</button>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)', marginBottom: 6 };
const inp: React.CSSProperties = { width: '100%', borderRadius: 11, border: '1px solid var(--line-2)', padding: '10px 12px', fontFamily: 'var(--body)', fontSize: 14.5, background: 'var(--card)', color: 'var(--ink)' };

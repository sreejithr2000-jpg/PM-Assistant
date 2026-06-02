import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, initials } from '../store/store';
import { useFlags, useToday } from '../store/selectors';
import { memberTrends, moodEmoji } from '../domain/trends';
import { shortDate } from '../domain/dates';

export function Team() {
  const db = useStore((s) => s.db);
  const addMember = useStore((s) => s.addMember);
  const today = useToday();
  const flags = useFlags();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState(db.roles[0]?.id ?? '');

  const active = db.members.filter((m) => m.status === 'active');

  function submit() {
    if (!name.trim()) return;
    addMember({ name: name.trim(), roleId, status: 'active', startDate: today, careerGoals: '', notes: '', avatarTone: ['', 'c2', 'c3', 'c4'][db.members.length % 4] });
    setName(''); setAdding(false);
  }

  return (
    <>
      <div className="topbar">
        <div><div className="crumb">Team</div><div className="tt">Your team</div></div>
        <div className="top-actions">
          <Link className="btn btn-ghost" to="/attendance">🗓️ Attendance</Link>
          <button className="btn btn-p" onClick={() => setAdding((a) => !a)}>+ Add member</button>
        </div>
      </div>

      <div className="content">
        {adding && (
          <div className="card reveal d1 mb2" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
              style={inputStyle} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={inputStyle}>
              {db.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button className="btn btn-dark" onClick={submit}>Add</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        )}

        <div className="row r3">
          {active.map((m, i) => {
            const t = memberTrends(db, m.id);
            const memberFlags = flags.filter((f) => f.memberId === m.id);
            return (
              <Link to={`/team/${m.id}`} key={m.id} className={`card reveal d${(i % 5) + 1}`} style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`av lg ${m.avatarTone ?? ''}`}>{initials(m.name)}</span>
                  <div>
                    <div className="display" style={{ fontWeight: 600, fontSize: 17 }}>{m.name}</div>
                    <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{db.roles.find((r) => r.id === m.roleId)?.name}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 24 }}>{moodEmoji(t.avgMood)}</span>
                </div>
                <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 13, color: 'var(--ink-2)' }}>
                  <div><b className="mono-num">{t.standupCount}</b> check-ins</div>
                  <div><b className="mono-num">{Math.round(t.trackerRate * 100)}%</b> tracker</div>
                  <div><b className="mono-num">{t.kudosCount}</b> kudos</div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 22 }}>
                  {memberFlags.length === 0
                    ? <span className="pill green">all good</span>
                    : memberFlags.map((f) => <span key={f.id} className="pill amber">{f.emoji} {f.kind.replace('_', ' ')}</span>)}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)' }}>Last check-in: {t.lastStandup ? shortDate(t.lastStandup) : '—'}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  borderRadius: 11, border: '1px solid var(--line-2)', padding: '10px 14px',
  fontFamily: 'var(--body)', fontSize: 14.5, background: 'var(--card)', color: 'var(--ink)',
};

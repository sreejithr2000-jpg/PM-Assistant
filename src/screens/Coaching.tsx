import { useState } from 'react';
import { useStore } from '../store/store';
import { useClock, useToday, useCoaching } from '../store/selectors';
import { evaluateChecks, crossWeekNudges } from '../domain/coaching';
import { sprintNumberForWeek } from '../domain/sprints';

export function Coaching() {
  const db = useStore((s) => s.db);
  const toggleResource = useStore((s) => s.toggleResource);
  const today = useToday();
  const clock = useClock();
  const coaching = useCoaching();
  const [week, setWeek] = useState(clock.weekNo);

  const module = coaching.find((m) => m.weekNo === week);
  const checks = module ? evaluateChecks(db, today, module.checks) : [];
  const nudges = crossWeekNudges(db, today);

  return (
    <>
      <div className="topbar">
        <div><div className="crumb">Coaching</div><div className="tt">Your PM curriculum</div></div>
        <div className="top-actions" style={{ gap: 6 }}>
          {coaching.map((m) => {
            const allReviewed = m.resources.length > 0 && m.resources.every((r) => db.coachingProgress[r.id]);
            return (
              <button key={m.weekNo} onClick={() => setWeek(m.weekNo)} title={allReviewed ? 'All resources reviewed' : undefined}
                className="pill" style={{ cursor: 'pointer', border: 'none', background: m.weekNo === week ? 'var(--accent)' : m.weekNo === clock.weekNo ? 'var(--accent-tint)' : 'var(--cream-3)', color: m.weekNo === week ? '#3a2a1c' : 'var(--ink-2)', padding: '6px 10px' }}>
                W{m.weekNo}{allReviewed ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="content">
        {!module ? <p>No module for this week.</p> : (
          <div className="row r2-1" style={{ alignItems: 'start' }}>
            <div>
              <div className="card reveal d1" style={{ background: 'linear-gradient(165deg,var(--ink),#3a332b)', color: 'var(--cream)', border: 'none' }}>
                <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Week {module.weekNo} · Sprint {sprintNumberForWeek(module.weekNo, db.settings.sprintLengthWeeks)}{module.weekNo === clock.weekNo ? ' · this week' : ''}
                </div>
                <div className="display" style={{ fontWeight: 600, fontSize: 26, margin: '8px 0 10px', letterSpacing: '-.02em' }}>{module.topic}</div>
                <p style={{ fontSize: 15, color: '#D9CFC4', lineHeight: 1.55 }}>{module.theme}</p>
              </div>

              {module.session && (() => {
                const sid = `w${module.weekNo}-session`;
                const attended = !!db.coachingProgress[sid];
                return (
                  <div className="card reveal d2 mt3" style={{ border: '1px solid var(--line-2)', background: attended ? 'var(--green-tint)' : 'var(--accent-tint)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 28 }}>🎓</span>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-deep)' }}>Live program session this week</div>
                        <div className="display" style={{ fontWeight: 600, fontSize: 18, margin: '2px 0' }}>{module.session.topic}</div>
                        <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>📅 {module.session.when} · {module.session.presenter}</div>
                      </div>
                      <button className={attended ? 'btn btn-ghost' : 'btn btn-dark'} onClick={() => toggleResource(sid)}>
                        {attended ? '✓ Attended' : 'Mark attended'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="row r1-1 mt3">
                <div className="panel reveal d2">
                  <div className="panel-h"><h3>📚 Learn this week</h3></div>
                  <div className="panel-b" style={{ paddingTop: 12 }}>
                    {module.learn.map((l, i) => <div className="flag" key={i}><span className="e">📖</span><div className="txt">{l}</div></div>)}
                  </div>
                </div>
                <div className="panel reveal d3">
                  <div className="panel-h"><h3>✅ Do this week</h3></div>
                  <div className="panel-b" style={{ paddingTop: 12 }}>
                    {module.doThisWeek.map((l, i) => <div className="flag" key={i}><span className="e">→</span><div className="txt">{l}</div></div>)}
                  </div>
                </div>
              </div>

              <div className="card reveal d4 mt3" style={{ background: 'var(--accent-tint)', border: '1px solid var(--line-2)' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-deep)', marginBottom: 6 }}>🪞 Reflection</div>
                <p style={{ fontStyle: 'italic', color: 'var(--ink)', fontSize: 15.5 }}>{module.reflection}</p>
              </div>

              <div className="panel reveal d5 mt3">
                <div className="panel-h">
                  <h3>📦 Resources</h3>
                  <span className="pill peach">{module.resources.filter((r) => db.coachingProgress[r.id]).length}/{module.resources.length} reviewed</span>
                </div>
                <div className="panel-b" style={{ paddingTop: 8 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '4px 0 6px' }}>Open one to mark it reviewed — or tick it yourself. Progress is saved.</p>
                  {module.resources.map((r) => {
                    const done = !!db.coachingProgress[r.id];
                    return (
                      <div className="check" key={r.id} style={{ cursor: 'default' }}>
                        <button className="tick" onClick={() => toggleResource(r.id)}
                          style={{ background: done ? 'var(--green)' : 'transparent', borderColor: done ? 'var(--green)' : 'var(--line-2)', cursor: 'pointer' }}
                          title={done ? 'Mark as not reviewed' : 'Mark as reviewed'}>{done ? '✓' : ''}</button>
                        <a href={r.url} target="_blank" rel="noreferrer" onClick={() => toggleResource(r.id, true)}
                          className="nm" style={{ flex: 1, color: done ? 'var(--ink-3)' : 'var(--accent-deep)', fontWeight: 500, textDecoration: done ? 'line-through' : 'none' }}>
                          {r.label} ↗
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* checks rail */}
            <div className="row" style={{ gap: 18 }}>
              <div className="panel reveal d2">
                <div className="panel-h"><h3>🔎 Best-practice checks</h3><span className="pill peach">{checks.filter((c) => c.pass).length}/{checks.length}</span></div>
                <div className="panel-b">
                  <p style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '8px 0 4px' }}>⚡ Auto-tracked from your data — these tick themselves as you do the work. No need to check them off.</p>
                  {checks.map((c) => (
                    <div className="check" key={c.id} style={{ cursor: 'default' }}>
                      <span className="tick" style={{ background: c.pass ? 'var(--green)' : 'transparent', borderColor: c.pass ? 'var(--green)' : 'var(--line-2)' }}>{c.pass ? '✓' : ''}</span>
                      <div className="nm" style={{ color: c.pass ? 'var(--ink-3)' : 'var(--ink)' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel reveal d3">
                <div className="panel-h"><h3>♻️ Always-on habits</h3></div>
                <div className="panel-b">
                  {nudges.map((c) => (
                    <div className="check" key={c.id} style={{ cursor: 'default' }}>
                      <span className="tick" style={{ background: c.pass ? 'var(--green)' : 'transparent', borderColor: c.pass ? 'var(--green)' : 'var(--amber)' }}>{c.pass ? '✓' : '!'}</span>
                      <div className="nm" style={{ color: c.pass ? 'var(--ink-3)' : 'var(--ink)' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

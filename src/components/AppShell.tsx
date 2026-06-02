import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useClock } from '../store/selectors';
import { sprintNumberForWeek, totalSprints } from '../domain/sprints';

// The persistent app shell: warm sidebar + main content area.
// Week badge + team count now read live from the store (no more Phase-0 hardcoding).

export function AppShell() {
  const clock = useClock();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const activeCount = useStore((s) => s.db.members.filter((m) => m.status === 'active').length);
  const sprintLen = useStore((s) => s.db.settings.sprintLengthWeeks);
  const hasDates = useStore((s) => !!s.db.project.startDate);

  const nav = [
    { to: '/', icon: '◐', label: 'Home', count: undefined as number | undefined },
    { to: '/team', icon: '👥', label: 'Team', count: activeCount },
    { to: '/insights', icon: '📊', label: 'Insights', count: undefined },
    { to: '/coaching', icon: '🧭', label: 'Coaching', count: undefined },
    { to: '/project', icon: '🎯', label: 'Project', count: undefined },
    { to: '/sprints', icon: '🏃', label: 'Sprints', count: undefined },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="s-brand"><span className="blob" />PM Assistant</div>

        <div className="wk-badge">
          <div className="lbl" style={{ fontFamily: 'var(--body)', letterSpacing: '.1em' }}>Today</div>
          <div className="wk">
            {clock.isComplete ? (
              <>Project <b>complete</b></>
            ) : (
              <>Week <b>{clock.weekNo}</b> <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>/ {clock.totalWeeks}</span></>
            )}
          </div>
          <div className="wk-bar"><i style={{ width: `${clock.elapsedPct}%` }} /></div>
          {hasDates && !clock.isComplete && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, fontWeight: 500 }}>
              Sprint <b style={{ color: 'var(--accent-deep)' }}>{sprintNumberForWeek(clock.weekNo, sprintLen)}</b> / {totalSprints(clock.totalWeeks, sprintLen)}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`); }} style={{ marginBottom: 14 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search…"
            style={{ width: '100%', borderRadius: 10, border: '1px solid var(--line)', padding: '9px 12px', fontFamily: 'var(--body)', fontSize: 13.5, background: 'var(--card)', color: 'var(--ink)' }} />
        </form>

        <nav className="nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'on' : undefined)}>
              <span className="ico">{item.icon}</span>
              {item.label}
              {item.count != null && <span className="count">{item.count}</span>}
            </NavLink>
          ))}
        </nav>

        <NavLink className="side-cta" to="/standup">☀️ Run standup</NavLink>

        <NavLink to="/settings" className="side-foot" style={{ textDecoration: 'none' }}>
          <span className="av">S</span>
          <div>Sreejith<br /><span style={{ color: 'var(--ink-3)', fontSize: 12 }}>Product Manager</span></div>
        </NavLink>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

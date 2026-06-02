import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useClock, useToday } from '../store/selectors';
import { computeFlags } from '../domain/flags';
import { sprintNumberForWeek, totalSprints } from '../domain/sprints';
import { standupCoverage, teamSentiment, moodEmoji } from '../domain/trends';
import { daysBetween, prettyDate } from '../domain/dates';
import { downloadJSON } from '../data/persistence';

const RAG_LABEL: Record<string, string> = { green: 'On track', amber: 'At risk', red: 'Off track' };

export function Home() {
  const db = useStore((s) => s.db);
  const dismissFlag = useStore((s) => s.dismissFlag);
  const restoreFlag = useStore((s) => s.restoreFlag);
  const recordBackup = useStore((s) => s.recordBackup);
  const today = useToday();
  const clock = useClock();
  const [showSnoozed, setShowSnoozed] = useState(false);

  const allFlags = useMemo(() => computeFlags(db, today, true), [db, today]);
  const flags = allFlags.filter((f) => !(f.id in db.settings.dismissedFlags));
  const snoozed = allFlags.filter((f) => f.id in db.settings.dismissedFlags);

  function snooze(id: string) {
    const reason = window.prompt('Snooze this flag — why? (kept as an audit note; the flag returns if it still applies after you restore it)');
    if (reason !== null) dismissFlag(id, reason || 'snoozed');
  }

  const backupDue = db.settings.weeklyBackupOn && (!db.settings.lastBackupDate || daysBetween(db.settings.lastBackupDate, today) >= 7);
  function backupNow() {
    downloadJSON(db, `PM-Assistant-${today}.json`);
    recordBackup(today);
  }

  const coverage = standupCoverage(db, today);
  const done = coverage.filter((c) => c.done).length;
  const pendingCount = coverage.filter((c) => !c.done && !c.onLeave).length;
  const total = coverage.filter((c) => !c.onLeave).length;

  const openBlockers = db.risks.filter((r) => r.status === 'open' && r.type === 'blocker');
  const agingBlockers = flags.filter((f) => f.kind === 'blocker').length;
  const actionsDue = db.actions.filter((a) => a.status === 'open' && a.dueDate && daysBetween(a.dueDate, today) >= 0);

  const sentiment = teamSentiment(db, clock.totalWeeks).filter((w) => w.count > 0);
  const maxMood = 5;

  const module = db.coaching.find((m) => m.weekNo === clock.weekNo);
  const doneMilestones = db.milestones.filter((m) => m.status === 'done').length;

  const part = new Date(today).getHours() < 12 ? 'morning' : 'afternoon';

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">Home</div>
          <div className="tt">{prettyDate(today)}</div>
        </div>
        <div className="top-actions">
          <Link className="btn btn-p" to="/standup">☀️ Run standup</Link>
        </div>
      </div>

      <div className="content">
        <div className="reveal d1">
          <div className="greet">Good {part}, Sreejith 👋</div>
          <div className="greet-sub">
            You're in <b>Week {clock.weekNo} of {clock.totalWeeks}</b>
            {' · '}<b>Sprint {sprintNumberForWeek(clock.weekNo, db.settings.sprintLengthWeeks)} of {totalSprints(clock.totalWeeks, db.settings.sprintLengthWeeks)}</b>
            {pendingCount > 0 ? ` — ${pendingCount} standup${pendingCount > 1 ? 's' : ''} still to do` : ' — all checked in'}
            {flags.length > 0 ? `, and ${flags.length} thing${flags.length > 1 ? 's' : ''} worth a look.` : '. Nothing flagged today.'}
          </div>
        </div>

        {backupDue && (
          <div className="card reveal d1 mt3" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--amber-tint)', border: '1px solid var(--line-2)' }}>
            <span style={{ fontSize: 22 }}>💾</span>
            <div style={{ flex: 1, fontSize: 14 }}>
              <b>Time for your weekly backup.</b>{' '}
              {db.settings.lastBackupDate ? `Last backup was ${daysBetween(db.settings.lastBackupDate, today)} days ago.` : 'You haven’t backed up yet.'} A one-file export keeps your data safe.
            </div>
            <button className="btn btn-dark" onClick={backupNow}>Back up now</button>
          </div>
        )}

        {/* STAT ROW */}
        <div className="row r4 mt3">
          <div className="card stat reveal d2">
            <div className="k">Standups today</div>
            <div className="v mono-num">{done}<small>/{total}</small></div>
            <div className="meta"><div className="bar" style={{ flex: 1 }}><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div></div>
          </div>
          <div className="card stat reveal d3">
            <div className="k">Open blockers</div>
            <div className="v mono-num">{openBlockers.length}</div>
            <div className="meta">{agingBlockers > 0 ? `🧱 ${agingBlockers} aging past ${db.settings.thresholds.blockerAgingDays} days` : 'all moving'}</div>
          </div>
          <div className="card stat reveal d4">
            <div className="k">Action items due</div>
            <div className="v mono-num">{actionsDue.length}</div>
            <div className="meta">⏳ {actionsDue.filter((a) => a.dueDate === today).length} due today</div>
          </div>
          <div className="card stat reveal d5">
            <div className="k">Project status</div>
            <div className="v"><span className={`rag ${db.project.rag}`} style={{ fontSize: 22 }}><span className="dot" />{RAG_LABEL[db.project.rag]}</span></div>
            <div className="meta">Milestone {doneMilestones} of {db.milestones.length}</div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="row r2-1 mt4">
          {/* flags */}
          <div className="panel reveal d3">
            <div className="panel-h"><h3>🔔 Today's flags</h3><span className="pill peach">{flags.length} to review</span></div>
            <div className="panel-b">
              {flags.length === 0 && <p style={{ color: 'var(--ink-2)', padding: '12px 0' }}>Nothing flagged — the small things are handled. ✨</p>}
              {flags.map((f) => (
                <div className="flag" key={f.id}>
                  <span className="e">{f.emoji}</span>
                  <div className="txt">{f.title}<small>{f.subtitle}</small></div>
                  <span className="age">{f.age}</span>
                  <Link className="go" to={f.to}>{f.cta}</Link>
                  <button className="go" onClick={() => snooze(f.id)} title="Snooze with a reason" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>💤</button>
                </div>
              ))}

              {snoozed.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <button className="go" onClick={() => setShowSnoozed((v) => !v)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>
                    {showSnoozed ? '▾' : '▸'} Snoozed ({snoozed.length})
                  </button>
                  {showSnoozed && snoozed.map((f) => (
                    <div className="flag" key={f.id} style={{ opacity: 0.7 }}>
                      <span className="e">{f.emoji}</span>
                      <div className="txt">{f.title}<small>Snoozed: “{db.settings.dismissedFlags[f.id]}”</small></div>
                      <button className="go" onClick={() => restoreFlag(f.id)}>Restore →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* right column */}
          <div className="row" style={{ gap: 18 }}>
            <div className="panel reveal d4">
              <div className="panel-h"><h3>☀️ Standup checklist</h3><Link to="/standup">Run →</Link></div>
              <div className="panel-b">
                <div className="checks">
                  {coverage.map((c) => (
                    <div className={`check${c.done ? ' done' : ''}`} key={c.member.id}>
                      <span className="tick">{c.done ? '✓' : ''}</span>
                      <div><div className="nm">{c.member.name}</div><div className="role">{db.roles.find((r) => r.id === c.member.roleId)?.name}</div></div>
                      <div className="right">
                        {c.done ? <span className="mood">{moodEmoji(c.mood)}</span>
                          : c.onLeave ? <span className="pill blue">on leave</span>
                            : <span className="pill peach">pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {module && (
              <div className="card reveal d5" style={{ background: 'linear-gradient(165deg,var(--ink),#3a332b)', color: 'var(--cream)', border: 'none' }}>
                <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Week {clock.weekNo} coaching</div>
                <div className="display" style={{ fontWeight: 600, fontSize: 19, margin: '8px 0', letterSpacing: '-.01em' }}>{module.topic}</div>
                <p style={{ fontSize: 14, color: '#D9CFC4', lineHeight: 1.5 }}>{module.theme}</p>
                {module.session && (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--cream)', background: 'rgba(229,152,102,.18)', borderRadius: 10, padding: '8px 11px' }}>
                    🎓 <b style={{ color: 'var(--accent)' }}>{module.session.topic}</b><br />
                    <span style={{ color: '#D9CFC4' }}>{module.session.when} · {module.session.presenter}</span>
                  </div>
                )}
                <Link className="btn" style={{ background: 'var(--accent)', color: '#3a2a1c', marginTop: 14 }} to="/coaching">Open this week →</Link>
              </div>
            )}
          </div>
        </div>

        {/* sentiment + milestones */}
        <div className="row r1-1 mt4">
          <div className="panel reveal d4">
            <div className="panel-h"><h3>💛 Team sentiment</h3><Link to="/insights">Details →</Link></div>
            <div className="panel-b" style={{ paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 90 }}>
                {sentiment.map((w) => {
                  const h = w.avg ? (w.avg / maxMood) * 80 + 10 : 6;
                  const low = (w.avg ?? 5) < 3;
                  return (
                    <div key={w.weekNo} style={{ flex: 1, textAlign: 'center' }}>
                      <div className={`bar${low ? '' : ' green'}`} style={{ height: h, width: 14, margin: '0 auto', borderRadius: 8 }}>
                        <i style={{ height: '100%', background: low ? 'var(--amber)' : undefined }} />
                      </div>
                      <small style={{ fontSize: 11, color: 'var(--ink-3)' }}>W{w.weekNo}</small>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 14 }}>
                {flags.some((f) => f.kind === 'mood') ? 'A dip this week — check the mood flags above.' : 'Team morale is holding steady.'}
              </p>
            </div>
          </div>

          <div className="panel reveal d5">
            <div className="panel-h"><h3>🎯 Milestones</h3><Link to="/project">All →</Link></div>
            <div className="panel-b" style={{ paddingTop: 8 }}>
              {db.milestones.slice(0, 4).map((m) => (
                <div className="flag" key={m.id}>
                  <span className={`pill ${m.status === 'done' ? 'green' : m.status === 'on_track' ? 'amber' : m.status === 'at_risk' ? 'red' : 'blue'}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                  <div className="txt" style={{ marginLeft: 4 }}>{m.title}<small>Week {m.weekNo}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

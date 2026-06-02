import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useClock, useFlags } from '../store/selectors';
import { memberTrends, teamSentiment, moodEmoji } from '../domain/trends';

export function Insights() {
  const db = useStore((s) => s.db);
  const clock = useClock();
  const flags = useFlags();
  const active = db.members.filter((m) => m.status === 'active');
  const sentiment = teamSentiment(db, clock.totalWeeks).filter((w) => w.count > 0);

  const flagByKind = flags.reduce<Record<string, number>>((acc, f) => { acc[f.kind] = (acc[f.kind] ?? 0) + 1; return acc; }, {});
  const teamAvgMood = (() => {
    const all = active.map((m) => memberTrends(db, m.id).avgMood).filter((x): x is number => x != null);
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
  })();
  const teamTracker = (() => {
    const rates = active.map((m) => memberTrends(db, m.id).trackerRate);
    return rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  })();

  return (
    <>
      <div className="topbar">
        <div><div className="crumb">Insights</div><div className="tt">Team analytics</div></div>
      </div>

      <div className="content">
        <div className="row r4">
          <div className="card stat reveal d1"><div className="k">Team size</div><div className="v mono-num">{active.length}</div></div>
          <div className="card stat reveal d2"><div className="k">Avg mood</div><div className="v">{teamAvgMood ? teamAvgMood.toFixed(1) : '–'} <span style={{ fontSize: 22 }}>{moodEmoji(teamAvgMood)}</span></div></div>
          <div className="card stat reveal d3"><div className="k">Tracker rate</div><div className="v mono-num">{Math.round(teamTracker * 100)}<small>%</small></div></div>
          <div className="card stat reveal d4"><div className="k">Open flags</div><div className="v mono-num">{flags.length}</div></div>
        </div>

        {/* sentiment over time */}
        <div className="panel reveal d2 mt4">
          <div className="panel-h"><h3>💛 Team sentiment over the project</h3></div>
          <div className="panel-b" style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
              {sentiment.map((w) => {
                const h = w.avg ? (w.avg / 5) * 100 + 8 : 6;
                const low = (w.avg ?? 5) < 3;
                return (
                  <div key={w.weekNo} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{w.avg ? w.avg.toFixed(1) : ''}</div>
                    <div className={`bar${low ? '' : ' green'}`} style={{ height: h, width: 20, margin: '0 auto', borderRadius: 8 }}><i style={{ height: '100%', background: low ? 'var(--amber)' : undefined }} /></div>
                    <small style={{ fontSize: 11, color: 'var(--ink-3)' }}>W{w.weekNo}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* per-person breakdown table */}
        <div className="panel reveal d3 mt4">
          <div className="panel-h"><h3>👥 Per-person breakdown</h3></div>
          <div className="panel-b" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  <th style={th}>Member</th><th style={th}>Mood</th><th style={th}>Check-ins</th><th style={th}>Tracker</th><th style={th}>Kudos</th><th style={th}>Blockers</th><th style={th}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {active.map((m) => {
                  const t = memberTrends(db, m.id);
                  const mf = flags.filter((f) => f.memberId === m.id).length;
                  return (
                    <tr key={m.id} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={td}><Link to={`/team/${m.id}`} style={{ fontWeight: 600 }}>{m.name}</Link><div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{db.roles.find((r) => r.id === m.roleId)?.name}</div></td>
                      <td style={td}>{moodEmoji(t.avgMood)} {t.avgMood ? t.avgMood.toFixed(1) : '–'}</td>
                      <td style={td} className="mono-num">{t.standupCount}</td>
                      <td style={td} className="mono-num">{Math.round(t.trackerRate * 100)}%</td>
                      <td style={td} className="mono-num">{t.kudosCount}</td>
                      <td style={td} className="mono-num">{t.blockersResolved}/{t.blockersRaised}</td>
                      <td style={td}>{mf === 0 ? <span className="pill green">0</span> : <span className="pill amber">{mf}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* flag summary */}
        <div className="panel reveal d4 mt4">
          <div className="panel-h"><h3>🔔 Open flags by type</h3></div>
          <div className="panel-b" style={{ paddingTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.keys(flagByKind).length === 0 ? <p style={{ color: 'var(--ink-2)' }}>No open flags. ✨</p>
              : Object.entries(flagByKind).map(([kind, n]) => <span key={kind} className="pill amber" style={{ fontSize: 13, padding: '6px 12px' }}>{kind.replace('_', ' ')}: {n}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = { padding: '12px 20px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 20px' };

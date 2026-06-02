import { Link, useSearchParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore } from '../store/store';
import { shortDate } from '../domain/dates';

interface Hit { icon: string; title: string; sub: string; to: string; group: string }

export function Search() {
  const db = useStore((s) => s.db);
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();

  const memberName = (id: string | null) => db.members.find((m) => m.id === id)?.name ?? 'Unassigned';
  const has = (...parts: (string | null | undefined)[]) => parts.some((p) => p && p.toLowerCase().includes(q));

  const hits: Hit[] = [];
  if (q.length > 0) {
    for (const m of db.members) if (has(m.name, m.careerGoals, m.notes, db.roles.find((r) => r.id === m.roleId)?.name))
      hits.push({ icon: '👤', title: m.name, sub: db.roles.find((r) => r.id === m.roleId)?.name ?? '', to: `/team/${m.id}`, group: 'People' });
    for (const d of db.decisions) if (has(d.title, d.description, d.rationale, ...d.tags))
      hits.push({ icon: '📔', title: d.title, sub: `Why: ${d.rationale}`, to: '/project', group: 'Decisions' });
    for (const r of db.risks) if (has(r.description))
      hits.push({ icon: r.type === 'blocker' ? '🧱' : '⚠️', title: r.description, sub: `${r.type} · ${r.status} · ${memberName(r.ownerId)}`, to: '/project', group: 'Risks & blockers' });
    for (const a of db.actions) if (has(a.description))
      hits.push({ icon: '✅', title: a.description, sub: `${a.status} · ${memberName(a.ownerId)}`, to: '/project', group: 'Action items' });
    for (const t of db.todos) if (has(t.description))
      hits.push({ icon: '📌', title: t.description, sub: t.status, to: '/project', group: 'PM to-dos' });
    for (const k of db.kudos) if (has(k.note))
      hits.push({ icon: '💛', title: k.note, sub: `${memberName(k.memberId)} · ${shortDate(k.date)}`, to: `/team/${k.memberId}`, group: 'Kudos' });
    for (const o of db.oneOnOnes) if (has(o.agenda, o.feedback, o.notes, o.growthGoals))
      hits.push({ icon: '☕', title: `1:1 — ${memberName(o.memberId)}`, sub: o.feedback || o.agenda, to: `/team/${o.memberId}`, group: '1:1s' });
    for (const s of db.standups) if (has(s.yesterday, s.today, s.blockers))
      hits.push({ icon: '☀️', title: `${memberName(s.memberId)} — ${shortDate(s.date)}`, sub: s.blockers || s.today || s.yesterday, to: `/team/${s.memberId}`, group: 'Standups' });
  }

  const groups = [...new Set(hits.map((h) => h.group))];

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <div><div className="crumb">Search</div><div className="tt">{q ? `Results for “${q}”` : 'Search'}</div></div>
        </div>
      </div>
      <div className="content">
        {q.length === 0 && <p style={{ color: 'var(--ink-2)' }}>Type in the search box to find people, decisions, risks, action items, kudos, 1:1s and standup notes.</p>}
        {q.length > 0 && hits.length === 0 && <div className="card reveal d1" style={{ maxWidth: 480 }}><p style={{ color: 'var(--ink-2)' }}>No matches for “{q}”.</p></div>}
        {groups.map((g, gi) => (
          <div className={`panel reveal d${(gi % 4) + 1} ${gi > 0 ? 'mt3' : ''}`} key={g}>
            <div className="panel-h"><h3>{g}</h3><span className="pill peach">{hits.filter((h) => h.group === g).length}</span></div>
            <div className="panel-b">
              {hits.filter((h) => h.group === g).map((h, i) => (
                <Link className="flag" to={h.to} key={i} style={{ textDecoration: 'none' }}>
                  <span className="e">{h.icon}</span>
                  <div className="txt">{highlight(h.title, q)}<small>{h.sub}</small></div>
                  <span className="go">Open →</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function highlight(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)', borderRadius: 4 }}>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

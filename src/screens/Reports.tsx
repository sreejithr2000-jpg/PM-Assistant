import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore } from '../store/store';
import { useToday, useClock } from '../store/selectors';
import { buildMemberReport, buildWeeklyStatus } from '../domain/report';
import { downloadText } from '../data/persistence';

// minimal markdown → HTML (headings, bold, bullet lists, paragraphs).
// HTML-escape first so free-text fields (PM notes, kudos) can never inject markup.
function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  const inline = (s: string) => escapeHTML(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#\s/.test(line)) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (/^##\s/.test(line)) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^\s*-\s/.test(line)) { if (!inList) { out.push('<ul>'); inList = true; } out.push(`<li>${inline(line.replace(/^\s*-\s/, ''))}</li>`); }
    else if (line === '') { if (inList) { out.push('</ul>'); inList = false; } }
    else { if (inList) { out.push('</ul>'); inList = false; } out.push(`<p>${inline(line)}</p>`); }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

export function Reports() {
  const db = useStore((s) => s.db);
  const today = useToday();
  const clock = useClock();
  const [params] = useSearchParams();
  const active = db.members.filter((m) => m.status === 'active');

  const [memberId, setMemberId] = useState(params.get('member') ?? active[0]?.id ?? '');
  const [shared, setShared] = useState(false);
  const [pmNotes, setPmNotes] = useState('');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [mode, setMode] = useState<'member' | 'weekly'>('member');

  const md = mode === 'weekly'
    ? buildWeeklyStatus(db, clock.weekNo, today)
    : buildMemberReport(db, memberId, today, { shared, pmNotes, includeNotesInShared: includeNotes });

  const filename = mode === 'weekly'
    ? `weekly-status-week-${clock.weekNo}.md`
    : `report-${db.members.find((m) => m.id === memberId)?.name.replace(/\s+/g, '-').toLowerCase()}-${shared ? 'shared' : 'full'}.md`;

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="no-print">
          <BackButton />
          <div><div className="crumb">Reports</div><div className="tt">Reports & exports</div></div>
        </div>
        <div className="top-actions">
          <button className="btn btn-ghost" onClick={() => downloadText(md, filename)}>⬇ Markdown</button>
          <button className="btn btn-p" onClick={() => window.print()}>🖨 Print / PDF</button>
        </div>
      </div>

      <div className="content">
        <div className="row r2-1" style={{ alignItems: 'start' }}>
          {/* preview */}
          <div className="card reveal d1 report-print" style={{ padding: '28px 34px' }}>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }} className="md" />
          </div>

          {/* controls */}
          <div className="panel reveal d2 no-print">
            <div className="panel-h"><h3>⚙️ Report options</h3></div>
            <div className="panel-b" style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Report type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={pick(mode === 'member')} onClick={() => setMode('member')}>Per-person</button>
                  <button className="btn btn-ghost" style={pick(mode === 'weekly')} onClick={() => setMode('weekly')}>Weekly status</button>
                </div>
              </div>

              {mode === 'member' && (
                <>
                  <div>
                    <label style={lbl}>Member</label>
                    <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ ...inp, width: '100%' }}>
                      {active.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>Audience</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" style={pick(!shared)} onClick={() => setShared(false)}>🔒 Full (PM)</button>
                      <button className="btn btn-ghost" style={pick(shared)} onClick={() => setShared(true)}>🤝 Shared</button>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>
                      {shared ? 'The version you give the team member. PM notes are hidden unless you opt in below.' : 'Your full copy — includes private PM notes.'}
                    </p>
                  </div>

                  <div>
                    <label style={lbl}>PM notes <span style={{ color: 'var(--ink-3)' }}>(private by default)</span></label>
                    <textarea value={pmNotes} onChange={(e) => setPmNotes(e.target.value)} rows={4} placeholder="Your honest assessment…" style={{ ...inp, width: '100%', resize: 'vertical' }} />
                    {shared && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13.5, cursor: 'pointer' }}>
                        <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} />
                        Include these notes in the shared report
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)', marginBottom: 6 };
const inp: React.CSSProperties = { borderRadius: 11, border: '1px solid var(--line-2)', padding: '9px 12px', fontFamily: 'var(--body)', fontSize: 14, background: 'var(--card)', color: 'var(--ink)' };
const pick = (on: boolean): React.CSSProperties => ({ flex: 1, background: on ? 'var(--accent-tint)' : undefined, borderColor: on ? 'var(--accent)' : undefined });

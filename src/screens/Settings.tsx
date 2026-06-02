import { useState } from 'react';
import { BackButton } from '../components/BackButton';
import { useStore } from '../store/store';
import { downloadJSON, importJSONFile } from '../data/persistence';
import type { Thresholds, ProgramWeek } from '../data/types';
import { useToday } from '../store/selectors';

const THRESHOLD_LABELS: Record<keyof Thresholds, string> = {
  oneOnOneOverdueDays: '1:1 overdue after (days)',
  quietWorkingDays: 'Quiet after (working days)',
  trackerStaleWorkingDays: 'Tracker stale after (working days)',
  blockerAgingDays: 'Blocker aging after (days)',
  moodLowThreshold: 'Mood "low" at or below (1–5)',
  moodLowRunDays: 'Mood low for (days running)',
  actionItemGraceDays: 'Action item grace (days)',
  meetingAbsenceCount: 'Meeting absences before flag (in 14d)',
};

export function Settings() {
  const db = useStore((s) => s.db);
  const updateProfile = useStore((s) => s.updateProfile);
  const updateProgram = useStore((s) => s.updateProgram);
  const addRole = useStore((s) => s.addRole);
  const updateRole = useStore((s) => s.updateRole);
  const updateQuestions = useStore((s) => s.updateQuestions);
  const updateSettings = useStore((s) => s.updateSettings);
  const replaceDB = useStore((s) => s.replaceDB);
  const loadDemo = useStore((s) => s.loadDemo);
  const startFresh = useStore((s) => s.startFresh);
  const connectFile = useStore((s) => s.connectFile);
  const reconnectFile = useStore((s) => s.reconnectFile);
  const fileName = useStore((s) => s.fileName);
  const fileNeedsReconnect = useStore((s) => s.fileNeedsReconnect);
  const today = useToday();

  const [newRole, setNewRole] = useState('');

  function setThreshold(key: keyof Thresholds, val: number) {
    updateSettings({ thresholds: { ...db.settings.thresholds, [key]: val } });
  }
  async function doImport() {
    const imported = await importJSONFile();
    if (imported && confirm('Replace all current data with the imported file? Export a backup first if unsure.')) replaceDB(imported);
    else if (imported === null) alert('Could not read that file as a valid PM Assistant backup.');
  }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <div><div className="crumb">Settings</div><div className="tt">Settings</div></div>
        </div>
        <div className="top-actions"><button className="btn btn-p" onClick={() => downloadJSON(db, `PM-Assistant-${today}.json`)}>⬇ Backup now</button></div>
      </div>

      <div className="content">
        <div className="row r1-1" style={{ alignItems: 'start' }}>
          {/* roles */}
          <div className="panel reveal d1">
            <div className="panel-h"><h3>🏷️ Roles</h3></div>
            <div className="panel-b" style={{ paddingTop: 12 }}>
              {db.roles.map((r) => (
                <div className="flag" key={r.id}>
                  <span className="e">🏷️</span>
                  <input defaultValue={r.name} onBlur={(e) => updateRole(r.id, e.target.value)} style={{ ...inp, flex: 1 }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="New role…" style={{ ...inp, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newRole.trim()) { addRole(newRole.trim()); setNewRole(''); } }} />
              </div>
            </div>
          </div>

          {/* thresholds */}
          <div className="panel reveal d2">
            <div className="panel-h"><h3>🎚️ Flag thresholds</h3></div>
            <div className="panel-b" style={{ paddingTop: 12 }}>
              {(Object.keys(THRESHOLD_LABELS) as (keyof Thresholds)[]).map((key) => (
                <div className="check" key={key} style={{ cursor: 'default' }}>
                  <div className="nm" style={{ flex: 1 }}>{THRESHOLD_LABELS[key]}</div>
                  <input type="number" value={db.settings.thresholds[key]} onChange={(e) => setThreshold(key, Number(e.target.value))}
                    style={{ ...inp, width: 70, textAlign: 'center' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* standup script */}
        <div className="panel reveal d3 mt4">
          <div className="panel-h"><h3>☀️ Standup script</h3><span className="pill peach">{db.standupQuestions.filter((q) => q.enabled).length} active</span></div>
          <div className="panel-b" style={{ paddingTop: 12 }}>
            {db.standupQuestions.sort((a, b) => a.sortOrder - b.sortOrder).map((q) => (
              <div className="check" key={q.id} style={{ cursor: 'default' }}>
                <button className="tick" onClick={() => updateQuestions(db.standupQuestions.map((x) => x.id === q.id ? { ...x, enabled: !x.enabled } : x))}
                  style={{ background: q.enabled ? 'var(--green)' : 'transparent', borderColor: q.enabled ? 'var(--green)' : 'var(--line-2)', cursor: 'pointer' }}>{q.enabled ? '✓' : ''}</button>
                <input defaultValue={q.prompt} onBlur={(e) => updateQuestions(db.standupQuestions.map((x) => x.id === q.id ? { ...x, prompt: e.target.value } : x))}
                  style={{ ...inp, flex: 1, opacity: q.enabled ? 1 : 0.5 }} />
                <span className="role">{q.fieldType}</span>
              </div>
            ))}
          </div>
        </div>

        {/* meeting types & mediums */}
        <div className="panel reveal d4 mt4">
          <div className="panel-h"><h3>🗓️ Meeting types & mediums</h3></div>
          <div className="panel-b" style={{ paddingTop: 14 }}>
            <label style={lbl}>Meeting types</label>
            <EditableChips items={db.settings.meetingTypes} onChange={(meetingTypes) => updateSettings({ meetingTypes })} placeholder="Add a type…" />
            <label style={{ ...lbl, marginTop: 16 }}>How meetings happen (medium)</label>
            <EditableChips items={db.settings.meetingMediums} onChange={(meetingMediums) => updateSettings({ meetingMediums })} placeholder="e.g. Webex, In person…" />
          </div>
        </div>

        {/* profile */}
        <div className="panel reveal d4 mt4">
          <div className="panel-h"><h3>🙋 Your profile</h3></div>
          <div className="panel-b" style={{ paddingTop: 14 }}>
            <label style={lbl}>Your name</label>
            <input defaultValue={db.profile.name} onBlur={(e) => updateProfile({ name: e.target.value })}
              placeholder="Your name" style={{ ...inp, maxWidth: 320 }} />
            <p style={{ color: 'var(--ink-3)', fontSize: 12.5, marginTop: 8 }}>
              Local profile only — no account, no login. Shown in your greeting and reports.
            </p>
          </div>
        </div>

        {/* live program sessions */}
        <div className="panel reveal d5 mt4">
          <div className="panel-h">
            <h3>🎓 Live program sessions</h3>
            <span className="pill peach">{db.program.length} session{db.program.length === 1 ? '' : 's'}</span>
          </div>
          <div className="panel-b" style={{ paddingTop: 14 }}>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 14 }}>
              Optional. If your project has live sessions, classes, or mentor calls tied to specific
              weeks, add them here — each one is pinned to its week in <b>Coaching</b>.
            </p>
            <ProgramEditor program={db.program} onChange={updateProgram} totalWeeks={11} />
          </div>
        </div>

        {/* data safety */}
        <div className="panel reveal d5 mt4">
          <div className="panel-h"><h3>💾 Data & backups</h3></div>
          <div className="panel-b" style={{ paddingTop: 14 }}>
            {/* durable file */}
            <div className="flag" style={{ borderBottom: '1px solid var(--line)', marginBottom: 12 }}>
              <span className="e">{fileName ? '🔗' : '💽'}</span>
              <div className="txt">
                {fileName ? <>Durable file: <b>{fileName}</b></> : 'Durable on-disk storage'}
                <small>
                  {fileNeedsReconnect ? 'Connected, but the browser needs you to re-grant access this session.'
                    : fileName ? 'Every change autosaves to this file — safe from browser-storage clears.'
                      : 'Save to a real file on disk so data survives even if browser storage is cleared.'}
                </small>
              </div>
              {fileNeedsReconnect
                ? <button className="btn btn-p" onClick={() => reconnectFile()}>Reconnect</button>
                : <button className="btn btn-ghost" onClick={() => connectFile()}>{fileName ? 'Change file' : 'Connect file →'}</button>}
            </div>

            <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 14 }}>
              Suggested location: <code>D:\PM-Assistant\PM-Assistant.json</code>. The in-browser copy is always kept as a mirror; manual export below makes a timestamped backup.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
              <input type="checkbox" checked={db.settings.weeklyBackupOn} onChange={(e) => updateSettings({ weeklyBackupOn: e.target.checked })} />
              Weekly auto-backup reminder
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => downloadJSON(db, `PM-Assistant-${today}.json`)}>⬇ Export data</button>
              <button className="btn btn-ghost" onClick={doImport}>⬆ Import / restore</button>
              <button className="btn btn-ghost" onClick={() => { if (confirm('Load the demo dataset? This replaces your current data — export a backup first.')) loadDemo(); }}>🎬 Load demo data</button>
              <button className="btn btn-ghost" style={{ color: 'var(--red)' }}
                onClick={() => { if (confirm('Start fresh? This wipes your current data and takes you to first-run setup — export a backup first.')) startFresh(); }}>↺ Start fresh</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const inp: React.CSSProperties = { borderRadius: 11, border: '1px solid var(--line-2)', padding: '9px 12px', fontFamily: 'var(--body)', fontSize: 14, background: 'var(--card)', color: 'var(--ink)' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)', marginBottom: 8 };

function ProgramEditor({ program, onChange, totalWeeks }: { program: ProgramWeek[]; onChange: (p: ProgramWeek[]) => void; totalWeeks: number }) {
  // Keep a stable display order (by week) without reordering on every keystroke.
  const sorted = [...program].sort((a, b) => a.weekNo - b.weekNo);
  const patch = (s: ProgramWeek, fields: Partial<ProgramWeek>) =>
    onChange(program.map((x) => (x === s ? { ...x, ...fields } : x)));
  const remove = (s: ProgramWeek) => onChange(program.filter((x) => x !== s));
  const add = () => onChange([...program, { weekNo: 1, topic: '', when: '', presenter: '' }]);

  return (
    <>
      {sorted.length === 0 && (
        <p style={{ color: 'var(--ink-3)', fontSize: 13, fontStyle: 'italic', marginBottom: 12 }}>
          No sessions yet. Add one if your project includes scheduled live sessions.
        </p>
      )}
      {sorted.map((s, i) => (
        <div key={i} className="card" style={{ marginBottom: 12, background: 'var(--cream-2)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            <select value={s.weekNo} onChange={(e) => patch(s, { weekNo: Number(e.target.value) })} style={{ ...inp, width: 110 }}>
              {Array.from({ length: totalWeeks }, (_, w) => w + 1).map((w) => <option key={w} value={w}>Week {w}</option>)}
            </select>
            <input value={s.topic} onChange={(e) => patch(s, { topic: e.target.value })} placeholder="Session topic" style={{ ...inp, flex: 1, minWidth: 180 }} />
            <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => remove(s)} title="Remove session">Remove</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <input value={s.when} onChange={(e) => patch(s, { when: e.target.value })} placeholder="When — e.g. Mon, Jul 6 · 8pm" style={{ ...inp, flex: 1, minWidth: 160 }} />
            <input value={s.presenter} onChange={(e) => patch(s, { presenter: e.target.value })} placeholder="Presenter (optional)" style={{ ...inp, flex: 1, minWidth: 160 }} />
          </div>
          <input value={s.do ?? ''} onChange={(e) => patch(s, { do: e.target.value })} placeholder="“Do this week” line (optional) — e.g. 📅 Attend the session" style={{ ...inp, width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={s.learn ?? ''} onChange={(e) => patch(s, { learn: e.target.value })} placeholder="Extra “Learn” bullet (optional)" style={{ ...inp, flex: 1, minWidth: 160 }} />
            <input value={s.resource ?? ''} onChange={(e) => patch(s, { resource: e.target.value })} placeholder="Resource to look up (optional)" style={{ ...inp, flex: 1, minWidth: 160 }} />
          </div>
        </div>
      ))}
      <button className="btn btn-ghost" onClick={add}>+ Add session</button>
    </>
  );
}

function EditableChips({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder: string }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {items.map((it) => (
        <span key={it} className="pill blue" style={{ fontSize: 13, padding: '5px 8px 5px 11px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {it}
          <button onClick={() => onChange(items.filter((x) => x !== it))} title="Remove"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, lineHeight: 1 }}>×</button>
        </span>
      ))}
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' && val.trim() && !items.includes(val.trim())) { onChange([...items, val.trim()]); setVal(''); } }}
        style={{ ...inp, padding: '6px 10px', fontSize: 13, width: 150 }} />
    </div>
  );
}

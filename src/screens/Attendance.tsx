import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore, initials } from '../store/store';
import { useClock, useToday } from '../store/selectors';
import { shortDate } from '../domain/dates';
import type { AttendanceStatus } from '../data/types';

const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent'];
const STATUS_PILL: Record<AttendanceStatus, string> = { present: 'green', late: 'amber', absent: 'red' };

export function Attendance() {
  const db = useStore((s) => s.db);
  const addMeeting = useStore((s) => s.addMeeting);
  const setAttendance = useStore((s) => s.setAttendance);
  const today = useToday();
  const clock = useClock();

  const meetings = [...db.meetings].sort((a, b) => (a.date < b.date ? 1 : -1));
  const types = db.settings.meetingTypes;
  const mediums = db.settings.meetingMediums;
  const [selected, setSelected] = useState<string | null>(meetings[0]?.id ?? null);
  const [type, setType] = useState(types[1] ?? types[0] ?? 'Meeting');
  const [medium, setMedium] = useState(mediums[0] ?? 'In person');
  const [date, setDate] = useState(today);

  const active = db.members.filter((m) => m.status === 'active');
  const meeting = meetings.find((m) => m.id === selected) ?? null;
  const attendanceFor = (memberId: string) =>
    meeting ? db.attendance.find((a) => a.meetingId === meeting.id && a.memberId === memberId) : undefined;

  function create() {
    const id = addMeeting({ type, medium, date, weekNo: clock.weekNo });
    setSelected(id);
  }

  // attendance rate per member, across all recorded meetings
  const rateFor = (memberId: string) => {
    const recs = db.attendance.filter((a) => a.memberId === memberId);
    if (!recs.length) return null;
    return recs.filter((a) => a.status === 'present').length / recs.length;
  };

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton fallback="/team" />
          <div><div className="crumb"><Link to="/team">Team</Link> · Attendance</div><div className="tt">Meetings & attendance</div></div>
        </div>
        <div className="top-actions">
          <select value={type} onChange={(e) => setType(e.target.value)} style={inp} title="Meeting type">
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={medium} onChange={(e) => setMedium(e.target.value)} style={inp} title="How it happened">
            {mediums.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
          <button className="btn btn-p" onClick={create}>+ New meeting</button>
        </div>
      </div>

      <div className="content">
        <div className="row r1-2" style={{ gridTemplateColumns: '1fr 2fr', gap: 18, alignItems: 'start' }}>
          {/* meeting list */}
          <div className="panel reveal d1">
            <div className="panel-h"><h3>🗓️ Meetings</h3><span className="pill peach">{meetings.length}</span></div>
            <div className="panel-b">
              {meetings.length === 0 && <p style={{ color: 'var(--ink-2)', padding: '12px 0' }}>No meetings logged yet — create one above.</p>}
              {meetings.map((m) => {
                const recorded = db.attendance.filter((a) => a.meetingId === m.id).length;
                return (
                  <button key={m.id} className="flag" onClick={() => setSelected(m.id)}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: m.id === selected ? 'var(--cream-2)' : 'none', cursor: 'pointer', borderRadius: 10 }}>
                    <span className="e">{mediumIcon(m.medium)}</span>
                    <div className="txt">{m.type}<small>{m.medium} · {shortDate(m.date)} · W{m.weekNo} · {recorded}/{active.length} marked</small></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* attendance grid for selected meeting */}
          <div className="panel reveal d2">
            <div className="panel-h">
              <h3>✅ {meeting ? `${meeting.type} — ${shortDate(meeting.date)}` : 'Select a meeting'}</h3>
              {meeting && <span className="pill blue">{mediumIcon(meeting.medium)} {meeting.medium}</span>}
            </div>
            <div className="panel-b">
              {!meeting ? <p style={{ color: 'var(--ink-2)', padding: '12px 0' }}>Pick or create a meeting to mark attendance.</p> : (
                <div className="checks">
                  {active.map((m) => {
                    const rec = attendanceFor(m.id);
                    const rate = rateFor(m.id);
                    return (
                      <div className="check" key={m.id} style={{ cursor: 'default' }}>
                        <span className={`av sm ${m.avatarTone ?? ''}`}>{initials(m.name)}</span>
                        <div>
                          <div className="nm">{m.name}</div>
                          <div className="role">{rate == null ? 'no history' : `${Math.round(rate * 100)}% present overall`}</div>
                        </div>
                        <div className="right" style={{ gap: 6 }}>
                          {STATUSES.map((s) => (
                            <button key={s} onClick={() => setAttendance(meeting.id, m.id, s, rec?.comment)}
                              className={`pill ${rec?.status === s ? STATUS_PILL[s] : ''}`}
                              style={{ cursor: 'pointer', border: rec?.status === s ? '1px solid currentColor' : '1px solid var(--line-2)', background: rec?.status === s ? undefined : 'var(--card)', color: rec?.status === s ? undefined : 'var(--ink-3)', padding: '4px 10px' }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const inp: React.CSSProperties = { borderRadius: 11, border: '1px solid var(--line-2)', padding: '9px 12px', fontFamily: 'var(--body)', fontSize: 14, background: 'var(--card)', color: 'var(--ink)' };

function mediumIcon(medium: string): string {
  const m = medium.toLowerCase();
  if (m.includes('teams')) return '💜';
  if (m.includes('meet')) return '📹';
  if (m.includes('zoom')) return '🎥';
  if (m.includes('call') || m.includes('phone')) return '📞';
  if (m.includes('chat')) return '💬';
  if (m.includes('person')) return '🤝';
  return '🗓️';
}

// Pure date helpers. Work week is Mon–Fri (PRD §K1). All dates are ISO 'YYYY-MM-DD'.

export function toISODate(d: Date): string {
  // local-date ISO (no timezone shift) — we only care about calendar days
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function isWeekend(iso: string): boolean {
  const day = parseISO(iso).getDay();
  return day === 0 || day === 6;
}

/** Calendar days between two ISO dates (b - a). */
export function daysBetween(aISO: string, bISO: string): number {
  const a = parseISO(aISO).getTime();
  const b = parseISO(bISO).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Count working days (Mon–Fri) strictly between `fromISO` (exclusive) and
 * `toISO` (inclusive), excluding any date in `excluded` (no-standup days / leave).
 */
export function workingDaysBetween(fromISO: string, toISO: string, excluded: Set<string>): number {
  let count = 0;
  let cur = addDays(fromISO, 1);
  while (daysBetween(cur, toISO) >= 0) {
    if (!isWeekend(cur) && !excluded.has(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function prettyDate(iso: string): string {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function shortDate(iso: string): string {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/**
 * Week utility helpers.
 *
 * ISO 8601 week strings are in the format "YYYY-WNN" (e.g. "2026-W10").
 * All week calculations use Mon–Sun boundaries.
 * Dates are kept in local time so day labels match the user's calendar.
 */

/**
 * Parse "YYYY-WNN" and return the Date of the Monday that starts that week.
 * Relies on the ISO 8601 convention: week 1 is the week containing the first
 * Thursday of the year.
 */
function mondayOfIsoWeek(isoWeek: string): Date {
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Jan 4 is always in week 1 (ISO 8601 rule)
  const jan4 = new Date(year, 0, 4);
  // Day-of-week of Jan 4 (0=Sun … 6=Sat), convert to Mon-based (0=Mon … 6=Sun)
  const jan4DayMon = (jan4.getDay() + 6) % 7;
  // Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4DayMon);

  // Add (week - 1) * 7 days to get the Monday of the requested week
  const targetMonday = new Date(week1Monday);
  targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7);
  return targetMonday;
}

/**
 * Return the ISO 8601 week string ("YYYY-WNN") for a given Date.
 * The week that contains the date is determined by which Thursday falls in it
 * (ISO 8601 rule).
 */
export function formatIsoWeek(date: Date): string {
  // Thursday of the same week (ISO weeks are defined by their Thursday)
  const thursday = new Date(date);
  const dayOfWeek = (date.getDay() + 6) % 7; // Mon=0 … Sun=6
  thursday.setDate(date.getDate() - dayOfWeek + 3);

  const year = thursday.getFullYear();

  // Week number: days since Jan 4 of that year's week-1, divided by 7
  const jan4 = new Date(year, 0, 4);
  const jan4DayMon = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4DayMon);

  const diffMs = thursday.getTime() - week1Monday.getTime();
  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Return the ISO week string for today's date. */
export function getCurrentIsoWeek(): string {
  return formatIsoWeek(new Date());
}

/**
 * Return { start, end } Date objects for the Mon–Sun span of the given ISO week.
 * `start` is 00:00:00 local on Monday; `end` is 23:59:59.999 local on Sunday.
 */
export function getWeekBounds(isoWeek: string): { start: Date; end: Date } {
  const monday = mondayOfIsoWeek(isoWeek);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/** Return the ISO week string for the week before the given one. */
export function prevWeek(isoWeek: string): string {
  const monday = mondayOfIsoWeek(isoWeek);
  monday.setDate(monday.getDate() - 7);
  return formatIsoWeek(monday);
}

/** Return the ISO week string for the week after the given one. */
export function nextWeek(isoWeek: string): string {
  const monday = mondayOfIsoWeek(isoWeek);
  monday.setDate(monday.getDate() + 7);
  return formatIsoWeek(monday);
}

/**
 * Return an array of 7 Date objects (Mon … Sun) for the given ISO week.
 * Each date is set to midnight local time.
 */
export function getDaysOfWeek(isoWeek: string): Date[] {
  const monday = mondayOfIsoWeek(isoWeek);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Format a Date as a human-readable week range label, e.g. "Mar 3 – Mar 9, 2026". */
export function formatWeekLabel(isoWeek: string): string {
  const days = getDaysOfWeek(isoWeek);
  const monday = days[0];
  const sunday = days[6];

  const fmt = (d: Date, includeYear: boolean) =>
    d.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
    });

  // Only include year on the monday side when year differs (rare edge case)
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  return `${fmt(monday, !sameYear)} – ${fmt(sunday, true)}`;
}

/** Return true if two dates fall on the same calendar day (local time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

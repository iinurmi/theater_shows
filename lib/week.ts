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

/**
 * Return a Date representing midnight (local) of today's calendar date in Helsinki.
 *
 * `new Date()` on a UTC server returns UTC midnight, which can be the *previous*
 * calendar day from a Helsinki user's perspective between 00:00–02:00/03:00 Helsinki.
 * This helper derives the correct Helsinki date string first, then constructs a
 * Date at local midnight so all subsequent `setDate` arithmetic stays correct.
 */
export function getTodayHelsinki(): Date {
  const str = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });
  // `YYYY-MM-DDT00:00:00` without Z is parsed as local time (not UTC)
  return new Date(`${str}T00:00:00`);
}

/** Return the ISO week string for today's date in Helsinki local time. */
export function getCurrentIsoWeek(): string {
  return formatIsoWeek(getTodayHelsinki());
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
      timeZone: 'Europe/Helsinki',
      ...(includeYear ? { year: 'numeric' } : {}),
    });

  // Only include year on the monday side when year differs (rare edge case)
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  return `${fmt(monday, !sameYear)} – ${fmt(sunday, true)}`;
}

/**
 * Format a human-readable label for the rolling window (e.g. "6 Mar – 13 Mar 2026").
 * Derived from `getRollingWindowDays` so the range always matches what is displayed.
 */
export function formatRollingWindowLabel(today: Date): string {
  const days = getRollingWindowDays(today);
  const first = days[0];
  const last = days[days.length - 1];

  const fmt = (d: Date, includeYear: boolean) =>
    d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Helsinki',
      ...(includeYear ? { year: 'numeric' } : {}),
    });

  const sameYear = first.getFullYear() === last.getFullYear();
  return `${fmt(first, !sameYear)} – ${fmt(last, true)}`;
}

/**
 * Return an array of 8 Date objects for the rolling window anchored on `today`:
 *   yesterday, today, and the 6 days after today (8 days total).
 *
 * Each date is set to midnight local time.
 * Used when the active week is the current ISO week.
 */
export function getRollingWindowDays(today: Date): Date[] {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - 1 + i); // start from yesterday (i=0)
    return d;
  });
}

/**
 * Return { start, end } ISO date strings (YYYY-MM-DD) for the rolling window
 * anchored on `today` (yesterday … today+6).
 *
 * These strings are used to build the Linked Events API date-range query.
 * Using YYYY-MM-DD (Helsinki local date) avoids UTC-offset surprises because
 * the API treats bare dates as Helsinki midnight.
 */
export function getRollingWindowBounds(today: Date): { start: Date; end: Date } {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(today.getDate() - 1); // yesterday

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  end.setDate(today.getDate() + 6); // today+6

  return { start, end };
}

/** Return true if two dates fall on the same calendar day (local time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * DaySection — server component.
 *
 * Renders the day header and list of ShowCards for one day.
 * Today's section is visually highlighted: bold label + subtle background.
 */

import type { Show } from '@/types/show';
import { ShowCard } from '@/components/ShowCard';

type DaySectionProps = {
  date: Date;
  shows: Show[];
};

/** Format a Date as a readable day label, e.g. "Monday 3 Mar". */
function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

/** Return a YYYY-MM-DD string for a Date in Helsinki time — used for today comparison. */
function helsinkiDateString(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });
}

export function DaySection({ date, shows }: DaySectionProps) {
  // Compare in Helsinki timezone so "today" rolls over at Helsinki midnight,
  // not at the server's local midnight (UTC on Vercel).
  const isToday = helsinkiDateString(date) === helsinkiDateString(new Date());

  return (
    <section
      aria-label={formatDayLabel(date)}
      className={`rounded-lg px-3 py-3 ${isToday ? 'bg-amber-50' : ''}`}
    >
      {/* Day header */}
      <h2
        className={`mb-2 text-sm uppercase tracking-wide ${
          isToday ? 'font-bold text-amber-700' : 'font-medium text-gray-400'
        }`}
      >
        {formatDayLabel(date)}
        {isToday && <span className="ml-2 text-xs normal-case">(today)</span>}
      </h2>

      {/* Show list or empty state */}
      {shows.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No shows</p>
      ) : (
        <ul>
          {shows.map((show) => (
            <ShowCard key={`${show.startTime}-${show.name}`} show={show} />
          ))}
        </ul>
      )}
    </section>
  );
}

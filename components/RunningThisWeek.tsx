/**
 * RunningThisWeek — server component.
 *
 * Renders a "Running shows this week" section for multi-day theater productions
 * that span the viewed week (e.g. a run from 1.3.–1.5.2026).
 *
 * These are events whose duration > 24 h in the Linked Events API — they represent
 * the production run rather than individual timed performances.
 *
 * Renders nothing when the list is empty.
 */

import type { RangeShow } from '@/types/show';

type RunningThisWeekProps = {
  rangeShows: RangeShow[];
};

/**
 * Format an ISO 8601 date string as Finnish short date: D.M.YYYY (e.g. "1.3.2026").
 * Uses 'fi-FI' locale which produces the correct day-first format without leading zeros.
 */
function formatFinnishDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Helsinki',
  });
}

/** Format a date range label, e.g. "1.3.–1.5.2026". */
function formatRangeLabel(rangeStart: string, rangeEnd: string): string {
  const start = formatFinnishDate(rangeStart);
  const end = formatFinnishDate(rangeEnd);
  return `${start}–${end}`;
}

export function RunningThisWeek({ rangeShows }: RunningThisWeekProps) {
  if (rangeShows.length === 0) return null;

  return (
    <section aria-label="Currently running" className="mt-2 mb-4 rounded-lg border border-violet-200 bg-violet-100 px-3 py-3">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-400">
        Currently running
      </h2>
      <p className="mb-2 text-xs text-gray-400">
        Multi-day productions — check theater for show times
      </p>

      <ul>
        {rangeShows.map((show) => (
          <li
            key={`${show.rangeStart}-${show.name}-${show.theater}`}
            className="flex items-start gap-3 border-b border-gray-100 py-2 last:border-0"
          >
            {/* Name + venue stacked; takes all available width before the date */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Show name — linked to info page when URL is available */}
              {show.url ? (
                <a
                  href={show.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug hover:underline"
                >
                  {show.name}
                </a>
              ) : (
                <span className="text-sm font-medium leading-snug">{show.name}</span>
              )}

              {/* Theater name (with optional stage) — wraps naturally within available space */}
              <span className="mt-0.5 text-xs text-gray-400">
                {show.stage ? `${show.theater} · ${show.stage}` : show.theater}
              </span>
            </div>

            {/* Date range label, e.g. "1.3.–1.5.2026" */}
            <span className="shrink-0 text-xs text-gray-400">
              {formatRangeLabel(show.rangeStart, show.rangeEnd)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

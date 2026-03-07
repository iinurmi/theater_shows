/**
 * ShowCard — server component.
 *
 * Renders a single theater show as a compact, mobile-first row:
 *   HH:MM  |  Show name  |  Theater name
 */

import type { Show } from '@/types/show';

type ShowCardProps = {
  show: Show;
};

/** Format an ISO 8601 timestamp to "HH:MM" in Helsinki local time (EET/EEST). */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Helsinki',
  });
}

export function ShowCard({ show }: ShowCardProps) {
  return (
    <li className="flex items-start gap-3 border-b border-gray-100 py-3 last:border-0">
      {/* Time — fixed-width, aligned to top of the name/venue column */}
      <span className="w-12 shrink-0 text-sm font-mono text-gray-500">
        {formatTime(show.startTime)}
      </span>

      {/* Name + venue: stacked on mobile, side-by-side on desktop */}
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-3">
        {/* Show name — linked to info page when URL is available */}
        {show.url ? (
          <a
            href={show.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm font-medium leading-snug hover:underline"
          >
            {show.name}
          </a>
        ) : (
          <span className="flex-1 text-sm font-medium leading-snug">{show.name}</span>
        )}

        {/* Theater name (with optional stage) — wraps naturally; capped on desktop */}
        <span className="mt-0.5 text-xs text-gray-400 sm:mt-0 sm:max-w-[16rem] sm:text-right">
          {show.stage ? `${show.theater} · ${show.stage}` : show.theater}
        </span>
      </div>
    </li>
  );
}

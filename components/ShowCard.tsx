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
    <li className="flex items-baseline gap-3 border-b border-gray-100 py-2 last:border-0">
      {/* Time — fixed-width to keep name column aligned */}
      <span className="w-12 shrink-0 text-sm font-mono text-gray-500">
        {formatTime(show.startTime)}
      </span>

      {/* Show name */}
      <span className="flex-1 text-sm font-medium leading-snug">{show.name}</span>

      {/* Theater name (with optional stage) */}
      <span className="shrink-0 text-xs text-gray-400">
        {show.stage ? `${show.theater} · ${show.stage}` : show.theater}
      </span>
    </li>
  );
}

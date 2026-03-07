'use client';

/**
 * WeekNav — client component.
 *
 * Displays the current week label and prev/next navigation buttons.
 * Navigation updates the `?week=` URL search param, which triggers a
 * server-side re-fetch in the parent page.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { prevWeek, nextWeek, formatWeekLabel } from '@/lib/week';

type WeekNavProps = {
  isoWeek: string; // e.g. "2026-W10"
  /** Optional label override — used when the current week shows a rolling window range. */
  weekLabel?: string;
};

export function WeekNav({ isoWeek, weekLabel }: WeekNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(targetWeek: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', targetWeek);
    // replace instead of push — week navigation shouldn't pollute the back stack
    router.replace(`?${params.toString()}`);
  }

  return (
    <nav
      aria-label="Week navigation"
      className="flex items-center justify-between gap-4 py-4"
    >
      {/* Prev week */}
      <button
        onClick={() => navigate(prevWeek(isoWeek))}
        aria-label="Previous week"
        className="rounded px-3 py-2 text-lg font-medium hover:bg-gray-100 active:bg-gray-200"
      >
        ←
      </button>

      {/* Week label — rolling range for current week, fixed Mon–Sun otherwise */}
      <span className="text-base font-semibold">{weekLabel ?? formatWeekLabel(isoWeek)}</span>

      {/* Next week */}
      <button
        onClick={() => navigate(nextWeek(isoWeek))}
        aria-label="Next week"
        className="rounded px-3 py-2 text-lg font-medium hover:bg-gray-100 active:bg-gray-200"
      >
        →
      </button>
    </nav>
  );
}

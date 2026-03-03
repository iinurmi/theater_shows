/**
 * Home page — server component.
 *
 * Reads the `?week=YYYY-WNN` search param (defaults to the current ISO week),
 * fetches theater shows from the Linked Events API, groups them by calendar day,
 * and renders the week navigation + day sections.
 *
 * WeekNav is a client component that uses useSearchParams, so it must be
 * wrapped in <Suspense> per Next.js App Router requirements.
 */

import { Suspense } from 'react';
import type { Show } from '@/types/show';
import { fetchShowsForWeek } from '@/lib/linkedevents';
import { getCurrentIsoWeek, getDaysOfWeek, isSameDay } from '@/lib/week';
import { WeekNav } from '@/components/WeekNav';
import { DaySection } from '@/components/DaySection';

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

/** Validate that a string is a well-formed ISO 8601 week (e.g. "2026-W10"). */
const ISO_WEEK_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

function isValidIsoWeek(value: string): boolean {
  return ISO_WEEK_RE.test(value);
}

/** Group a flat array of shows into a Map keyed by calendar-day date string. */
function groupShowsByDay(shows: Show[], days: Date[]): Map<string, Show[]> {
  const map = new Map<string, Show[]>(days.map((d) => [d.toDateString(), []]));

  for (const show of shows) {
    const showDate = new Date(show.startTime);
    const matchingDay = days.find((d) => isSameDay(d, showDate));
    if (matchingDay) {
      map.get(matchingDay.toDateString())!.push(show);
    }
  }

  return map;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { week } = await searchParams;

  // Fall back to current week if the param is absent or malformed
  const isoWeek =
    week && isValidIsoWeek(week) ? week : getCurrentIsoWeek();

  // Fetch shows server-side — no CORS issues, no client API exposure
  let shows: Show[] = [];
  let fetchError: string | null = null;
  try {
    shows = await fetchShowsForWeek(isoWeek);
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : 'Failed to load shows. Please try again later.';
  }

  const days = getDaysOfWeek(isoWeek);
  const showsByDay = groupShowsByDay(shows, days);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12">
      {/* Page title */}
      <h1 className="pt-6 pb-2 text-xl font-bold tracking-tight">
        Helsinki Theater Shows
      </h1>

      {/* Week navigation — client component, must be in Suspense */}
      <Suspense fallback={<div className="h-12" />}>
        <WeekNav isoWeek={isoWeek} />
      </Suspense>

      {/* API error banner */}
      {fetchError && (
        <p className="my-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </p>
      )}

      {/* One section per day of the week */}
      <div className="mt-2 flex flex-col gap-4">
        {days.map((day) => (
          <DaySection
            key={day.toDateString()}
            date={day}
            shows={showsByDay.get(day.toDateString()) ?? []}
          />
        ))}
      </div>
    </main>
  );
}

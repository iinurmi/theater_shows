/**
 * Helsinki Linked Events API helper.
 *
 * Docs: https://api.hel.fi/linkedevents/v1/
 *
 * Fetches theater performances for a given ISO week and maps them to the
 * internal `Show` type. Run-period entries (duration > 24 h) are filtered out.
 */

import type { LinkedEvent, LinkedEventsResponse, Show } from '@/types/show';
import { getWeekBounds } from '@/lib/week';

const BASE_URL = 'https://api.hel.fi/linkedevents/v1/event/';

/** Max events per page — API maximum is 100. */
const PAGE_SIZE = 100;

/** yso:p2315 = "theater" keyword in the City of Helsinki ontology. */
const THEATER_KEYWORD = 'yso:p2315';

/** 24 hours in milliseconds — used to discard run-period entries. */
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Build the Linked Events query URL for a given date range.
 * `include=location` is required to get the venue name in the response.
 */
function buildUrl(start: Date, end: Date, page: number): string {
  const params = new URLSearchParams({
    keyword: THEATER_KEYWORD,
    start: start.toISOString(),
    end: end.toISOString(),
    include: 'location',
    sort: 'start_time',
    page_size: String(PAGE_SIZE),
    page: String(page),
  });
  return `${BASE_URL}?${params.toString()}`;
}

/**
 * Pick the best available localised string from a name map.
 * Preference order: Finnish → English → Swedish → first available → fallback.
 */
function pickName(
  nameMap: { fi?: string; en?: string; sv?: string } | undefined | null,
  fallback: string,
): string {
  if (!nameMap) return fallback;
  return nameMap.fi ?? nameMap.en ?? nameMap.sv ?? fallback;
}

/** Map a raw LinkedEvent to our internal Show type. Returns null if data is incomplete. */
function toShow(event: LinkedEvent): Show | null {
  if (!event.start_time || !event.end_time) return null;

  return {
    name: pickName(event.name, 'Unnamed show'),
    theater: pickName(event.location?.name, 'Unknown venue'),
    startTime: event.start_time,
    endTime: event.end_time,
  };
}

/**
 * Fetch all theater shows for the given ISO week string (e.g. "2026-W10").
 *
 * Paginates through all pages automatically.
 * Filters out events with duration > 24 hours (run-period / season entries).
 *
 * @throws if the network request or JSON parsing fails.
 */
export async function fetchShowsForWeek(isoWeek: string): Promise<Show[]> {
  const { start, end } = getWeekBounds(isoWeek);

  const shows: Show[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = buildUrl(start, end, page);
    const response = await fetch(url, {
      // No caching — data is live and updated hourly per the plan spec
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Linked Events API error: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as unknown;

    // Guard against unexpected API response shapes (e.g. rate-limit HTML, contract changes)
    if (
      typeof json !== 'object' ||
      json === null ||
      !('data' in json) ||
      !Array.isArray((json as Record<string, unknown>).data)
    ) {
      throw new Error('Linked Events API returned an unexpected response shape');
    }

    const payload = json as LinkedEventsResponse;

    for (const event of payload.data) {
      // Skip run-period entries: discard if duration > 24 hours
      if (event.end_time) {
        const durationMs =
          new Date(event.end_time).getTime() - new Date(event.start_time).getTime();
        if (durationMs > MAX_DURATION_MS) continue;
      }

      const show = toShow(event);
      if (show) shows.push(show);
    }

    hasMore = payload.meta.next !== null;
    page++;
  }

  return shows;
}

/**
 * Helsinki Linked Events API helper.
 *
 * Docs: https://api.hel.fi/linkedevents/v1/
 *
 * Fetches theater performances for a given ISO week and maps them to the
 * internal `Show` type. Queries by location IDs derived from the VENUES map,
 * which gives complete coverage for dedicated theater venues regardless of
 * how event publishers tag their events. Run-period entries (duration > 24 h)
 * are filtered out.
 *
 * Stage names are read from `location_extra_info.fi` in the API response
 * (e.g. "Suuri näyttämö") rather than being hardcoded in VENUES.
 */

import type { LinkedEvent, LinkedEventsResponse, Show } from '@/types/show';
import { getWeekBounds } from '@/lib/week';
import { VENUES } from '@/lib/venues';

const BASE_URL = 'https://api.hel.fi/linkedevents/v1/event/';

/** Max events per page — API maximum is 100. */
const PAGE_SIZE = 100;

/** 24 hours in milliseconds — used to discard run-period entries. */
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

/** Build the Linked Events query URL for a given date range and page. */
function buildUrl(start: Date, end: Date, page: number): string {
  // Derive location IDs directly from the VENUES map so there is a single
  // source of truth — adding/removing a venue in venues.ts automatically
  // updates the query.
  const locationParam = Object.keys(VENUES).join(',');

  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    include: 'location',
    sort: 'start_time',
    page_size: String(PAGE_SIZE),
    page: String(page),
  });
  // location is appended manually to avoid URLSearchParams encoding commas and
  // colons in venue IDs (e.g. tprek:20879,tprek:9302 must not become tprek%3A20879%2C...).
  return `${BASE_URL}?location=${locationParam}&${params.toString()}`;
}

/**
 * Pick the best available localised string from a name map.
 * Preference order: Finnish → English → Swedish → fallback.
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
  if (!event.start_time) return null;

  const locationId = event.location?.id;
  const venueConfig = locationId ? VENUES[locationId] : undefined;

  // Resolve the info URL using the same fi → en → sv preference as names.
  // pickName returns a fallback string on miss, so we compare to detect absence.
  const resolvedUrl = event.info_url
    ? (event.info_url.fi ?? event.info_url.en ?? event.info_url.sv)
    : undefined;

  return {
    name: pickName(event.name, 'Unnamed show'),
    theater: venueConfig?.theater ?? pickName(event.location?.name, 'Unknown venue'),
    // Stage name comes from the API's location_extra_info.fi field
    // (e.g. "Suuri näyttämö"). Falls back to undefined when absent.
    stage: event.location_extra_info?.fi,
    startTime: event.start_time,
    endTime: event.end_time ?? undefined,
    url: resolvedUrl,
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
    const response = await fetch(url, { cache: 'no-store' });

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
      if (event.start_time && event.end_time) {
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

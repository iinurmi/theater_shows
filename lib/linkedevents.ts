/**
 * Helsinki Linked Events API helper.
 *
 * Docs: https://api.hel.fi/linkedevents/v1/
 *
 * Fetches theater performances for a given ISO week and maps them to the
 * internal `Show` type. Queries by location IDs derived from the VENUES map,
 * which gives complete coverage for dedicated theater venues regardless of
 * how event publishers tag their events. Run-period entries (duration > 24 h)
 * are collected as RangeShow rather than discarded.
 *
 * Stage names are read from `location_extra_info.fi` in the API response
 * (e.g. "Suuri näyttämö") rather than being hardcoded in VENUES.
 */

import type { LinkedEvent, LinkedEventsResponse, RangeShow, Show } from '@/types/show';
import { getWeekBounds } from '@/lib/week';
import { VENUES } from '@/lib/venues';

const BASE_URL = 'https://api.hel.fi/linkedevents/v1/event/';

/** Max events per page — API maximum is 100. */
const PAGE_SIZE = 100;

/** 24 hours in milliseconds — threshold for classifying an event as a multi-day production run. */
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

/** Per-page fetch timeout in ms — prevents a slow/hung API from blocking the server render. */
const FETCH_TIMEOUT_MS = 8_000;

/** Build the Linked Events query URL for a given date range and page. */
function buildUrl(start: Date, end: Date, page: number): string {
  // Derive location IDs directly from the VENUES map so there is a single
  // source of truth — adding/removing a venue in venues.ts automatically
  // updates the query.
  const locationParam = Object.keys(VENUES).join(',');

  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    sort: 'start_time',
    page_size: String(PAGE_SIZE),
    page: String(page),
  });
  // location is appended manually to avoid URLSearchParams encoding commas and
  // colons in venue IDs (e.g. tprek:20879,tprek:9302 must not become tprek%3A20879%2C...).
  params.append('include', 'location');
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

/**
 * Strip the theater name prefix from a stage string when the API duplicates it.
 * E.g. theater="Kansallisteatteri", stage="Kansallisteatteri - Suuri näyttämö"
 * → "Suuri näyttämö".  Common separators: " - ", " · ", ": ", " – ".
 */
function stripTheaterPrefix(theater: string, stage: string | undefined): string | undefined {
  if (!stage) return stage;
  const separators = [' - ', ' · ', ': ', ' – '];
  for (const sep of separators) {
    const prefix = theater + sep;
    if (stage.toLowerCase().startsWith(prefix.toLowerCase())) {
      return stage.slice(prefix.length);
    }
  }
  return stage;
}

/** YSO keyword ID that marks children's shows in the Helsinki open data taxonomy. */
const CHILDRENS_SHOW_KEYWORD = 'yso:p4354';

/** Max audience age that we treat as a children's show when `audience_max_age` is set. */
const CHILDRENS_MAX_AGE = 12;

/**
 * Shared helper: extract venue info and children's show flags from a raw event.
 * Used by both toShow and toRangeShow to avoid duplication.
 */
function extractCommonFields(event: LinkedEvent): Pick<Show, 'name' | 'theater' | 'stage' | 'url' | 'isChildrensShow'> {
  const locationId = event.location?.id;
  const venueConfig = locationId ? VENUES[locationId] : undefined;

  const resolvedUrl = event.info_url
    ? (event.info_url.fi ?? event.info_url.en ?? event.info_url.sv)
    : undefined;

  const hasChildrensKeyword =
    event.keywords?.some((kw) => kw.id === CHILDRENS_SHOW_KEYWORD) ?? false;
  const hasChildrensAge =
    typeof event.audience_max_age === 'number' &&
    event.audience_max_age <= CHILDRENS_MAX_AGE;

  const theater = venueConfig?.theater ?? pickName(event.location?.name, 'Unknown venue');
  const rawStage = event.location_extra_info?.fi;

  return {
    name: pickName(event.name, 'Unnamed show'),
    theater,
    stage: stripTheaterPrefix(theater, rawStage),
    url: resolvedUrl,
    isChildrensShow: hasChildrensKeyword || hasChildrensAge,
  };
}

/** Map a raw LinkedEvent to our internal Show type. Returns null if data is incomplete. */
function toShow(event: LinkedEvent): Show | null {
  if (!event.start_time) return null;
  return {
    ...extractCommonFields(event),
    startTime: event.start_time,
    endTime: event.end_time ?? undefined,
  };
}

/**
 * Map a raw LinkedEvent to a RangeShow (multi-day production).
 * Returns null if start_time or end_time is absent.
 */
function toRangeShow(event: LinkedEvent): RangeShow | null {
  if (!event.start_time || !event.end_time) return null;
  return {
    ...extractCommonFields(event),
    rangeStart: event.start_time,
    rangeEnd: event.end_time,
  };
}

/** Return type for the core paginator — timed performances and multi-day range shows. */
type FetchResult = { shows: Show[]; rangeShows: RangeShow[] };

/**
 * Core paginator — fetches all shows within an explicit [start, end] Date range.
 *
 * Paginates through all pages automatically.
 * Events with duration > 24 hours are collected as RangeShow (multi-day productions)
 * rather than being discarded.
 *
 * @throws if the network request or JSON parsing fails.
 */
async function fetchShowsForBounds(start: Date, end: Date): Promise<FetchResult> {
  const shows: Show[] = [];
  const rangeShows: RangeShow[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = buildUrl(start, end, page);
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
      if (event.start_time && event.end_time) {
        const durationMs =
          new Date(event.end_time).getTime() - new Date(event.start_time).getTime();

        if (durationMs > MAX_DURATION_MS) {
          // Multi-day production run — collect as RangeShow
          const rangeShow = toRangeShow(event);
          if (rangeShow) rangeShows.push(rangeShow);
          continue;
        }
      }

      const show = toShow(event);
      if (show) shows.push(show);
    }

    hasMore = payload.meta.next !== null;
    page++;
  }

  return { shows, rangeShows };
}

/**
 * Fetch all theater shows for the given ISO week string (e.g. "2026-W10").
 * Uses fixed Mon–Sun bounds derived from the ISO week.
 */
export async function fetchShowsForWeek(isoWeek: string): Promise<FetchResult> {
  const { start, end } = getWeekBounds(isoWeek);
  return fetchShowsForBounds(start, end);
}

/**
 * Fetch all theater shows for an arbitrary [start, end] Date range.
 * Used for the rolling-window view on the current week, which may span two ISO weeks.
 */
export async function fetchShowsForDateRange(start: Date, end: Date): Promise<FetchResult> {
  return fetchShowsForBounds(start, end);
}

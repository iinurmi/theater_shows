/**
 * Normalized show type used throughout the app.
 * All times are ISO 8601 strings (UTC) as returned by the API.
 */
export type Show = {
  name: string;
  theater: string;
  stage?: string;
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601 — absent when the API doesn't publish an end time
  /** External info page URL, if provided by the API. */
  url?: string;
  /** True when the event is tagged yso:p4354 or has audience_max_age ≤ 12. */
  isChildrensShow: boolean;
};

/**
 * A multi-day theater production that runs across a date range (e.g. 1.3.–1.5.2026).
 * These are events whose duration > 24 h in the Linked Events API — they represent
 * the production run rather than individual performances.
 */
export type RangeShow = {
  name: string;
  theater: string;
  stage?: string;
  /** ISO 8601 — start of the production run */
  rangeStart: string;
  /** ISO 8601 — end of the production run */
  rangeEnd: string;
  url?: string;
  isChildrensShow: boolean;
};

/**
 * Raw event shape from the Helsinki Linked Events API.
 * Only the fields we actually consume are declared here.
 * Reference: https://api.hel.fi/linkedevents/v1/
 */
export type LinkedEvent = {
  id: string;
  name: {
    fi?: string;
    en?: string;
    sv?: string;
  };
  start_time: string | null; // ISO 8601
  end_time: string | null; // ISO 8601 or null
  location: {
    id?: string;
    name?: {
      fi?: string;
      en?: string;
      sv?: string;
    };
  } | null;
  /** Stage/hall name returned by the API (e.g. "Suuri näyttämö"). */
  location_extra_info: { fi?: string } | null;
  /** Localized URL to the show's info page. */
  info_url?: { fi?: string; en?: string; sv?: string } | null;
  /**
   * Keywords attached to the event. Each keyword has a `@id` URL and an `id`
   * string (e.g. "yso:p4354" for children's shows).
   */
  keywords: Array<{ '@id': string; id: string }> | null;
  /** Target audience upper age limit — null when not specified by the publisher. */
  audience_max_age: number | null;
  /** Target audience lower age limit — null when not specified by the publisher. */
  audience_min_age: number | null;
};

/** Top-level Linked Events list-response envelope */
export type LinkedEventsResponse = {
  data: LinkedEvent[];
  meta: {
    count: number;
    next: string | null;
    previous: string | null;
  };
};

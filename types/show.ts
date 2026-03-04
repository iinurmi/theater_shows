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
  start_time: string; // ISO 8601
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

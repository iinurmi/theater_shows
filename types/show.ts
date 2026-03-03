/**
 * Normalized show type used throughout the app.
 * All times are ISO 8601 strings (UTC) as returned by the API.
 */
export type Show = {
  name: string;
  theater: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
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
    name?: {
      fi?: string;
      en?: string;
      sv?: string;
    };
  } | null;
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

/**
 * Venue display overrides for Helsinki theater listings.
 *
 * Maps LinkedEvents venue IDs to curated theater display names.
 * Used in toShow() to replace raw API venue names with consistent labels.
 *
 * Stage names are no longer stored here — they come from `location_extra_info.fi`
 * in the API response, which the API populates reliably for dedicated theater venues.
 *
 * Multi-purpose venues (Savoy-teatteri, Stoa, Vuotalo) have been intentionally
 * excluded: they produce too much non-theater noise (jazz, lectures, film).
 */

export type VenueConfig = {
  theater: string;
};

export const VENUES: Record<string, VenueConfig> = {
  'tprek:20879': { theater: 'Suomen Kansallisteatteri' },
  'tprek:9302': { theater: 'Helsingin Kaupunginteatteri' },
  'tprek:46367': { theater: 'Helsingin Kaupunginteatteri' },
  'tprek:9340': { theater: 'Helsingin Kaupunginteatteri' },
  'matko:2401': { theater: 'Helsingin Kaupunginteatteri' },
  'tprek:20755': { theater: 'Svenska Teatern' },
  'tprek:20668': { theater: 'Aleksanterin teatteri' },
  'tprek:21070': { theater: 'Q-teatteri' },
  'tprek:20956': { theater: 'KOM-teatteri' },
  'tprek:20822': { theater: 'Peacock-teatteri' },
  'tprek:21023': { theater: 'Teatteri Jurkka' },
  'tprek:20634': { theater: 'KokoTeatteri' },
  'tprek:9353': { theater: 'Lilla Teatern' },
  'tprek:20788': { theater: 'Ryhmäteatteri' },
  'tprek:20979': { theater: 'Teater Viirus' },
  'tprek:21144': { theater: 'Teatteri Takomo' },
  'tprek:24474': { theater: 'Teatteri Ilmi Ö' },
};

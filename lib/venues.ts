/**
 * Venue display overrides for Helsinki theater listings.
 *
 * Maps LinkedEvents venue IDs to curated theater/stage display names.
 * Used in toShow() to replace raw API venue names with consistent labels.
 */

export type VenueConfig = {
  theater: string;
  stage?: string;
};

export const VENUES: Record<string, VenueConfig> = {
  'tprek:20879': { theater: 'Suomen Kansallisteatteri' },
  'tprek:9302': { theater: 'Helsingin Kaupunginteatteri' },
  'tprek:46367': { theater: 'Helsingin Kaupunginteatteri', stage: 'Arena-näyttämö' },
  'tprek:9340': { theater: 'Helsingin Kaupunginteatteri', stage: 'Studio Pasila' },
  'matko:2401': { theater: 'Helsingin Kaupunginteatteri', stage: 'Pengerkadun näyttämö' },
  'tprek:20755': { theater: 'Svenska Teatern' },
  'tprek:20668': { theater: 'Aleksanterin teatteri' },
  'tprek:21070': { theater: 'Q-teatteri' },
  'tprek:7258': { theater: 'Savoy-teatteri' },
  'tprek:7259': { theater: 'Stoa' },
  'tprek:7260': { theater: 'Vuotalo' },
};

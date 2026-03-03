# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR
Switch the Linked Events API query from keyword-based (`yso:p2315`) to location-based filtering
(venue IDs). Major theaters like Kansallisteatteri and Kaupunginteatteri don't consistently tag
their events with the theater keyword, so they were invisible in listings. Querying by location ID
gives complete coverage for dedicated theater venues. Multi-purpose venues (Stoa, Vuotalo,
Savoy-teatteri) are removed from the listings entirely to avoid noise.

## Critical Decisions
- **Location-based over keyword-based**: Venue publishers tag events inconsistently; location IDs
  are reliable.
- **Remove Stoa, Vuotalo, Savoy-teatteri**: Multi-purpose venues bring too much non-theater noise
  (jazz, lectures, film). Not worth the complexity of a hybrid approach.
- **Stage from `location_extra_info.fi`**: The API returns stage names here (e.g. "Suuri näyttämö")
  — use this instead of hardcoded `stage` values in VENUES.
- **VENUES keys drive the query**: `Object.keys(VENUES)` builds the location param automatically —
  no separate list to maintain.

## Tasks

- [ ] 🟥 **Step 1: Update `LinkedEvent` type**
  - [ ] 🟥 Add optional `location_extra_info: { fi?: string } | null` field to `LinkedEvent` in
    `types/show.ts`

- [ ] 🟥 **Step 2: Simplify `VENUES` map**
  - [ ] 🟥 Remove `tprek:7258` (Savoy-teatteri), `tprek:7259` (Stoa), `tprek:7260` (Vuotalo)
  - [ ] 🟥 Remove the `stage?: string` field from `VenueConfig` and all entries — stage now comes
    from the API

- [ ] 🟥 **Step 3: Switch fetching strategy in `linkedevents.ts`**
  - [ ] 🟥 Replace `keyword` param in `buildUrl` with `location` param built from
    `Object.keys(VENUES).join(',')`
  - [ ] 🟥 Remove the `THEATER_KEYWORD` constant
  - [ ] 🟥 In `toShow()`, set `stage` from `event.location_extra_info?.fi` (fallback: `undefined`)
  - [ ] 🟥 Remove `venueConfig?.stage` reference (no longer in VENUES)

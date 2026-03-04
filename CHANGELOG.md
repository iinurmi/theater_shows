# Changelog

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## [Unreleased]

### Changed

- API query switched from keyword (`yso:p2315`) to venue location IDs; removes dependency on inconsistent publisher tagging — venues now always appear regardless of how they tag events
- Stage names read from `location_extra_info.fi` in the API response instead of hardcoded in `VENUES`
- `VenueConfig.stage` field removed; `VENUES` is now display-name overrides only
- `Show.endTime` is now optional; events without an end time are included (start time shown only)

### Fixed

- Kaupunginteatteri individual performances now appear — API publishes them with `end_time: null`, which was previously discarding all of them
- Day header could show wrong calendar day near midnight on UTC server; added `timeZone: 'Europe/Helsinki'` to `formatDayLabel`
- Removed debug `console.log` statements left in production code paths

### Removed

- Savoy-teatteri, Stoa, Vuotalo from `VENUES` — multi-purpose venues produce too much non-theater noise
- `HelloWorld` smoke-test component

---

### Added

- Helsinki theater show listings page (`/`) — public, mobile-first, no auth required
- Week view (Mon–Sun) with day grouping; today's section highlighted in amber
- `?week=YYYY-WNN` URL param drives week selection; bookmarkable, SSR-compatible
- Week navigation (prev/next) via `WeekNav` client component; updates URL with `router.replace`
- `lib/linkedevents.ts` — fetches live data from City of Helsinki Linked Events API (`yso:p2315`), paginates automatically, filters run-period entries (duration > 24 h)
- `lib/week.ts` — ISO 8601 week utilities: `getWeekBounds`, `getDaysOfWeek`, `prevWeek`, `nextWeek`, `formatWeekLabel`, `isSameDay`
- `types/show.ts` — `Show`, `LinkedEvent`, `LinkedEventsResponse` types
- API error banner renders in-page when Linked Events fetch fails (no crash)
- Malformed `?week` param silently falls back to current week

### Changed

- `app/page.tsx` — replaced HelloWorld placeholder with theater listings page
- `app/layout.tsx` — updated metadata: title `Helsinki Theater Shows`, Finnish-context description

### Removed

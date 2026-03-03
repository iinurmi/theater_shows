# Changelog

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## [Unreleased]

### Added

- `lib/venues.ts` — maps LinkedEvents venue IDs to curated theater/stage display names; used as override layer on top of raw API names
- `stage` field on `Show` type (optional); populated from `VENUES` when venue ID is known
- ShowCard now displays stage alongside theater when present (e.g., `Helsingin Kaupunginteatteri · Arena-näyttämö`)
- `id` field on `LinkedEvent.location` type to enable venue lookups

### Fixed

- Duration guard in run-period filter now checks both `start_time` and `end_time` before computing duration

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

# Changelog

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## [Unreleased]

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

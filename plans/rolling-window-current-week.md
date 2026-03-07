# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR

When viewing the current week, show a rolling 8-day window (yesterday + today + 6 days ahead) instead of the fixed Mon–Sun block. Past and future weeks are unaffected.

## Critical Decisions

- **Rolling window only for current week:** Past/future weeks keep fixed Mon–Sun boundaries — no change to those paths.
- **URL param stays ISO week string:** `?week=` is unchanged; only the displayed days and fetch bounds differ when on current week.
- **8-day window definition:** yesterday, today, and 6 days ahead (covers full "what's on soon" use case).
- **Cross-week boundary handled by fetch:** Need a separate `getRollingWindowBounds` for the API date-range query, since the window may span two ISO weeks.

## Tasks

- [ ] 🟥 **Step 1: Add rolling window helpers in `lib/week.ts`**
  - [ ] 🟥 Add `getRollingWindowDays(today: Date): Date[]` — returns 8 dates (today-1 … today+6)
  - [ ] 🟥 Add `getRollingWindowBounds(today: Date): { start: string; end: string }` — returns ISO date strings for API fetch range

- [ ] 🟥 **Step 2: Update `app/page.tsx` to use rolling window on current week**
  - [ ] 🟥 Detect if active week equals current ISO week (`getCurrentIsoWeek()`)
  - [ ] 🟥 If current week: use `getRollingWindowDays` for displayed days and `getRollingWindowBounds` for the API fetch
  - [ ] 🟥 Otherwise: keep existing Mon–Sun logic unchanged

- [ ] 🟥 **Step 3: Update `WeekNav` label for current week**
  - [ ] 🟥 When on current week, display rolling range label (e.g. "6.3 – 13.3.2026") instead of the ISO week Mon–Sun label
  - [ ] 🟥 Reuse `getRollingWindowDays` to derive the start/end dates for the label

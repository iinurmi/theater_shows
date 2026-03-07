# Architecture Decisions

Significant choices where future developers might ask "why did we do it this way?"

---

## 2026-03-01 — Supabase 2025 API key format adopted

**Why:** Supabase migrated to a new key format in 2025 (`sb_publishable_...` / `sb_secret_...`),
deprecating the legacy `anon` and `service_role` keys. We aligned immediately to avoid a forced
migration later and to stay compatible with the latest `@supabase/ssr` client.

**Impact:**
- Env var `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Env var `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`
- Both `lib/supabase/client.ts` and `lib/supabase/server.ts` updated
- Old `.env.example` deleted; env var names now documented in `ONBOARDING.md`

---

## 2026-03-07 — CHANGELOG.md removed; commit messages derived from git diff

**Why:** `CHANGELOG.md` duplicated information already in `git log`, requiring manual maintenance before every commit. Deriving the commit message directly from `git diff` is always accurate and eliminates the overhead. The `/commit` Step 3 checkpoint is preserved but repurposed to summarise the diff.

**Rule:** No CHANGELOG file. `/commit` Step 3 runs `git diff HEAD` and produces a bullet summary; Step 5 drafts the Conventional Commit from that summary.

---

## 2026-03-01 — `/document` runs before `/commit`, not after

**Why:** Documentation (DECISIONS.md, CLAUDE.md) belongs in the same commit as the code it describes. Running `/document` first means the commit message can be derived directly from the diff — no duplication of thought. Documenting after would split context across two commits.

**Rule:** Workflow order is always `/dev` → `/review` → `/document` → `/commit`.

---

## 2026-03-01 — `.claude/settings.local.json` excluded from git

**Why:** Despite holding project-relevant permission rules, the filename convention `*.local.*` signals machine-local config (same pattern as `.env.local`). Different developers may want different permission scopes. Gitignoring it prevents accidental commits and merge conflicts on a file that isn't truly shared state.

---

## 2026-03-01 — GitHub remote uses HTTPS, not SSH

**Why:** SSH host key for `github.com` was not present in `~/.ssh/known_hosts` on the dev machine, causing `git push` to fail with "Host key verification failed". HTTPS requires no key setup and works immediately with GitHub credential manager.

**Rule:** Keep `origin` as HTTPS (`https://github.com/iinurmi/theater_shows.git`). To switch to SSH later: add GitHub's public key via `ssh-keyscan github.com >> ~/.ssh/known_hosts`, add your SSH key to GitHub, then `git remote set-url origin git@github.com:iinurmi/theater_shows.git`.

---

## 2026-03-03 — Helsinki theater listings: live API, no Supabase, no cache

**Why:** The City of Helsinki Linked Events API is free, requires no auth, and updates hourly. Storing data in Supabase would add infra cost, a sync job, and stale-data risk with no benefit at this scale. `cache: 'no-store'` on every fetch keeps data fresh without complexity.

**Rule:** Theater show data always comes directly from `https://api.hel.fi/linkedevents/v1/`. Do not cache, proxy, or store it.

---

## 2026-03-03 — Week view only; URL-driven via `?week=YYYY-WNN`

**Why:** Always showing Mon–Sun keeps the UI simple (no day/week toggle state). Storing the selected week in the URL (`?week=2026-W10`) enables bookmarking, sharing, and server-side fetching without any client state management.

**Rule:** Week selection lives in the URL only. No `useState` for the current week. Default to `getCurrentIsoWeek()` when the param is absent or malformed.

---

## 2026-03-07 — Run-period entries collected as `RangeShow`, shown in "Running this week" section

**Why:** The Linked Events API returns both discrete performances (duration ≤ 24 h) and open-ended "run-period" entries (e.g., "show runs 1.3.–1.5.2026", duration > 24 h). Previously these were discarded. They're now collected as `RangeShow` and displayed in a dedicated section below the daily calendar, giving users visibility into longer-running productions.

**Rule:** Duration > 24 h → `toRangeShow()` → `RangeShow[]`. Duration ≤ 24 h → `toShow()` → `Show[]`. `fetchShowsForBounds` returns `{ shows, rangeShows }` (the `FetchResult` type). Dedup: any `RangeShow` whose `name` matches a timed `Show` in the same week is excluded (heuristic, acceptable false-positive rate).

---

## 2026-03-03 — `sv-SE` locale for Helsinki timezone date comparison

**Why:** To determine if a Date falls on "today" in Helsinki time (EET/EEST), we need a YYYY-MM-DD string in the `Europe/Helsinki` timezone. `toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' })` produces exactly that format reliably across all JS environments. Comparing these strings avoids clock-skew errors that would occur if using the UTC server's local midnight as the rollover point.

**Rule:** For any "is today?" or date-equality check that must reflect Helsinki time, use `toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' })`. To get today as a `Date` object server-side, use `getTodayHelsinki()` from `lib/week.ts` — never `new Date()` directly.

---

## 2026-03-04 — Location-based API querying replaces keyword-based

**Why:** Keyword (`yso:p2315`) was unreliable — major theaters (Kansallisteatteri, Kaupunginteatteri) don't consistently tag their events with the theater keyword, so they were invisible in listings. Querying by location ID (`tprek:XXXXX`) gives guaranteed coverage for dedicated theater venues regardless of tagging.

Multi-purpose venues (Savoy-teatteri, Stoa, Vuotalo) removed entirely — they produce too much non-theater noise (jazz, lectures, film).

**Rule:** API query uses `location=<venue IDs>`. `Object.keys(VENUES)` builds the param automatically — adding a venue to `venues.ts` is the only change needed to include it. Do not add keyword-based filtering back.

---

## 2026-03-04 — `Show.endTime` is optional; events with null end_time are shown

**Why:** Several Helsinki theater publishers (including all Kaupunginteatteri venues) publish individual performances with `start_time` set but `end_time: null`. The previous null guard in `toShow()` discarded all such events, hiding all Kaupunginteatteri shows. The run-period filter (`duration > 24h`) already guards against season-span entries — a separate `end_time` presence check is redundant.

**Rule:** `Show.endTime` is `string | undefined`. When absent, show only start time in the UI. Do not require `end_time` to include an event.

---

## 2026-03-07 — `include=keywords` not used in API query

**Why:** Adding `include=keywords` as a second `include` param alongside `include=location` caused the LinkedEvents API to stop expanding the location object (it silently honoured only one), breaking venue resolution ("Unknown venue" for all shows). We don't need expanded keyword objects for anything, so this param is omitted entirely.

**Rule:** Only `include=location` is passed to the Linked Events API. Do not add `include=keywords`; it breaks venue lookup.

---

## 2026-03-07 — Rolling 7-day window for current week view (today + 6)

**Why:** Fixed Mon–Sun hides shows "on right now" mid-week and doesn't surface upcoming shows across the weekend boundary. A 7-day window (today + 6 days ahead) shows what's relevant without navigation — yesterday is already gone, no point displaying it. Past/future weeks keep Mon–Sun — historical browsing benefits from a stable, predictable grid.

**Rule:** When `isoWeek === getCurrentIsoWeek()`, use `getRollingWindowDays(today)` for displayed days and `getRollingWindowBounds(today)` for the API fetch. Both functions return a 7-day range starting from `today` (inclusive). The `?week=` URL param is unchanged. The window may span two ISO weeks, so the fetch uses `fetchShowsForDateRange(start, end)` with explicit `Date` bounds rather than `fetchShowsForWeek`. Always derive `today` from `getTodayHelsinki()`, not `new Date()`.

---

## 2026-03-07 — Children's show filter removed; detection unreliable

**Why:** The `yso:p4354` keyword and `audience_max_age` signals are inconsistently applied by Helsinki event publishers — detection gave false positives and false negatives. The filter created UI noise without reliable value. Full removal (types, API logic, component, URL param) was chosen over improving detection; data quality is too inconsistent to fix at the source.

**Rule:** No `isChildrensShow` field on `Show` or `RangeShow`. No `?children=` URL param. Do not re-add a children's filter without a reliable detection signal.

---

## 2026-03-07 — Week picker: `react-day-picker` with `mode="range"` + `onDayClick` snap

**Why:** `react-day-picker` v9 removed the dedicated week-selection mode. Using `mode="range"` with an `onDayClick` handler that snaps the clicked day to its Mon–Sun range achieves identical UX. The library is Tailwind-compatible (no CSS-in-JS), ships its own types, and works cross-browser including Safari.

**Alignment gotcha:** When `showWeekNumber` is enabled, both the header row (`weekdays`) and data rows (`week`) must have `flex` in `classNames`, and `week_number_header` must have `w-8` to match the week-number column width. Without this, day-name headers collapse to content width and misalign with the date cells below.

**Rule:** Do not use a dedicated week-picker library. `DayPicker` with `mode="range"` + day-snap is the pattern. Styling via `classNames` prop only — no custom CSS file. `weekdays: 'flex'` and `week_number_header: 'w-8'` are required when `showWeekNumber` is set.

---

## 2026-03-07 — `location_extra_info.fi` capped at 60 chars; longer = discard

**Why:** The Linked Events API sometimes returns long accessibility descriptions (paragraphs) in `location_extra_info.fi` instead of a short stage name. Showing a truncated accessibility essay as the stage label is misleading. Discarding any value over 60 chars shows nothing — which is better than wrong.

**Rule:** In `extractCommonFields()`, if `rawStageValue.length > 60` set it to `undefined`. Real stage names (e.g. "Suuri näyttämö", "Pieni näyttämö") are well under 60 chars.

---

## 2026-03-07 — Theater name prefix stripped at data layer, not render layer

**Why:** The Linked Events API sometimes duplicates the theater name inside the stage field (e.g. stage `"Kansallisteatteri - Suuri näyttämö"` when theater is already `"Kansallisteatteri"`). Stripping at render time would require the fix in every component that displays venue info. Stripping in `extractCommonFields()` in `lib/linkedevents.ts` fixes it once for all consumers (`ShowCard`, `RunningThisWeek`, any future components).

**Rule:** `stripTheaterPrefix(theater, stage)` in `lib/linkedevents.ts` is the single place for this cleanup. It checks common separators (` - `, ` · `, `: `, ` – `) case-insensitively. Do not add display-layer workarounds.

---

## 2026-03-07 — Venue text wraps to new line on mobile, not truncated

**Why:** Truncation with ellipsis hid useful information (stage name, theater name) without giving the user a way to see it. Wrapping venue below the show name on mobile (stacked flex column) keeps all text visible and readable. On desktop (≥ sm breakpoint) name and venue sit side-by-side as before, capped at `max-w-[16rem]` so a very long venue string can't crowd the show name.

**Rule:** `ShowCard` uses `flex-col` on mobile and `sm:flex-row` on desktop. `RunningThisWeek` always stacks name+venue (no sm row — date-range column already occupies the right). No `truncate` class on venue spans.

---

## 2026-03-07 — External fetch timeout: 8 s via AbortSignal.timeout()

**Why:** Without a timeout, a slow or hung Linked Events API response blocks the Next.js server render indefinitely for every in-flight user request. `AbortSignal.timeout(ms)` is built-in to Node 17+ (no extra imports) and throws `AbortError` after the specified duration, which the existing `try/catch` in `page.tsx` converts to a user-facing error banner.

**Rule:** All `fetch()` calls to external APIs use `signal: AbortSignal.timeout(8_000)`. 8 s is generous for a paginated JSON API; lower if the API proves consistently fast. See `FETCH_TIMEOUT_MS` constant in `lib/linkedevents.ts`.

---

## 2026-03-07 — "Today" shortcut in WeekNav: bar button + popup button

**Why:** When navigating to past/future weeks, there was no one-click way back to the current rolling window.

**Rule:**
- Bar button (page level): rendered below the nav bar only when `!isCurrentWeek`. Copy: "↩ Back to Today". Calls `navigate(getCurrentIsoWeek())`.
- Popup button: always shown at the top of the calendar popup. Copy: "↩ Today". Calls `setCalendarMonth(new Date())` + `navigate(getCurrentIsoWeek())` + `handleClose()`.
- `calendarMonth` is controlled state (not `defaultMonth`) so the popup button can sync the displayed month without reopening the picker.

---

## 2026-03-07 — Sticky WeekNav bar: IntersectionObserver, full mini-nav, fixed popup

**Why:** On mobile, once the user scrolls past the week nav there's no quick way to change weeks without scrolling back up.

**Approach:** `IntersectionObserver` on the main `<nav>` ref — zero deps, no scroll-event polling. When the nav leaves the viewport, a `fixed top-0` bar appears; when it re-enters, the bar disappears.

**Scope:** Sticky bar shows ← [week label ▾] → (full mini-nav). The week label opens the same calendar popup as the main nav, sharing `isOpen` state and `handleWeekSelect`. No Today button in the sticky bar.

**Popup positioning:** The popup is inside the `<nav>` (relative-positioned), so `absolute top-full` works when the main nav is visible. When `!isNavVisible`, the popup switches to `fixed top-[52px]` to anchor it below the sticky bar. `52px` matches the sticky bar's rendered height (`py-2` + `text-base` button). If bar height changes, update this value.

**Outside-click detection:** Two trigger refs (`triggerRef` for main nav, `stickyTriggerRef` for sticky bar) are both excluded from the `pointerdown` close handler. `stickyTriggerRef.current` is null when the bar is unmounted; the `?? false` fallbacks guard against this.

**Desktop:** `md:hidden` on the sticky bar — `IntersectionObserver` fires correctly on desktop too, but the bar is CSS-hidden so it never renders visually.

**Location:** Entirely inside `components/WeekNav.tsx`. No new files or components.

---

## 2026-03-01 — Named exports for all React components

**Why:** Consistent with TypeScript best practices and easier to tree-shake. Default exports make
refactoring harder (rename the file ≠ rename the import). Named exports also work better with
barrel files if we add them later.

**Rule:** All files in `components/` use named exports — no `export default`.

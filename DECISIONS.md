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

## 2026-03-01 — `/document` runs before `/commit`, not after

**Why:** Documentation (CHANGELOG, DECISIONS, CLAUDE.md) belongs in the same commit as the code it describes. Running `/document` first means the commit message can be derived directly from the CHANGELOG entry — no duplication of thought. Documenting after would split context across two commits.

**Rule:** Workflow order is always `/dev` → `/review` → `/document` → `/commit`.

---

## 2026-03-01 — `.claude/settings.local.json` excluded from git

**Why:** Despite holding project-relevant permission rules, the filename convention `*.local.*` signals machine-local config (same pattern as `.env.local`). Different developers may want different permission scopes. Gitignoring it prevents accidental commits and merge conflicts on a file that isn't truly shared state.

---

## 2026-03-01 — GitHub remote uses HTTPS, not SSH

**Why:** SSH host key for `github.com` was not present in `~/.ssh/known_hosts` on the dev machine, causing `git push` to fail with "Host key verification failed". HTTPS requires no key setup and works immediately with GitHub credential manager.

**Rule:** Keep `origin` as HTTPS (`https://github.com/iinurmi/Claude_setup_app.git`). To switch to SSH later: add GitHub's public key via `ssh-keyscan github.com >> ~/.ssh/known_hosts`, add your SSH key to GitHub, then `git remote set-url origin git@github.com:iinurmi/Claude_setup_app.git`.

---

## 2026-03-03 — Helsinki theater listings: live API, no Supabase, no cache

**Why:** The City of Helsinki Linked Events API is free, requires no auth, and updates hourly. Storing data in Supabase would add infra cost, a sync job, and stale-data risk with no benefit at this scale. `cache: 'no-store'` on every fetch keeps data fresh without complexity.

**Rule:** Theater show data always comes directly from `https://api.hel.fi/linkedevents/v1/`. Do not cache, proxy, or store it.

---

## 2026-03-03 — Week view only; URL-driven via `?week=YYYY-WNN`

**Why:** Always showing Mon–Sun keeps the UI simple (no day/week toggle state). Storing the selected week in the URL (`?week=2026-W10`) enables bookmarking, sharing, and server-side fetching without any client state management.

**Rule:** Week selection lives in the URL only. No `useState` for the current week. Default to `getCurrentIsoWeek()` when the param is absent or malformed.

---

## 2026-03-03 — Run-period filter: discard events where duration > 24 h

**Why:** The Linked Events API returns both discrete performances and open-ended "run-period" entries (e.g., "show runs Jan–Mar"). The only reliable signal is duration: real performances have a specific end time ≤ 24 h after start. Events without `end_time` or with duration > 24 h are dropped.

---

## 2026-03-03 — `sv-SE` locale for Helsinki timezone date comparison

**Why:** To determine if a Date falls on "today" in Helsinki time (EET/EEST), we need a YYYY-MM-DD string in the `Europe/Helsinki` timezone. `toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' })` produces exactly that format reliably across all JS environments. Comparing these strings avoids clock-skew errors that would occur if using the UTC server's local midnight as the rollover point.

**Rule:** For any "is today?" or date-equality check that must reflect Helsinki time, use `helsinkiDateString(date)` from `DaySection.tsx` or an equivalent.

---

## 2026-03-03 — Location-based querying abandoned; VENUES kept as display-name overrides

**Why:** Attempted to query the Linked Events API by venue location ID (e.g., `tprek:20879` for Kansallisteatteri) instead of keyword, so theaters that don't tag with `yso:p2315` would appear. Confirmed via live API testing that the major Helsinki theaters (Kansallisteatteri, Kaupunginteatteri, etc.) only post **season/run-period entries** to Linked Events — one event covering the entire run (Jan–May), not individual nightly performances. The existing 24-hour duration filter correctly discards these, leaving zero results.

The `yso:p2315` keyword query is the only reliable way to get individual show instances; those come from smaller/different venues that do post discrete performances.

**Rule:** `lib/venues.ts` is kept as a **display-name override map only** — not used for filtering. If a venue in the list ever appears in a keyword-based result, it gets a clean curated name and optional stage label. Do not add location-based filtering to API queries.

---

## 2026-03-01 — Named exports for all React components

**Why:** Consistent with TypeScript best practices and easier to tree-shake. Default exports make
refactoring harder (rename the file ≠ rename the import). Named exports also work better with
barrel files if we add them later.

**Rule:** All files in `components/` use named exports — no `export default`.

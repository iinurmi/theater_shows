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

## 2026-03-01 — Named exports for all React components

**Why:** Consistent with TypeScript best practices and easier to tree-shake. Default exports make
refactoring harder (rename the file ≠ rename the import). Named exports also work better with
barrel files if we add them later.

**Rule:** All files in `components/` use named exports — no `export default`.

# Commit Command

You are preparing a clean, well-scoped git commit for **First Claude App**.

Follow these steps in order. Stop and report if any step fails.

---

## Step 1 — Quality Gate

Run both checks. **Do not proceed if either fails** — report the errors and stop.

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npm run type-check
npm run lint
```

Report: "✅ Quality gate passed" or "❌ [command] failed — fix before committing."

---

## Step 2 — Diff Review

Run:
```bash
git diff --stat HEAD
git status --short
```

- If total lines changed across all files is **> 200**, warn:
  > "⚠️ Large diff detected. Consider splitting into smaller commits. Proceed anyway? (yes/no)"
  Wait for user confirmation before continuing.
- List any files that look sensitive or unexpected (`.env*`, `*.key`, `*.pem`, secrets). Stop and flag them.

---

## Step 3 — Summarise Diff

Run:
```bash
git diff --cached HEAD
```
(If nothing is staged yet, run `git diff HEAD` instead.)

Read the diff and produce a short human-readable summary of what changed — a few bullet points covering the key additions, removals, and modifications. You will use this summary in Step 5 to draft the commit message.

---

## Step 4 — Stage Files

Stage all tracked modifications and untracked files **except**:
- `.claude/settings.local.json` — machine-local, never commit
- `.env*` files — secrets, never commit
- Any file flagged in Step 2

Run:
```bash
git add -A
git reset HEAD .claude/settings.local.json
```

Then show the final staged list:
```bash
git diff --cached --stat
```

Confirm with user: "Stage looks correct? (yes/no)"

---

## Step 5 — Propose Commit Message

Using the diff summary produced in Step 3, draft a **Conventional Commit** message:

Format:
```
<type>: <short imperative summary>

- bullet from changelog
- bullet from changelog
```

Choose `type` from: `feat` `fix` `refactor` `chore` `docs` `style`

Use `feat` if any new capability was added. Use `chore` for tooling/config-only changes.

Present the message and ask: "Use this message? (yes / edit)"

If user says edit, ask them to provide the message or adjustments.

---

## Step 6 — Commit

Run with the approved message:
```bash
git commit -m "$(cat <<'EOF'
<approved message here>
EOF
)"
```

Confirm: "✅ Committed. SHA: [short hash]"

---

## Step 7 — Push (Optional)

Ask: "Push to remote now? (yes/no)"

- **yes**: run `git push` and report the result.
- **no**: remind the user to push when ready: `git push origin <branch>`.

---

## Done

Report:
```
## Commit Summary
- Commit: <short SHA> — <message first line>
- Files: <N files changed>
- Pushed: yes / no
```

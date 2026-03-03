# Update Documentation Task

You are updating documentation after code changes.

## 1. Identify Changes
- Check git diff or recent commits for modified files
- Identify which features/modules were changed
- Note any new files, deleted files, or renamed files

## 2. Verify Current Implementation
**CRITICAL**: DO NOT trust existing documentation. Read the actual code.

For each changed file:
- Read the current implementation
- Understand actual behavior (not documented behavior)
- Note any discrepancies with existing docs

## 3. Update Relevant Documentation

- **CHANGELOG.md**: Add entry under "Unreleased" section
  - Use categories: Added, Changed, Fixed, Security, Removed
  - Be concise, user-facing language

- **DECISIONS.md**: Add an entry if the change involved a significant architectural or infrastructure choice
  - Format: `## YYYY-MM-DD — [Title]` with a short "Why" paragraph
  - Only for non-obvious choices where future developers would ask "why did we do it this way?"
  - Examples: choosing a library, key naming conventions, infra decisions

- **CLAUDE.md**: Update if the change establishes or modifies a coding convention, pattern, or rule Claude should follow
  - Examples: new env var naming scheme, new folder conventions, new helper patterns

- **plans/**: If a plan in `/plans` is now 100% complete, extract any "Critical Decisions" to `DECISIONS.md` or `CLAUDE.md` as appropriate, then delete the plan file

## 4. Documentation Style Rules

✅ **Concise** - Sacrifice grammar for brevity
✅ **Practical** - Examples over theory
✅ **Accurate** - Code verified, not assumed
✅ **Current** - Matches actual implementation

❌ No enterprise fluff
❌ No outdated information
❌ No assumptions without verification

## 5. Ask if Uncertain

If you're unsure about intent behind a change or user-facing impact, **ask the user** - don't guess.
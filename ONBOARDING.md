# Onboarding Guide — First Claude App

> For Claude Code: read this file when helping with initial setup on a new machine.
> It covers everything needed to go from a fresh clone to a running dev environment.

---

## Prerequisites

Install these before anything else:

- **Node.js v20+** — [nodejs.org/en/download](https://nodejs.org/en/download)
- **Git** — [git-scm.com](https://git-scm.com)
- **Claude Code** — see [Claude Code Setup](#claude-code-setup) below

Verify installs:

```bash
node --version   # should be v20+
npm --version
git --version
```

---

## Main Setup

### 1. Clone the repository

```bash
git clone https://github.com/iinurmi/Claude_setup_app.git
cd Claude_setup_app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create a `.env.local` file in the project root (never commit this file):

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Get these values from: **Supabase Dashboard → Your Project → Project Settings → API**

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable key (2025 format, starts with `sb_publishable_`)
- `SUPABASE_SECRET_KEY` — Secret key (2025 format, starts with `sb_secret_`) — server-side only, never expose to the client

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the app running.

---

## Claude Code Setup

### Install Claude Code

**Option A — VS Code extension (recommended):**
Install the [Claude Code extension](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code) from the VS Code marketplace.

**Option B — CLI:**
```bash
npm install -g @anthropic-ai/claude-code
```

### Authenticate

```bash
claude
```

Follow the browser auth flow to link your Anthropic account.

### Recreate local permissions file

`.claude/settings.local.json` is gitignored and must be recreated manually. Create it at the project root:

```json
{
  "permissions": {
    "allow": [
      "Bash(node --version)",
      "Bash(npm --version)",
      "Bash(npx --version)",
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(git checkout*)",
      "Bash(git branch*)",
      "Bash(git init)",
      "Bash(git remote*)",
      "Bash(export PATH=\"/c/Program Files/nodejs:$PATH\")",
      "Bash(git commit:*)",
      "Bash(git --version)",
      "Bash(npm install)",
      "WebFetch(domain:api.hel.fi)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(curl * | bash)"
    ]
  }
}
```

This grants Claude Code permission to run common project commands without prompting on every call.

---

## Additional: Windows PATH Fix

On Windows, bash sessions (Git Bash, VS Code terminal) may not find Node.js automatically.

**Temporary fix** (run once per terminal session):
```bash
export PATH="/c/Program Files/nodejs:$PATH"
```

**Permanent fix** (add to `~/.bashrc`):
```bash
echo 'export PATH="/c/Program Files/nodejs:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify it works:
```bash
node --version
npm --version
```

---

## Additional: Create a Supabase Project (if one doesn't exist yet)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, region, and database password
3. Wait for provisioning (~1 min)
4. Go to **Project Settings → API**
5. Copy the values into `.env.local` as described in [step 3](#3-create-the-environment-file)

> **Key format note:** This project uses the Supabase 2025 key format.
> Keys look like `sb_publishable_...` and `sb_secret_...`, not the older `eyJ...` JWT format.

---

## Available Commands

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start development server         |
| `npm run build`      | Create production build          |
| `npm run lint`       | Check for ESLint issues          |
| `npm run lint:fix`   | Auto-fix ESLint issues           |
| `npm run format`     | Format all files with Prettier   |
| `npm run type-check` | Run TypeScript compiler check    |

---

## Verify Everything Works

After setup, run these checks:

```bash
npm run type-check   # should pass with no errors
npm run lint         # should pass with no errors
npm run dev          # should start on localhost:3000
```

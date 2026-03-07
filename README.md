# Helsinki Theater Shows

Weekly theater performance listings for the Helsinki area, powered by the City of Helsinki Linked Events API.

## Getting Started

### Prerequisites

- Node.js v20+ — [download here](https://nodejs.org/en/download)
- A [Supabase](https://supabase.com) account (free)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/iinurmi/theater_shows.git
   cd theater_shows
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create `.env.local` in the project root with your Supabase credentials.
   See [ONBOARDING.md](./ONBOARDING.md) for the exact variables and where to find them.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Create production build  |
| `npm run lint`       | Check for code issues    |
| `npm run format`     | Auto-format all files    |
| `npm run type-check` | Check TypeScript types   |

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) — App Router
- **Language**: TypeScript
- **Database + Auth**: [Supabase](https://supabase.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Data source**: [City of Helsinki Linked Events API](https://api.hel.fi/linkedevents/v1/)

## Project Conventions

See [ONBOARDING.md](./ONBOARDING.md) for full setup instructions including Claude Code configuration and Windows-specific steps.

See [CLAUDE.md](./CLAUDE.md) for coding conventions, architecture decisions, and Claude Code instructions.

See [DECISIONS.md](./DECISIONS.md) for the architectural decision log.

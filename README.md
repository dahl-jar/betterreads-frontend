# BetterReads frontend

BetterReads is a React app for finding books and keeping track of what you read. Readers can also review books and join discussions.

React 19 · TypeScript · Vite · Tailwind CSS · Vitest · MSW

## Setup

Node and pnpm are pinned by the repository.

```bash
nvm use
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

`VITE_API_BASE_URL` sets the backend origin. The example file points to the local BetterReads service.

## Commands

```bash
# development server
pnpm dev

# tests
pnpm test

# full check
pnpm check

# production bundle
pnpm build
```

## Tests

Tests mock HTTP with MSW. They do not call the BetterReads API.

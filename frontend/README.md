# Quote Collector — Frontend

Next.js web app for the Quote Collector project.

## Services used

| Service | Purpose |
|---------|---------|
| [Clerk](https://clerk.com) | Authentication (sign-in, session tokens) |
| [Sentry](https://sentry.io) | Error monitoring |

The frontend talks to the backend API. Make sure the backend is running before starting the frontend.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...
```

Get the Clerk keys from the [Clerk dashboard](https://dashboard.clerk.com) under your app's API Keys page.
Get the Sentry DSN from your Sentry project's Settings → Client Keys.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key libraries

- **Next.js 15** with App Router and Turbopack
- **Tailwind CSS v4**
- **shadcn/ui** (base-ui components)
- **Clerk** (`@clerk/nextjs`) for auth
- **Sentry** (`@sentry/nextjs`) for error tracking
- **Lucide React** for icons

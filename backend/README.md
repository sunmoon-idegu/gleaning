# Quote Collector — Backend

FastAPI REST API for the Quote Collector project.

## Services used

| Service | Purpose |
|---------|---------|
| [Neon](https://neon.tech) | Serverless PostgreSQL database |
| [Clerk](https://clerk.com) | JWT verification for authenticated requests |
| [Sentry](https://sentry.io) | Error monitoring |

## Local setup

### 1. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Create a `.env` file in this directory:

```env
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require

CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

SENTRY_DSN=https://...@....ingest.sentry.io/...

ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

- `DATABASE_URL` — connection string from your Neon project dashboard.
- Clerk keys — from the [Clerk dashboard](https://dashboard.clerk.com) under API Keys.
- `ALLOWED_ORIGINS` — comma-separated list of frontend origins allowed by CORS.
- `ENV` — set to `production` on the server to reduce Sentry sample rate.

### 4. Run database migrations

```bash
alembic upgrade head
```

### 5. Start the dev server

```bash
uvicorn main:app --reload
```

API runs at [http://localhost:8000](http://localhost:8000).
Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).

## Key libraries

- **FastAPI** — API framework
- **SQLAlchemy** — ORM
- **Alembic** — database migrations
- **asyncpg / psycopg2** — PostgreSQL driver
- **sentry-sdk[fastapi]** — error tracking

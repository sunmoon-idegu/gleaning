# Quote Collector

A personal app to capture and revisit quotes from books, videos, and conversations.

Quotes are organized by source and tagged for browsing. A full-text search lets you find anything across your collection.

## Structure

```
quote/
├── frontend/   # Next.js web app
└── backend/    # FastAPI REST API
```

## Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js, Tailwind CSS, shadcn/ui, Clerk |
| Backend  | FastAPI, SQLAlchemy, PostgreSQL (Neon) |
| Auth     | Clerk |
| Errors   | Sentry |

## Getting started

See the README in each subdirectory:

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)

# Build Tasks

Ordered by dependency. Complete each milestone before moving to the next.
Reference: SPEC.md

---

## Milestone 1 — Project Scaffolding

Get a running skeleton: frontend talks to backend, backend talks to database.

- [ ] **1.1** Create Next.js app (`/frontend`)
  - `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] **1.2** Create FastAPI app (`/backend`)
  - `pip install fastapi uvicorn psycopg2-binary python-dotenv`
  - Basic `main.py` with a `/health` endpoint
- [ ] **1.3** Create Neon project
  - Sign up at neon.tech, create a project called `quote`
  - Save the `DATABASE_URL` connection string
- [ ] **1.4** Create Clerk project
  - Sign up at clerk.com, create application
  - Enable Google as a sign-in provider
  - Save `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- [ ] **1.5** Wire environment variables
  - `frontend/.env.local`: Clerk publishable key, backend URL
  - `backend/.env`: DATABASE_URL, Clerk secret key
- [ ] **1.6** Verify end-to-end: frontend can call `/health` on backend

---

## Milestone 2 — Database Schema

Define all tables before writing any API logic.

- [ ] **2.1** Install migration tool
  - Use `alembic` for Python database migrations
  - `pip install alembic sqlalchemy`
- [ ] **2.2** Create `users` table
  ```sql
  users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id    TEXT UNIQUE NOT NULL,   -- Clerk's user ID
    email       TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
  )
  ```
- [ ] **2.3** Create `books` table
  ```sql
  books (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    author      TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
  )
  ```
- [ ] **2.4** Create `sources` table
  ```sql
  sources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,          -- 'book' | 'video' | 'spoken' | 'unknown'
    title       TEXT,
    author      TEXT,
    url         TEXT,                   -- for video sources
    context     TEXT,                   -- for spoken sources
    book_id     UUID REFERENCES books(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
  )
  ```
- [ ] **2.5** Create `quotes` table
  ```sql
  quotes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    author      TEXT,                   -- direct author (if no source)
    page        INTEGER,                -- only when source is a book
    source_id   UUID REFERENCES sources(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
  )
  ```
- [ ] **2.6** Create `tags` table
  ```sql
  tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    UNIQUE(user_id, name)
  )

  quote_tags (
    quote_id    UUID REFERENCES quotes(id) ON DELETE CASCADE,
    tag_id      UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (quote_id, tag_id)
  )
  ```
- [ ] **2.7** Add full-text search index on `quotes.text`
  ```sql
  CREATE INDEX quotes_text_search ON quotes USING gin(to_tsvector('english', text));
  ```
- [ ] **2.8** Run migrations against Neon, verify tables exist

---

## Milestone 3 — Auth

Lock down the app so only you can use it (for now).

- [ ] **3.1** Add Clerk to Next.js frontend
  - Install `@clerk/nextjs`
  - Wrap app in `<ClerkProvider>`
  - Add `<SignIn />` page at `/sign-in`
  - Protect all routes via `middleware.ts`
- [ ] **3.2** Add Clerk JWT verification to FastAPI
  - Install `clerk-backend-sdk` (Python)
  - Create `auth.py` dependency that validates Bearer token on every request
  - Extracts `clerk_id` from token
- [ ] **3.3** Auto-create user on first login
  - FastAPI: if `clerk_id` not in `users` table, insert new user
  - This happens transparently on first authenticated API call
- [ ] **3.4** Verify: login with Google, token passed to backend, user row created

---

## Milestone 4 — Backend API

Build all endpoints. Frontend comes after.

### Books
- [ ] **4.1** `GET /books` — list all books for current user
- [ ] **4.2** `POST /books` — create a book (`title`, optional `author`)
- [ ] **4.3** `GET /books/{id}` — get one book + all its quotes
- [ ] **4.4** `PATCH /books/{id}` — update title or author
- [ ] **4.5** `DELETE /books/{id}` — delete book (quotes remain, source unlinked)

### Quotes
- [ ] **4.6** `GET /quotes` — list all quotes, newest first, with source info
- [ ] **4.7** `POST /quotes` — create a quote
  - Required: `text`
  - Optional: `source_id`, `author`, `page`, `tag_ids`
- [ ] **4.8** `GET /quotes/{id}` — get one quote
- [ ] **4.9** `PATCH /quotes/{id}` — edit quote
- [ ] **4.10** `DELETE /quotes/{id}` — delete quote

### Sources
- [ ] **4.11** `GET /sources` — list all non-book sources (videos, spoken, unknown)
- [ ] **4.12** `POST /sources` — create a source
- [ ] **4.13** `DELETE /sources/{id}` — delete source

### Tags
- [ ] **4.14** `GET /tags` — list all tags for current user
- [ ] **4.15** `POST /tags` — create a tag
- [ ] **4.16** `DELETE /tags/{id}` — delete tag

### Search
- [ ] **4.17** `GET /search?q=` — full-text search across quote text, book title, author, tags
  - Returns quotes with matched fields highlighted

---

## Milestone 5 — Frontend UI

Build screens in order of importance (quote entry first).

### Layout
- [ ] **5.1** App shell: sidebar or top nav with links to Feed, Shelf, Search, Add Quote
- [ ] **5.2** Auth-aware header (show user avatar, sign out button)

### Quote Entry (most important screen)
- [ ] **5.3** "Add Quote" page — the primary action
  - Large text area for quote (auto-focus on load)
  - Source selector: tabs for Book / Video / Spoken / None
  - Book tab: searchable dropdown (existing books) + "Add new book" inline + page number field
  - Author field (shown when no source or source has no author)
  - Tags field (free-form, comma separated or tag chips)
  - Submit on `Cmd+Enter` / `Ctrl+Enter`
- [ ] **5.4** "Add new book" inline modal (title + author, submit returns to quote form)

### Quote Feed
- [ ] **5.5** Feed page: all quotes newest first
  - Each card shows: quote text, source/author, page (if book), tags, date
- [ ] **5.6** Click a quote card → expand or open detail view with edit option

### Bookshelf
- [ ] **5.7** Shelf page: grid of all books with quote count
- [ ] **5.8** Book detail page: book info + all quotes sorted by page number

### Search
- [ ] **5.9** Search bar (always visible in nav)
- [ ] **5.10** Search results page: quotes matching query, with source info

### Edit / Delete
- [ ] **5.11** Edit quote form (same layout as Add Quote, pre-filled)
- [ ] **5.12** Delete confirmation (quote, book)

---

## Milestone 6 — Polish

Do this only after Milestone 5 is fully working.

- [ ] **6.1** Loading skeletons on feed and shelf
- [ ] **6.2** Empty states ("No quotes yet — add your first one")
- [ ] **6.3** Error handling (network errors, form validation messages)
- [ ] **6.4** Mobile-responsive layout (works in phone browser)
- [ ] **6.5** Keyboard navigation audit (Tab order, Enter to submit everywhere)
- [ ] **6.6** Page titles and favicon

---

## Build Order Summary

```
M1 Scaffolding  →  M2 Schema  →  M3 Auth  →  M4 API  →  M5 UI  →  M6 Polish
     (1 day)        (1 day)       (1 day)     (2 days)   (3 days)   (1 day)
```

Start each milestone only when the previous one is verified working.

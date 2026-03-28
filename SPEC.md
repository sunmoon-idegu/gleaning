# Quote Collector — Spec

## Purpose

A personal web app to capture and recall beautiful sentences and paragraphs — from books, videos, conversations, or anywhere.
The core loop: encounter something worth keeping → type it → find it later.

---

## Users

**Phase 1 (now):** Single user (yourself). Private, invite-only.
**Phase 2 (later):** Open to others, potentially monetized.

All data is user-scoped from day one so Phase 2 requires no data model changes.

---

## Core Concepts

### Source
Where a quote came from. A source is optional — sometimes you don't know or don't care.

| Source Type | Fields                              | Example                          |
|-------------|-------------------------------------|----------------------------------|
| `book`      | title, author (optional), page (optional) | *Meditations*, Marcus Aurelius, p.42 |
| `video`     | title, author/speaker (optional), url (optional) | YouTube talk, interview          |
| `spoken`    | author/speaker (optional), context (optional) | Heard at a talk, conversation    |
| `unknown`   | —                                   | No idea where it came from       |

Books are the primary source type and get first-class treatment (dedicated shelf view).

### Quote
A sentence or paragraph worth keeping.

| Field      | Type       | Required | Notes                                    |
|------------|------------|----------|------------------------------------------|
| text       | string     | yes      | The quote itself                         |
| source     | Source     | no       | Where it came from (any type above)      |
| author     | string     | no       | Who said/wrote it (if not via a source)  |
| created_at | date       | auto     | When it was entered                      |
| tags       | string[]   | no       | Optional labels, e.g. "grief", "time"    |

---

## Features

### 1. Source Management
- Add a new book (title, optional author)
- View bookshelf — grid or list of all books
- Tap a book → see all quotes from that book, sorted by page number

### 2. Quote Entry (primary action — must be fast)
- **Text** is the only required field — everything else is optional
- Optionally attach a source:
  - Book: searchable dropdown of existing books + page number field
  - Video: title + optional URL
  - Spoken: speaker + optional context note
  - Unknown: no fields
- Optionally add author (if no source, or source has no author)
- Optionally add tags
- Submit with keyboard shortcut (no mouse required)

### 3. Browse by Book
- Bookshelf view: all books with quote counts
- Tap a book → quotes sorted by page number

### 4. Keyword Search
- Single search bar, always accessible
- Searches across: quote text, source title, author, tags
- Results show: quote excerpt + source + author

### 5. Quote Feed
- A chronological list of all quotes (most recent first)
- Quick way to browse recent additions

### 5. Quote Feed
- A chronological list of all quotes (most recent first)
- Quick way to browse recent additions

---

## Out of Scope (for now)

- Open registration (Phase 1 = your account only)
- Payments / subscriptions
- Export (PDF, CSV, etc.)
- Mobile native app
- Ebook import or OCR
- Spaced repetition / flashcards
- Public profiles
- Social / sharing features

---

## UX Principles

1. **Speed of entry is the most important thing.** If adding a quote takes more than 5 seconds, the user won't do it mid-reading.
2. **Minimal required fields.** Only the quote text is required. Everything else is optional.
3. **Keyboard-first.** Tab between fields, Enter to submit.
4. **No clutter.** This is a reading companion, not a productivity app. Keep it calm and focused.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Next.js (React) | Web first, mobile later |
| **Backend** | FastAPI (Python) | REST API, business logic |
| **Database** | PostgreSQL via Neon | Serverless PostgreSQL, free tier never pauses |
| **Auth** | Clerk | Google OAuth, Python SDK, 50K users free |
| **Hosting** | Vercel (frontend) + Railway (backend) | Simple deploys, generous free tiers |

---

## Open Questions

- [ ] Should books have genres/categories?
- [ ] Should quotes support images (e.g., a photo of the page)?
- [ ] What happens when the same book has multiple editions with different page numbers?
- [ ] Should tags be free-form or from a fixed list?

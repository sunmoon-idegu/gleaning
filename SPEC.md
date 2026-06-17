# Gleaning — Spec

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

| Source Type | Fields                                          | Example                       |
|-------------|-------------------------------------------------|-------------------------------|
| `book`      | title, author (optional), page (optional)       | *Meditations*, Marcus Aurelius, p.42 |
| `video`     | title, author/speaker (optional), url (optional)| YouTube talk, interview       |
| `live`      | author/speaker (optional), context (optional)   | Heard at a talk, conversation |
| `unknown`   | —                                               | No idea where it came from    |

Books are the primary source type and get first-class treatment (dedicated shelf view).

### Book
A book has its own record separate from a source, enabling the shelf view and quote grouping.

| Field      | Type   | Required | Notes                          |
|------------|--------|----------|--------------------------------|
| title      | string | yes      |                                |
| author     | string | no       |                                |
| language   | enum   | no       | `en` or `zh`                   |
| cover_url  | string | no       | URL to a cover image           |

### Quote
A sentence or paragraph worth keeping.

| Field      | Type     | Required | Notes                                    |
|------------|----------|----------|------------------------------------------|
| text       | string   | yes      | The quote itself                         |
| source     | Source   | no       | Where it came from (any type above)      |
| author     | string   | no       | Who said/wrote it (if not via a source)  |
| page       | integer  | no       | Page number (books only)                 |
| tags       | string[] | no       | Optional labels, e.g. "grief", "time"    |
| created_at | date     | auto     | When it was entered                      |

---

## Features

### 1. Quote Entry (primary action — must be fast)
- **Text** is the only required field — everything else is optional
- Optionally attach a source:
  - **Book:** searchable dropdown of existing books + page number field; can create a new book inline (title, optional author, optional language)
  - **Video:** title + optional URL
  - **Live:** speaker + optional context note
  - **Unknown:** no fields
- Optionally add tags (comma or Enter to add, Backspace to remove)
- Submit with ⌘↵ (no mouse required)
- Global shortcut **⌘E** opens the add-quote modal from anywhere in the app

### 2. Quote Feed
- One quote at a time, centered on screen
- **Space** or the arrow button advances to the next quote
- Quotes cycle through in chronological order (most recent first)
- **Display mode** — hides the nav and add button for a distraction-free reading experience:
  - Desktop: press **F** to toggle, **Esc** to exit
- Newly added quotes appear instantly without a page reload
- Click a quote text → opens the Quote Detail page (`/quotes/[id]`)

### 2a. Quote Detail Page (`/quotes/[id]`)
- Dedicated URL for each quote — bookmarkable, shareable
- Shows: full quote text, source, tags, creation date
- Actions: Copy (browser clipboard), Edit (inline dialog), Delete

### 3. Shelf (Browse by Book)
- Grid of all books grouped by language, with quote counts
- "Add book" button opens a modal dialog (title, optional author, optional language)
- Each book card has an overflow menu (⋯) to edit or delete the book
- Tap a book → quotes sorted by page number
- Quotes added from within a book's page are pre-linked to that book

### 4. Keyword Search
- Single search bar, always accessible via **⌘K**
- Searches across: quote text, source title, author, tags
- Results show quote excerpt + source + author

### 5. Source & Tag Management
- Sources are created inline during quote entry
- Tags are free-form strings, created on the fly

---

## Keyboard Shortcuts

| Shortcut | Action                        |
|----------|-------------------------------|
| ⌘E       | Open add-quote modal          |
| ⌘K       | Open search                   |
| Space    | Next quote (feed)             |
| F        | Toggle display mode (feed)    |
| Esc      | Exit display mode / close modal |
| ⌘↵       | Submit form                   |

---

## Mobile App (iPhone)

Separate client, same backend API. Primary job: **capture** — the web app is for browsing and reading, the mobile app is for saving quotes on the go.

### Core mobile flow
1. Open app → camera button or photo library
2. Take photo of a page / screenshot anything
3. Draw a selection box over the text region (draggable, resizable via corner handles)
4. Claude extracts all readable sentences from the selection
5. User taps the sentence they want
6. Pre-fills quote text → user confirms source/tags → save

### Mobile screens
| Screen | Description |
|--------|-------------|
| Feed | Quote list with two display modes (see below) |
| Quote Detail | Full quote with Copy + Share actions; swipe left edge to go back |
| Shelf | Books grouped by language; tap book → quotes by page |
| Add | Manual entry + camera/library OCR capture |
| Search | Full-text search across quotes, sources, tags |
| Settings | Theme (Light / Dark / Colorful) + Feed display mode; both persisted locally |

### Feed display modes
- **List** — scrollable list of quote cards; tap any card → Quote Detail page
- **Card** — full-screen one-quote-at-a-time view; swipe left/right to browse; `x / N` counter; tap to open Quote Detail

### Mobile tech stack
| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Expo (React Native) | TypeScript, same patterns as web frontend |
| Auth | Clerk Expo SDK | Same Clerk instance as web |
| Camera | Expo Image Picker | Opens camera or photo library |
| OCR | Claude (via `/ocr` backend endpoint) | Handles messy angles, lighting, extracts clean sentences |
| Clipboard | expo-clipboard | Native copy-to-clipboard in Quote Detail |
| Storage | expo-secure-store | Persists theme + feed mode across sessions |

### New backend endpoint
`POST /ocr` — receives a base64 image + optional crop region (normalized x/y/w/h), calls Claude, returns list of extracted sentences.

---

## Out of Scope (for now)

- Open registration (Phase 1 = your account only)
- Payments / subscriptions
- Export (PDF, CSV, etc.)
- Ebook import
- Spaced repetition / flashcards
- Public profiles
- Social / sharing features
- Auto-detect book from photo (v2)

---

## UX Principles

1. **Speed of entry is the most important thing.** If adding a quote takes more than 5 seconds, the user won't do it mid-reading.
2. **Minimal required fields.** Only the quote text is required. Everything else is optional.
3. **Keyboard-first.** Tab between fields, ⌘↵ to submit, shortcuts for everything common.
4. **No clutter.** This is a reading companion, not a productivity app. Keep it calm and focused.

---

## Tech Stack

| Layer        | Choice                          | Notes                                          |
|--------------|---------------------------------|------------------------------------------------|
| **Frontend** | Next.js (React)                 | Web first, mobile later                        |
| **Backend**  | FastAPI (Python)                | REST API, business logic                       |
| **Database** | PostgreSQL                      | Hosted on Neon                                 |
| **Auth**     | Clerk                           | Google OAuth, JWT verification via JWKS        |
| **Hosting**  | Vercel (frontend) + Render (backend) | Free tier; keep-alive cron prevents spin-down |
| **Monitoring** | Sentry                        | Error tracking; `/health` endpoint probes DB   |

---

## Open Questions

- [ ] Should books have genres/categories?
- [ ] Should quotes support images (e.g., a photo of the page)?
- [ ] What happens when the same book has multiple editions with different page numbers?
- [ ] Should tags be free-form or from a fixed list?

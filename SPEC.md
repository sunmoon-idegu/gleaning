# Gleaning — Spec

## Purpose

A tool for anyone who encounters a sentence worth keeping. The core loop: encounter a passage → save it in seconds → let it surface again when you least expect it.

Phase 1 focus is physical books. Video, talk, and ebook sources are planned but not yet built.

---

## Target User

Reads in one or more languages. Books are physical more often than not, especially titles in Chinese or Japanese which rarely have Kindle editions.

This person underlines. They dog-ear pages. They have marked-up books on their shelf. They just want to keep the sentences that hit them — and have them come back.

They are not building a second brain. They are not running a reading challenge.

---

## The Reading Situation

They are reading in the evening, or on a weekend morning with coffee, or on a commute. They hit a sentence. It crystallises something they had felt vaguely for a long time. The reaction is physical — they slow down, re-read it, feel the satisfaction of a thought finally articulated.

They want to keep it.

What happens next, in practice:

1. They underline it or fold the page corner. Takes two seconds. They keep reading.
2. Later — days, weeks, months — the passage is marooned in that book. To find it they must remember which book, locate the book, and flip through it. Usually they do not bother.
3. Occasionally they take a photo of the page. It goes into the camera roll with 4,000 other photos and is never looked at again.
4. Occasionally they open Notes or Notion and type it out. Typing a two-sentence passage from a physical book takes 90 seconds minimum. They do this once out of every ten times they mean to, because stopping to type breaks the reading flow entirely.

The result after five years of serious reading: dozens of marked-up books, hundreds of page photos, a handful of notes, and almost none of it accessible.

---

## The Real Bottleneck

The bottleneck is not the absence of a tool. Notes exists. Notion exists. The bottleneck is **the cost of saving at the moment of encounter**.

They are reading. They find a passage. The cost of saving it properly — stop reading, pick up phone, open app, type the text, add metadata, go back — is high enough that they routinely defer it. Deferral means loss. By the time they come back to it, the emotional charge of the moment is gone and they can't remember which passage they meant to save.

The threshold for saving is lower than the cost. So most passages are lost.

OCR changes the math specifically for physical books: open the app, point the camera at the page, select the sentence, done. The cost drops from 90 seconds of typing to 20 seconds of pointing. That is the difference between doing it and not doing it.

For ebooks (Kindle, Apple Books) the bottleneck is different — copy-paste is already fast, but highlights are trapped inside Amazon or Apple's ecosystem with no good way to search or revisit them. Gleaning becomes the single place regardless of where they read.

**Ebook note:** A "book" in Gleaning refers to the work — title, author, content — not the format. Physical and digital editions of the same book are the same book. The format only affects how you capture (OCR vs. paste).

---

## Pain Points

**1. Passages are lost at the moment of encounter.**
The single biggest loss happens right there in the reading session. Not later — right then. The friction is high enough that most saves never start.

**2. The collection is unsearchable.**
Underlines in physical books cannot be queried. "What did I save about attention?" requires remembering the book, finding the book, and flipping through it. For people with large libraries across two languages, this is effectively impossible.

**3. Everything is fragmented.**
Kindle highlights here. Apple Books annotations there. Photos of pages in the camera roll. A few things typed into Notes. Nothing is in one place. When they want to find something, they do not know where to look.

**4. The saved collection goes dead.**
Even when people do maintain a notes system, they rarely return to it. The quotes accumulate but never re-enter their thinking. The effort of saving produced an archive, not a resource.

**5. Memory degrades the exact wording.**
They remember the idea but not the sentence. The specific words matter. "The mass of men lead lives of quiet desperation" is not the same as "most people are unhappy." Once the words are gone, they are gone.

---

## Coming Back to the App

These are the real scenarios where someone opens Gleaning after the initial save:

**Searching for a specific passage.**
A topic comes up — in a conversation, while writing, while thinking through a problem. They remember reading something relevant. They open Gleaning and search. This is the most functional use and the most important reason the collection needs to be complete and searchable.

**Sharing with someone.**
Someone else says something, and they want to respond with the exact passage. "There's this line from Pessoa —" They open Gleaning, find it, copy it. Without the app, they would paraphrase badly or say "I read something like this once."

**Serendipitous rediscovery.**
Idle moment — on the subway, before sleep. They open the Feed and scroll. A quote from eight months ago appears. They remember the moment they saved it. This is the most valuable use — not retrieval, not search, just a quiet encounter with something they once found worth keeping. It requires the collection to be large enough and the presentation calm enough to reward browsing.

**Before or after a reading session.**
They finish a chapter with three things underlined. They save them while it is fresh, not during reading. Or they open Gleaning before reading to re-read something from the same author.

**Looking for everything from one book.**
They are recommending a book, writing something, or returning to a thinker they respect. They go to the Shelf, find the book, see all the passages they saved from it in order.

---

## What This Means for the Product

- **Capture speed is the product.** If saving takes more than 30 seconds on mobile, most passages will not be saved. Every second of friction is quotes lost.
- **OCR is core, not a feature.** For physical books — especially Chinese books without Kindle editions — it is the only fast capture path.
- **Search must work.** The collection is only as useful as its searchability. A quote saved but not findable is the same as a quote not saved.
- **The Feed is for serendipity, not retrieval.** It should surface quotes from the full history of the collection without expectation. The user is not looking for anything — the quote finds them.
- **The Shelf is the library.** The book-centric view matters to this user. Their identity is partly organised around books they have read.
- **Calm over clever.** This user is not looking for gamification, streaks, or social features. The aesthetic should feel like the inside of a bookshop, not a productivity dashboard.

---

## Users

**Phase 1 (now):** Single user (yourself). Private, invite-only.
**Phase 2 (later):** Open to others to the same target profile. All data is user-scoped from day one so no schema changes are needed.

---

## Core Concepts

### Quote
A sentence or paragraph worth keeping.

| Field        | Type    | Required | Notes                                   |
|--------------|---------|----------|-----------------------------------------|
| text         | string  | yes      | The quote itself                        |
| source_type  | string  | no       | Discriminator: `'book'` or null (extensible) |
| book_id      | UUID    | no       | Set when source_type is `'book'`        |
| page         | integer | no       | Page number within the book             |
| created_at   | date    | auto     | When it was entered                     |

### Book
A first-class entity. Multiple quotes can reference the same book.

| Field     | Type   | Required | Notes                       |
|-----------|--------|----------|-----------------------------|
| title     | string | yes      |                             |
| author    | string | no       |                             |
| language  | enum   | no       | `en`, `zh`, or `ja`         |
| cover_url | string | no       | Reserved for future use     |

### Reflection
A personal note attached to a quote or a book. Not part of the quote itself — a separate thought the reader had about it, written later.

| Field       | Type   | Required | Notes                          |
|-------------|--------|----------|--------------------------------|
| target_type | string | yes      | `'quote'` or `'book'`          |
| target_id   | UUID   | yes      | ID of the quote or book        |
| content     | text   | yes      |                                |
| created_at  | date   | auto     |                                |

Multiple reflections per quote or book are allowed. Stored in the `reflections` table with a composite index on `(user_id, target_type, target_id)`.

### Source (Phase 1)
Phase 1 supports **book** as the only source type. The schema uses a `source_type` discriminator on quotes directly — no separate sources table — keeping the data model flat and the join count low.

### Source + Person (under discussion)

**The problem with the current schema:**
A quote like *"I believe in pink"* is attributed to Audrey Hepburn, but it is not known which book, interview, or talk she said it in. The current schema has no way to record the person without also knowing the source. `author` lives on the `Book` table, not on the quote itself, so a quote without a book cannot have an author.

**Proposed schema:**

```
Person
├── id
├── name        e.g. "Audrey Hepburn", "Richard Feynman"
└── photo_url   (optional)

Source
├── id
├── person_id   → Person  (nullable)
├── type        'book' | 'video' | 'talk' | 'article'
├── title       e.g. "Surely You're Joking", "TED 2006"
└── url         (nullable — for video and talk)

Quote
├── text
├── person_id   → Person  (nullable — who said it)
├── source_id   → Source  (nullable — where it was said)
├── page        (for books)
└── timestamp   e.g. "14:32"  (for video/talks)
```

**Why Person is separate from Source:**
The same person appears across multiple sources (books, interviews, talks). Linking person directly to the quote — independently of the source — means you can record attribution even when the source is unknown, and later browse all quotes by a person across all their works.

**The four real cases:**

| Quote | Person | Source |
|-------|--------|--------|
| "I believe in pink" | Audrey Hepburn | unknown (null) |
| Quote from Feynman's book | Feynman | *Surely You're Joking*, p.42 |
| Quote from a TED talk | Speaker | TED talk URL |
| Ancient proverb | unknown (null) | unknown (null) |

**Capture flow (planned):**
```
Type quote → optionally add attribution → save
```
Attribution expands inline with three paths:
- **Fast**: skip everything, just save the text
- **Medium**: type a person name (autocompletes from past people), skip source
- **Full**: person + source type (Book / Video / Talk) + source details

The person field autocompletes from previously entered people so repeat attribution is fast.

**Migration path:**
1. Create `persons` table
2. Create `sources` table (absorbs `books`, adds video/talk)
3. Migrate existing books → sources with `type='book'`, author text → person record
4. Add `person_id` and `source_id` to quotes, drop `book_id` and `source_type`

The `Book` entity on the Shelf becomes a view of sources where `type='book'`, so the Shelf UI is largely unchanged.

---

## Features

### 1. Quote Entry (primary action — must be fast)
- **Text** is the only required field — Save is always available once text is entered
- Source is optional enrichment:
  - **Book:** searchable dropdown of existing books + optional page number; create a new book inline (title required, author and language optional)
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
- Shows: full quote text, source, creation date
- Actions: Copy (browser clipboard), Edit (inline dialog), Delete

### 3. Shelf (Browse by Book)
- Grid of all books grouped by language
- "Add book" button opens a modal dialog (title, optional author, optional language)
- Each book card has an overflow menu (⋯) to edit or delete the book
- Tap a book → quotes sorted by page number
- Quotes added from within a book's page are pre-linked to that book

### 4. Keyword Search
- Single search bar, always accessible via **⌘K**
- Searches across: quote text, book title, book author
- Results show quote excerpt + book

### 5. Reflections
- Each quote and each book has a Reflections section at the bottom of its detail view
- A reflection is a personal note written after the fact — a thought, reaction, or connection the reader had
- Multiple reflections per quote/book are allowed, shown in reverse-chronological order
- Add: tap `+` → bottom sheet with text input → save
- Edit/Delete: long-press a reflection row → action sheet
- Optimistic UI: new reflection appears immediately with a spinner while the API call is in flight; removed on failure
- Appears on both mobile (Quote Detail, Book Detail) and web (quote detail page, book detail page)

### 6. Source Management
- Sources are set inline during quote entry (book selection + page)

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
6. Pre-fills quote text → user confirms source → save

### Mobile screens
| Screen | Description |
|--------|-------------|
| Quotes | Quote list with two display modes (see below) |
| Quote Detail | Full quote + Reflections section; header has Copy and ⋯ (edit/delete popup); swipe left edge to go back |
| Book Detail | Book title, author, all quotes from the book, Reflections section; header has ⋯ (edit/delete popup) |
| Shelf | Books grouped by language; tap book → Book Detail |
| Add | Manual entry + camera/library OCR capture |
| Search | Full-text search across quotes and book titles |
| Settings | Theme, feed display mode, sort order, font size — all synced to account via API |
| Feedback | Category chips + freeform text; submits to `feedback` table in DB |

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
| Clipboard | expo-clipboard | Native copy-to-clipboard in Quote Detail (requires native build) |
| Storage | expo-secure-store | Local cache; authoritative preferences stored in DB via API |

### Backend endpoints (mobile-specific additions)
| Endpoint | Description |
|----------|-------------|
| `POST /ocr` | Receives base64 image + optional crop region, calls Claude, returns extracted sentences |
| `GET /users/me/preferences` | Returns stored display preferences for the signed-in user |
| `PATCH /users/me/preferences` | Updates preferences (theme, feed_mode, sort_order, font_size) |
| `DELETE /users/me` | Soft-deletes account: sets `deleted_at`; data purged after 30 days |
| `POST /users/me/recover` | Cancels a pending deletion within the 30-day grace period |
| `POST /users/purge-deleted` | Hard-deletes expired accounts (called by daily cron with secret header) |
| `POST /feedback` | Saves a feedback entry (category + message) to the `feedback` table |
| `GET /reflections?target_type=&target_id=` | Returns all reflections for a quote or book |
| `POST /reflections` | Creates a reflection |
| `PATCH /reflections/{id}` | Updates a reflection's content |
| `DELETE /reflections/{id}` | Deletes a reflection |

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
- Person + Source redesign (under discussion; see Core Concepts above)

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

## Decisions

- [x] Books do not have genres or categories.
- [x] Quotes do not support images.
- [x] Multiple editions with different page numbers are out of scope — page numbers are best-effort metadata only.
- [x] Tags are out of scope for now. May be added in a future version.
- [x] Source types beyond `book` (video, social media posts) are out of scope for Phase 1. The discriminator pattern on quotes makes them addable without schema changes to existing tables.

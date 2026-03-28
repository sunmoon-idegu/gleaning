const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("NEXT_PUBLIC_API_URL is required in production") })()
    : "http://localhost:8000"
);

/** Retries getToken up to 5 times with 200ms gaps — Clerk may return null on first render */
export async function waitForToken(getToken: () => Promise<string | null>): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const token = await getToken();
    if (token) return token;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Could not get auth token");
}

export async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string | null;
  cover_url: string | null;
  created_at: string;
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
] as const;

export interface Source {
  id: string;
  type: "book" | "video" | "spoken" | "unknown";
  title: string | null;
  author: string | null;
  url: string | null;
  context: string | null;
  book_id: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string | null;
  page: number | null;
  source_id: string | null;
  source: Source | null;
  tags: Tag[];
  created_at: string;
}

export interface BookWithQuotes extends Book {
  quotes: Quote[];
}

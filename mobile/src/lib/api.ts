const API_URL = process.env.EXPO_PUBLIC_API_URL!;

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

export interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface Source {
  id: string;
  type: "book" | "video" | "live" | "unknown";
  title: string | null;
  author: string | null;
  url: string | null;
  context: string | null;
  book_id: string | null;
  book: Book | null;
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

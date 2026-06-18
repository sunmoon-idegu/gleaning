const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type DeletedHandler = (deletedAt: string) => void;
let _deletedHandler: DeletedHandler | null = null;

export function registerDeletedHandler(handler: DeletedHandler | null) {
  _deletedHandler = handler;
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
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text().catch(() => ""); }
    const error = new ApiError(res.status, body, `API error ${res.status}`);

    if (res.status === 403 && _deletedHandler) {
      const detail = (body as any)?.detail;
      const isDeleted =
        detail?.code === "account_deleted" ||
        (typeof detail === "string" && detail.toLowerCase().includes("deleted"));
      if (isDeleted) _deletedHandler(detail?.deleted_at ?? "");
    }

    throw error;
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

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Defaults to the same-origin API for Render's combined deployment. Set
// VITE_API_URL to the full API base (for example, https://api.example.com/api)
// when the React site is hosted separately, such as on Hostinger.
const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

export const apiUrl = (path: string) => `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("The API is unavailable. Check the local server and Neon database connection.", 0);
  }
  if (!response.ok) {
    const fallback = response.status >= 500
      ? "The API is unavailable. Check the local server and Neon database connection."
      : "Request failed.";
    const result = await response.json().catch(() => ({ error: fallback }));
    throw new ApiError(result.error || "Request failed.", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

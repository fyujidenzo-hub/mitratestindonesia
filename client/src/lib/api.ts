export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("The local API is unavailable. Make sure XAMPP MySQL and the combined development server are running.", 0);
  }
  if (!response.ok) {
    const fallback = response.status >= 500
      ? "The local API is unavailable. Make sure XAMPP MySQL and the combined development server are running."
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

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error: ApiErrorResponse = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request gagal: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export default apiFetch;
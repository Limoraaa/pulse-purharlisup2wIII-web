interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error: ApiErrorResponse = await res.json().catch(() => ({}));

    // kalau ada detail error validasi per-field, ambil pesan yang paling spesifik
    if (error.errors) {
      const firstField = Object.values(error.errors)[0];
      if (firstField && firstField.length > 0) {
        throw new Error(firstField[0]);
      }
    }

    throw new Error(error.message || `Request gagal: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export default apiFetch;
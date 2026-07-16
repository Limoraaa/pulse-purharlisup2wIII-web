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
    // Jika Unauthorized (Token expired/tidak valid)
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token"); // Bersihkan token yang sudah tidak valid
        localStorage.removeItem("userId"); // Bersihkan data user lainnya jika ada
        window.location.href = "/signin"; // Arahkan kembali ke halaman login
      }
    }

    const error: ApiErrorResponse = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request gagal: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export default apiFetch;
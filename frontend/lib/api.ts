interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (networkError) {
    throw new Error("Gagal terhubung ke server. Periksa koneksi internet Anda.");
  }

  if (!res.ok) {
    // Tangani token invalid / kedaluwarsa (kecuali pada endpoint /login)
    if (res.status === 401 && endpoint !== "/login" && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");

      if (window.location.pathname !== "/signin") {
        window.location.href = "/signin";
      }
      return new Promise<T>(() => {});
    }

    // Ambil error body dengan aman (bisa jadi teks biasa atau JSON kosong)
    const contentType = res.headers.get("content-type");
    let errorData: ApiErrorResponse = {};

    if (contentType && contentType.includes("application/json")) {
      errorData = await res.json().catch(() => ({}));
    } else {
      const textError = await res.text().catch(() => "");
      errorData = { message: textError || `Request gagal: ${res.status}` };
    }

    // Jika ada error validasi per field (Laravel style validation errors)
    if (errorData.errors) {
      const firstField = Object.values(errorData.errors)[0];
      if (firstField && firstField.length > 0) {
        throw new Error(firstField[0]);
      }
    }

    throw new Error(errorData.message || `Request gagal: ${res.status}`);
  }

  // Tangani response sukses yang tidak memiliki body (misal: 204 No Content)
  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}

export default apiFetch;
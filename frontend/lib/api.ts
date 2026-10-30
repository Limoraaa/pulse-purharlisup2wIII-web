import { simpanTujuanLogin } from "./redirectLogin";

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  
  // Membersihkan trailing slash dari URL environment agar tidak pernah terjadi double slash
  const baseUrl = rawApiUrl.replace(/\/+$/, "");
  
  // Memastikan endpoint selalu diawali dengan tepat satu garis miring
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res: Response;
  try {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (networkError) {
    // Tambahkan baris ini agar penyebab asli (CORS, Typo URL, dll) terlihat di Console Browser
    console.error("API Fetch Error Detail:", networkError, "URL yang dituju:", fullUrl);
    
    throw new Error("Gagal terhubung ke server. Periksa koneksi internet Anda.");
  }

  if (!res.ok) {
    if (res.status === 401 && endpoint !== "/login" && typeof window !== "undefined") {
      // Sama dengan KUNCI_SESI di lib/logout.ts (tidak diimpor agar tidak saling impor)
      ["token", "userId", "userName", "userRole", "userAvatarUrl", "global_shared_tools_cart", "global_shared_consumable_cart"]
        .forEach((k) => localStorage.removeItem(k));

      // Ikut basePath bila aplikasi dipasang di subfolder (NEXT_PUBLIC_BASE_PATH)
      const halamanLogin = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/signin`;
      if (window.location.pathname !== halamanLogin) {
        simpanTujuanLogin();
        window.location.href = halamanLogin;
      }
      return new Promise<T>(() => {});
    }

    const contentType = res.headers.get("content-type");
    let errorData: ApiErrorResponse = {};

    if (contentType && contentType.includes("application/json")) {
      errorData = await res.json().catch(() => ({}));
    } else {
      const textError = await res.text().catch(() => "");
      errorData = { message: textError || `Request gagal: ${res.status}` };
    }

    if (errorData.errors) {
      const firstField = Object.values(errorData.errors)[0];
      if (firstField && firstField.length > 0) {
        throw new Error(firstField[0]);
      }
    }

    throw new Error(errorData.message || `Request gagal: ${res.status}`);
  }

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
/**
 * Mengambil file biner (misalnya PDF) dari API dengan token login.
 * Dipakai untuk dokumen rahasia yang tidak boleh punya URL publik.
 */
export async function apiFetchBinary(endpoint: string): Promise<ArrayBuffer> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as ApiErrorResponse));
    throw new Error(data.message || `Request gagal: ${res.status}`);
  }

  return res.arrayBuffer();
}

import apiFetch from "lib/api";

// Bentuk data mentah dari Laravel (snake_case)
interface UserApiResponse {
  id: string;
  full_name: string;
  email: string;
  role: string;
  divisi: string | null;
  no_hp: string | null;
  avatar_path: string | null;
}

// Bentuk yang dipakai komponen (camelCase, cocok dengan ProfileData di ProfileManager.tsx)
export interface ProfileApiData {
  id: string;
  namaLengkap: string;
  email: string;
  role: string;
  divisi: string;
  noHp: string;
  avatarPath: string | null;
}

export interface UpdateProfilePayload {
  namaLengkap: string;
  email: string;
  divisi: string;
  noHp: string;
}

export interface ChangePasswordPayload {
  passwordLama: string;
  passwordBaru: string;
  konfirmasiPasswordBaru: string;
}

function mapProfileFromApi(item: UserApiResponse): ProfileApiData {
  return {
    id: item.id,
    namaLengkap: item.full_name,
    email: item.email,
    role: item.role,
    divisi: item.divisi ?? "-",
    noHp: item.no_hp ?? "",
    avatarPath: item.avatar_path,
  };
}

export async function getProfile(): Promise<ProfileApiData> {
  const data: UserApiResponse = await apiFetch("/profile");
  return mapProfileFromApi(data);
}

export async function updateProfile(values: UpdateProfilePayload): Promise<ProfileApiData> {
  const data: UserApiResponse = await apiFetch("/profile", {
    method: "PUT",
    body: JSON.stringify({
      full_name: values.namaLengkap,
      email: values.email,
      divisi: values.divisi,
      no_hp: values.noHp,
    }),
  });
  return mapProfileFromApi(data);
}

export async function changePassword(values: ChangePasswordPayload): Promise<void> {
  await apiFetch("/profile/password", {
    method: "PATCH",
    body: JSON.stringify({
      password_lama: values.passwordLama,
      password_baru: values.passwordBaru,
      password_baru_confirmation: values.konfirmasiPasswordBaru,
    }),
  });
}

export async function uploadAvatar(file: File): Promise<{ avatar_path: string; avatar_url: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/profile/photo`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Jangan set Content-Type manual — biar browser yang atur boundary multipart otomatis
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Gagal mengunggah foto profil");
  }

  return res.json();
}
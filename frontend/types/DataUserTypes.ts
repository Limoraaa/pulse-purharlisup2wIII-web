export type UserRole = "staff" | "super_admin";

export interface UserItemType {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  divisi: string | null;
  avatar_path: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

// Payload form Tambah/Edit
export interface UserFormValues {
  full_name: string;
  username: string;
  password: string; // wajib diisi saat Tambah, kosong berarti tidak diganti saat Edit
  role: UserRole;
  divisi: string;
}

export interface ResetPasswordValues {
  password_baru: string;
  password_baru_confirmation: string;
}
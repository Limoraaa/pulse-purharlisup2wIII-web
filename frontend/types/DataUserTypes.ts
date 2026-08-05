export type UserRole = "staff" | "super_admin";

export interface UserItemType {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  divisi: string | null;
  no_hp: string | null;
  avatar_path: string | null;
  is_active: boolean;
  created_at: string;
}

// Payload form Tambah/Edit
export interface UserFormValues {
  full_name: string;
  email: string;
  role: UserRole;
  divisi: string;
  no_hp: string;
}

export interface ResetPasswordValues {
  password_baru: string;
  password_baru_confirmation: string;
}
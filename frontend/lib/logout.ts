import api from "lib/api";
import { clearPermissions } from "hooks/usePermissions";

// Data per-akun yang disimpan di browser; dihapus saat logout agar tidak terbawa ke akun berikutnya
export const KUNCI_SESI = [
  "token",
  "userId",
  "userName",
  "userRole",
  "userAvatarUrl",
  "global_shared_tools_cart",
  "global_shared_consumable_cart",
];

/** Logout: cabut token di server, lalu bersihkan data sesi di browser */
export async function logout(): Promise<void> {
  try {
    await api("/logout", { method: "POST" });
  } catch {
    // Server tidak terjangkau / token sudah tidak berlaku: tetap lanjut logout di browser
  }
  KUNCI_SESI.forEach((k) => localStorage.removeItem(k));
  clearPermissions();
}

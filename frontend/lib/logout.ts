import api from "lib/api";
import { clearPermissions } from "hooks/usePermissions";

// Data per-akun yang disimpan di browser; dihapus saat logout agar tidak terbawa ke akun berikutnya
const KUNCI_SESI = ["token", "userId", "userName", "userRole", "userAvatarUrl"];

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

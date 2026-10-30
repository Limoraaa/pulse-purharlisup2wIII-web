// Halaman yang dibuka sebelum diminta login (mis. hasil scan QR mesin), agar setelah login kembali ke sana.
const KUNCI = "redirectSetelahLogin";

const basePath = () => process.env.NEXT_PUBLIC_BASE_PATH || "";

export function simpanTujuanLogin(): void {
  let path = window.location.pathname;
  if (basePath() && path.startsWith(basePath())) path = path.slice(basePath().length) || "/";
  if (path === "/" || path.startsWith("/signin")) return;
  localStorage.setItem(KUNCI, path + window.location.search);
}

// Ambil sekali lalu hapus; hanya path internal yang diterima
export function ambilTujuanLogin(): string {
  const tujuan = localStorage.getItem(KUNCI);
  localStorage.removeItem(KUNCI);
  if (!tujuan || !tujuan.startsWith("/") || tujuan.startsWith("//") || tujuan.startsWith("/signin")) return "/";
  return tujuan;
}

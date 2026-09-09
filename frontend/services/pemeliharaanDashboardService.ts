import api from "/lib/api";

export interface MaintenanceSummary {
  total_mesin: number;
  mesin_perbaikan: number;
  pemeliharaan_rutin: number;
}

export interface AktivitasPemeliharaanItem {
  id: number | string;
  nama_mesin: string;
  deskripsi: string;
  waktu: string;
  status: string;
}

export async function getMaintenanceSummary(): Promise<MaintenanceSummary> {
  const res = await api<{ success: boolean; data: MaintenanceSummary }>("pemeliharaan/dashboard-stats");
  return res.data;
}

export async function getAktivitasPemeliharaanTerbaru(): Promise<AktivitasPemeliharaanItem[]> {
  const res = await api<{ success: boolean; data: AktivitasPemeliharaanItem[] }>("pemeliharaan/aktivitas-terbaru");
  return res.data;
}
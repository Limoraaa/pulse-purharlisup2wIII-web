import api from "lib/api";

export interface MaintenanceMotorSummary {
  total_motor: number;
  motor_perbaikan: number;
  pemeliharaan_rutin: number;
}

export interface AktivitasPemeliharaanMotorItem {
  id: number | string;
  nama_motor: string;
  deskripsi: string;
  waktu: string;
  status: string;
}

export async function getMaintenanceMotorSummary(): Promise<MaintenanceMotorSummary> {
  const res = await api<{ success: boolean; data: MaintenanceMotorSummary }>("pemeliharaan/dashboard-stats");
  return res.data;
}

export async function getAktivitasPemeliharaanMotorTerbaru(): Promise<AktivitasPemeliharaanMotorItem[]> {
  const res = await api<{ success: boolean; data: AktivitasPemeliharaanMotorItem[] }>("pemeliharaan/aktivitas-terbaru");
  return res.data;
}
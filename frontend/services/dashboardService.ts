import apiFetch from "lib/api";
import {
  DashboardSummary,
  StokMenipisItem,
  TelatKembaliItem,
  AlatTerpopulerItem,
  ConsumableTerpopulerItem,
  KerusakanSummary,
  AktivitasItem,
  TrenPeminjamanItem,
} from "types/DashboardTypes";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export async function getStokMenipis(): Promise<StokMenipisItem[]> {
  return apiFetch<StokMenipisItem[]>("/dashboard/stok-menipis");
}

export async function getTelatKembali(): Promise<TelatKembaliItem[]> {
  return apiFetch<TelatKembaliItem[]>("/dashboard/telat-kembali");
}

export async function getAlatTerpopuler(): Promise<AlatTerpopulerItem[]> {
  return apiFetch<AlatTerpopulerItem[]>("/dashboard/alat-terpopuler");
}

export async function getConsumableTerpopuler(): Promise<ConsumableTerpopulerItem[]> {
  return apiFetch<ConsumableTerpopulerItem[]>("/dashboard/consumable-terpopuler");
}

export async function getKerusakanSummary(): Promise<KerusakanSummary> {
  return apiFetch<KerusakanSummary>("/dashboard/kerusakan-summary");
}

export async function getAktivitasTerbaru(): Promise<AktivitasItem[]> {
  return apiFetch<AktivitasItem[]>("/dashboard/aktivitas-terbaru");
}

export async function getTrenPeminjaman(): Promise<TrenPeminjamanItem[]> {
  return apiFetch<TrenPeminjamanItem[]>("/dashboard/tren-peminjaman");
}
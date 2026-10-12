// components/pemeliharaan/rencana/rencanaHelpers.ts
import {
  AksiRencana,
  RencanaItem,
  StatusTampil,
} from "types/RencanaPemeliharaanTypes";

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const ACTION_META: Record<
  AksiRencana,
  { label: string; color: string; textColor: string }
> = {
  C: { label: "Cleaning / Check", color: "var(--bs-primary)", textColor: "#fff" },
  L: { label: "Lubrication", color: "var(--bs-success)", textColor: "#fff" },
  M: { label: "Maintenance", color: "var(--bs-danger)", textColor: "#fff" },
  P: { label: "Part Replacement", color: "var(--bs-warning)", textColor: "#212529" },
  K: { label: "Kalibrasi", color: "#6f42c1", textColor: "#fff" },
};

export const ACTION_KEYS = Object.keys(ACTION_META) as AksiRencana[];

export const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

export const formatJadwal = (item: Pick<RencanaItem, "minggu" | "bulan" | "tahun">) =>
  `Minggu ${item.minggu}, ${MONTHS_SHORT[item.bulan - 1]} ${item.tahun}`;

// Minggu 1-3 berakhir di hari ke-7/14/21; minggu 4 berakhir di akhir bulan.
const getWeekEnd = (item: Pick<RencanaItem, "minggu" | "bulan" | "tahun">) => {
  const endDay =
    item.minggu >= 4
      ? new Date(item.tahun, item.bulan, 0).getDate()
      : item.minggu * 7;
  return new Date(item.tahun, item.bulan - 1, endDay, 23, 59, 59);
};

// "Terlewat" = masih berstatus Rencana padahal minggunya sudah lewat.
export const getStatusTampil = (item: RencanaItem, today: Date): StatusTampil => {
  if (item.status === "Selesai") return "Selesai";
  return getWeekEnd(item) < today ? "Terlewat" : "Rencana";
};

export const STATUS_VARIANT: Record<StatusTampil, string> = {
  Rencana: "primary",
  Selesai: "success",
  Terlewat: "danger",
};

// Route halaman yang memuat DataPemeliharaanManager (daftar mesin + Checklist Visual).
// Diambil dari link yang sudah dipakai dashboard pemeliharaan; SESUAIKAN jika berbeda.
export const PEMELIHARAAN_MESIN_PATH = "/pemeliharaan/data-mesin";

// Route halaman Rencana Pemeliharaan (RencanaPemeliharaanManager). SESUAIKAN.
export const RENCANA_PATH = "/pemeliharaan/rencana";
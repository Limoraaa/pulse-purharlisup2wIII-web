// types/RencanaPemeliharaanTypes.ts

export type AksiRencana = "C" | "L" | "P" | "M";

// Status yang disimpan di database.
export type StatusRencana = "Rencana" | "Selesai";

// Status yang ditampilkan di UI ("Terlewat" dihitung di frontend
// dari jadwal yang sudah lewat tetapi belum ditandai selesai).
export type StatusTampil = StatusRencana | "Terlewat";

export interface RencanaItem {
  id: string;
  mesinId: string;
  kodeMesin: string;
  namaMesin: string;
  tahun: number;
  bulan: number; // 1-12
  minggu: number; // 1-4
  aksi: AksiRencana;
  status: StatusRencana;
  rab: number;
  keterangan: string;
  // Terisi otomatis saat operator menyimpan log pemeliharaan yang cocok dengan rencana ini.
  logId: string | null;
  tanggalSelesai: string | null;
  // Posisi realisasi (dihitung backend dari tanggal log). Kosong bila belum selesai.
  tahunRealisasi?: number | null;
  bulanRealisasi?: number | null;
  mingguRealisasi?: number | null;
}

// Log pemeliharaan yang tidak terhubung ke plotting mana pun (rencana_id kosong).
// Ditampilkan di baris Realisasi sebagai pekerjaan "di luar rencana".
export interface LogDiLuarRencana {
  id: string;
  mesinId: string;
  aksi: AksiRencana | null; // null untuk log lama / log tanpa Tindakan
  uraian: string;
  tanggal: string;
  tahun: number;
  bulan: number; // 1-12
  minggu: number; // 1-4
}

export interface RencanaFormValues {
  mesinId: string;
  tahun: number;
  bulan: number;
  minggu: number;
  aksi: AksiRencana;
  rab: number;
  keterangan: string;
}

export interface MesinOption {
  id: string;
  kodeMesin: string;
  namaMesin: string;
}
// types/RencanaPemeliharaanTypes.ts

export type AksiRencana = "C" | "L" | "P" | "M" | "K";

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
}

export interface RencanaFormValues {
  mesinId: string;
  tahun: number;
  bulan: number;
  minggu: number;
  aksi: AksiRencana;
  status: StatusRencana;
  rab: number;
  keterangan: string;
}

export interface MesinOption {
  id: string;
  kodeMesin: string;
  namaMesin: string;
}
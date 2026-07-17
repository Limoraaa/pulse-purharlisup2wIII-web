// ------------------------------------------------------------------
// Riwayat Peminjaman Tools
// ------------------------------------------------------------------
export interface RiwayatPeminjamanType {
  id: string;
  nomor_transaksi: string; // derived: gabungan tanggal + peminta, dipakai buat grouping detail
  tanggal_pinjam: string; // format "10 Jul 2026, 09:15"
  tanggal_kembali: string; // format "12 Jul 2026, 11:00"
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah: number;
  nama_peminjam: string;
  divisi: string;
  area_kerja: string;
  keterangan: string;

  [key: string]: unknown;
}


export type RiwayatPeminjamanFormValues = Omit<
  RiwayatPeminjamanType,
  "id" | "nomor_transaksi"
>;

// ------------------------------------------------------------------
// Riwayat Consumable Keluar
// ------------------------------------------------------------------
export interface RiwayatConsumableKeluarType {
  id: string;
  nomor_transaksi: string;
  tanggal_pengambilan: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  jumlah: number;
  nama_peminta: string;
  divisi: string;
  area_kerja: string;
  keterangan: string;

  // Tambahan Index Signature untuk mengatasi error TS2345 pada exportToPDF / exportToExcel
  [key: string]: unknown;
}

export type RiwayatConsumableKeluarFormValues = Pick<
  RiwayatConsumableKeluarType,
  "jumlah" | "area_kerja" | "keterangan"
>;

// ------------------------------------------------------------------
// Filter bersama (dipakai kedua halaman riwayat)
// ------------------------------------------------------------------
export interface PeriodeFilterValue {
  dari: string; // yyyy-mm-dd, kosong = tidak dibatasi
  sampai: string;
}
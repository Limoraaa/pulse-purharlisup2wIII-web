// ------------------------------------------------------------------
// Riwayat Peminjaman Tools
// ------------------------------------------------------------------
export interface RiwayatPeminjamanType {
  id: string;
  nomor_transaksi: string; // beberapa baris bisa berbagi nomor yang sama (1 transaksi, banyak alat)
  tanggal_pinjam: string; // termasuk waktu, contoh: "10 Jul 2026, 09:15"
  tanggal_kembali: string;
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
  keterangan: string; // catatan kondisi saat pengembalian (kalau ada)

  // Tambahan Index Signature agar bisa dibaca secara dinamis oleh exportUtils
  [key: string]: any;
}

export type RiwayatPeminjamanFormValues = Pick<
  RiwayatPeminjamanType,
  "jumlah" | "area_kerja" | "keterangan"
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
  [key: string]: any;
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
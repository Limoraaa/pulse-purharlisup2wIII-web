// ------------------------------------------------------------------
// Riwayat Peminjaman Tools
// ------------------------------------------------------------------
export interface RiwayatPeminjamanType {
  id: string;
  nomor_transaksi: string;
  tanggal_pinjam: string;
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
  keterangan: string;

  // dipakai export PDF / Excel
  [key: string]: unknown;
}

// Form edit hanya mengubah 3 field
export interface RiwayatPeminjamanFormValues {
  jumlah: number;
  area_kerja: string;
  keterangan: string;
}

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

  [key: string]: unknown;
}

export interface RiwayatConsumableKeluarFormValues {
  jumlah: number;
  area_kerja: string;
  keterangan: string;
}

// ------------------------------------------------------------------
// Filter bersama
// ------------------------------------------------------------------
export interface PeriodeFilterValue {
  dari: string;
  sampai: string;
}
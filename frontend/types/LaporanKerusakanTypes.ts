export interface LaporanKerusakanType {
  id: string;
  tanggal_pengembalian: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah_rusak: number;
  nama_peminjam: string;
  divisi: string;
  nama_pekerjaan: string;
  area_kerja: string;
  keterangan: string;

  // Diperlukan agar cocok dengan constraint generic exportToPDF / exportToExcel
  [key: string]: unknown;
}
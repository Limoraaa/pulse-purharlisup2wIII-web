export interface LaporanKerusakanType {
  id: string;
  tanggal_pengembalian: string; // format "12 Jul 2026, 11:00"
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah_rusak: number;
  nama_peminjam: string;
  divisi: string;
  area_kerja: string;
  keterangan: string;

  [key: string]: unknown; // dibutuhkan agar kompatibel dengan exportToPDF/exportToExcel
}

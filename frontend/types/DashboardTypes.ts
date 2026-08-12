export interface DashboardSummary {
  total_tools: number;
  total_consumables: number;
  total_peminta: number;
  sedang_dipinjam: number;
}

export interface StokMenipisItem {
  id: string;
  kode_barang: string;
  nama: string;
  stok_awal: number;
}

export interface TelatKembaliItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  nama_peminjam: string;
  tanggal_pinjam: string;
  hari_terlambat: number;
}

export interface AlatTerpopulerItem {
  kode_barang: string;
  nama_barang: string;
  merk?: string | null;    // Tambahan baru
  ukuran?: string | null;  // Tambahan baru
  total_transaksi: number;
  total_unit: number;
}

export interface ConsumableTerpopulerItem {
  kode_barang: string;
  nama: string;
  nama_barang?: string | null; // Tambahan baru (jaga-jaga jika backend pakai key ini)
  merk?: string | null;        // Tambahan baru
  ukuran?: string | null;      // Tambahan baru
  total_diambil: number;
}

export interface KerusakanSummary {
  bulan_ini: number;
  total_semua: number;
  sedang_diperbaiki?: number;
}

export interface AktivitasItem {
  jenis: "peminjaman" | "pengembalian" | "consumable_keluar" | "kerusakan";
  deskripsi: string;
  waktu: string;
}

export interface TrenPeminjamanItem {
  tanggal: string;
  total: number;
}
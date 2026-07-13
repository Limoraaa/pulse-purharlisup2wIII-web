export type ToolCondition = "Baik" | "Rusak Ringan" | "Rusak Berat";

export interface ToolItemType {
  id: string; // dipakai sebagai React key & pembanding saat edit/hapus
  kodeBarang: string;
  namaBarang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  kondisi: ToolCondition;
  stok: number;
  dipinjam: number;
}

// Payload yang dipakai form Tambah/Edit (tanpa id, id di-generate/di-pass terpisah)
export type ToolFormValues = Omit<ToolItemType, "id">;

// ------------------------------------------------------------------
// Keranjang Peminjaman
// ------------------------------------------------------------------
export interface CartItemType {
  toolId: string; // relasi ke ToolItemType.id
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  maxJumlah: number; // dibatasi sesuai stok tersedia saat item ditambahkan
}

// ------------------------------------------------------------------
// Data Peminjam (dummy, nantinya diambil dari halaman "Data Peminjam")
// ------------------------------------------------------------------
export interface PeminjamType {
  id: string;
  nama: string;
  divisi: string;
}

// ------------------------------------------------------------------
// Form Peminjaman
// ------------------------------------------------------------------
export interface LoanFormValues {
  tanggalPeminjaman: string; // otomatis, tanggal hari ini
  peminjamId: string; // id dari PeminjamType yang dipilih
  namaPeminjam: string;
  divisi: string; // otomatis terisi berdasarkan peminjamId
  areaKerja: string;
}

// ------------------------------------------------------------------
// Transaksi Peminjaman (dibuat otomatis setelah form peminjaman disubmit)
// ------------------------------------------------------------------
export type TransaksiStatus = "Sedang Dipinjam" | "Dikembalikan" | "Terlambat";

export interface TransaksiPeminjamanItemType {
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
}

export interface TransaksiPeminjamanType {
  id: string;
  tanggalPeminjaman: string;
  namaPeminjam: string;
  divisi: string;
  areaKerja: string;
  items: TransaksiPeminjamanItemType[];
  status: TransaksiStatus;
}

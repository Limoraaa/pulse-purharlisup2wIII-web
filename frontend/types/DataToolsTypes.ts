export type ToolCondition =
  | "Baik"
  | "Rusak";

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
// Keranjang Peminjaman (khusus UI halaman Data Tools)
// ------------------------------------------------------------------
export interface CartItemType {
  toolId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  maxJumlah: number; // dibatasi sesuai stok tersedia saat item ditambahkan
}

// ------------------------------------------------------------------
// Data Peminjam (dummy, untuk dropdown di Form Peminjaman)
// ------------------------------------------------------------------
export interface PeminjamType {
  id: string;
  nama: string;
  divisi: string;
  aktif: boolean;
}

// ------------------------------------------------------------------
// Form Peminjaman
// ------------------------------------------------------------------
export interface LoanFormValues {
  tanggalPeminjaman: string; // otomatis, tanggal hari ini
  peminjamId: string;
  namaPeminjam: string;
  divisi: string; // otomatis terisi berdasarkan peminjamId
  areaKerja: string;
  spesifikasi?: string;   // tambahan baru, optional
  keterangan?: string; 
}

// ------------------------------------------------------------------
// Transaksi Peminjaman (dipakai untuk tampilan tabel Peminjaman Aktif)
// ------------------------------------------------------------------
export type TransaksiStatus = "Sedang Dipinjam" | "Selesai";

export interface TransaksiPeminjamanItemType {
  toolId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisiSaatDipinjam: ToolCondition; // kondisi alat waktu dipinjam
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

// ------------------------------------------------------------------
// Form Pengembalian
// ------------------------------------------------------------------
export interface PengembalianItemInput {
  toolId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisi: ToolCondition;
  catatan: string; // wajib diisi kalau kondisi selain "Baik"
}


// ------------------------------------------------------------------
// TAMBAHKAN INI ke types/DataToolsTypes.ts (di bagian bawah file)
// Dipakai untuk halaman "Peminjaman Aktif" -> 1 baris = 1 alat,
// datanya flat langsung dari GET /api/peminjaman (bukan grouped transaksi).
// ------------------------------------------------------------------
export interface PeminjamanAktifItemType {
  id: string; // id record peminjaman
  toolId: string; // id alat, dipakai untuk update kondisi kalau rusak
  tanggal: string; // tanggal peminjaman
  kodeBarang: string;
  namaBarang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah: number;
  namaPeminjam: string;
  divisi: string;
  areaKerja: string;
  spesifikasi: string;
  keterangan: string;
}
 
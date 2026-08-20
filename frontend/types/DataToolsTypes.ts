export type ToolCondition = "Baik" | "Rusak";
export type ToolKategori = "mesin" | "alat_biasa";

export interface ToolItemType {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  kondisi: ToolCondition;
  stok: number;
  dipinjam: number;
  kategori?: ToolKategori;
}

export type ToolFormValues = Omit<ToolItemType, "id">;

// ------------------------------------------------------------------
// Tools Masuk (riwayat alat masuk)
// ------------------------------------------------------------------
export interface ToolMasukType {
  id: string;
  tanggal: string;
  tool_id: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah_masuk: number;
  keterangan: string;
  dicatatOleh?: {
    id: string;
    name: string;
  };
}

export interface ToolMasukFormValues {
  tanggal: string;
  tool_id: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah_masuk: number;
  keterangan: string;
  id_card?: string;
}
// ------------------------------------------------------------------
// Keranjang Peminjaman
// ------------------------------------------------------------------
export interface CartItemType {
  toolId: string;
  cartId?: string | number; // id baris di temporary_cart, dipakai untuk update/hapus
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  maxJumlah: number;
}

// ------------------------------------------------------------------
// Data Peminjam
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// Data Peminjam
// ------------------------------------------------------------------
export interface PeminjamType {
  id: string;
  nama: string;
  divisi: string;
  rfid_uid?: string | null;
  aktif: boolean;
  role?: "user" | "inventory man"; // <--- Tambahkan baris ini
}

// ------------------------------------------------------------------
// Form Peminjaman
// ------------------------------------------------------------------
export interface LoanFormValues {
  tanggalPeminjaman: string;
  peminjamId: string;
  namaPeminjam: string;
  divisi: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi?: string;
  keterangan?: string;
}

// ------------------------------------------------------------------
// Transaksi Peminjaman
// ------------------------------------------------------------------
export type TransaksiStatus = "Sedang Dipinjam" | "Selesai";

export interface TransaksiPeminjamanItemType {
  toolId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisiSaatDipinjam: ToolCondition;
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
  catatan: string;
}

// ------------------------------------------------------------------
// Riwayat Kerusakan (dipakai reducer prosesPengembalian di inventoryToolsSlice)
// ------------------------------------------------------------------
export interface KerusakanHistoryType {
  id: string;
  tanggal: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisi: ToolCondition;
  catatan: string;
  namaPeminjam: string;
  divisi: string;
}

// ------------------------------------------------------------------
// Peminjaman Aktif
// ------------------------------------------------------------------
export interface PeminjamanAktifItemType {
  id: string;
  toolId: string;
  tanggal: string;
  kodeBarang: string;
  namaBarang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah: number;
  peminjamId: string;
  namaPeminjam: string;
  divisi: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi: string;
  keterangan: string;
}
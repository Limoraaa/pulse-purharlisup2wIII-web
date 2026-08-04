export type ToolCondition = "Baik" | "Rusak";

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
}

export type ToolFormValues = Omit<ToolItemType, "id">;

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
export interface PeminjamType {
  id: string;
  nama: string;
  divisi: string;
  rfid_uid?: string | null; // <--- Tambahkan baris ini
  aktif: boolean;
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
  namaPeminjam: string;
  divisi: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi: string;
  keterangan: string;
}
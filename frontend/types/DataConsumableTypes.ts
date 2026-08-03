// ------------------------------------------------------------------
// Data Consumable (master data)
// ------------------------------------------------------------------
export interface ConsumableItemType {
  id: string;
  kode_barang: string;
  nama: string;
  merk: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  stok_awal: number;
  stok_awal_asli: number;
  total_masuk: number;
  total_keluar: number;
}

export interface ConsumableFormValues {
  kode_barang: string;
  nama: string;
  merk: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  stok_awal: number;
  stok_awal_asli?: number; // opsional -- cuma dipakai saat koreksi data lewat form Edit
}

// ------------------------------------------------------------------
// Keranjang "Ambil Bahan" (dipakai di Data Consumable)
// ------------------------------------------------------------------
export interface ConsumableCartItemType {
  id: string;
  consumable_id: string;
  kode_barang: string;
  nama: string;
  jumlah: number;
  stok_tersedia: number;
}

// ------------------------------------------------------------------
// Form Pengambilan Bahan (Consumable Keluar)
// ------------------------------------------------------------------
export interface ConsumableOutFormValues {
  tanggalPengambilan: string;
  pemintaId: string;
  namaPeminta: string;
  divisi: string;
  areaKerja: string;
  keterangan: string;
}

// ------------------------------------------------------------------
// Consumable Masuk (transaksi barang masuk)
// ------------------------------------------------------------------
export interface ConsumableMasukType {
  id: string;
  tanggal: string;
  consumable_id: string;
  kode_barang: string;
  nama: string;
  merk: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  jumlah_masuk: number;
  keterangan: string;
}

export type ConsumableMasukFormValues = Omit<ConsumableMasukType, "id">;
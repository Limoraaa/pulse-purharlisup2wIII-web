// ------------------------------------------------------------------
// Data Consumable (master data)
// ------------------------------------------------------------------
export interface ConsumableItemType {
  id: string;
  kode_barang: string;
  nama: string;
  merk: string;
  tipe: string; // ditambahkan setelah "merk", sebelumnya terlewat
  er_e: string;
  ukuran: string;
  stok_awal: number;
}

export type ConsumableFormValues = Omit<ConsumableItemType, "id">;

// ------------------------------------------------------------------
// Keranjang "Ambil Bahan" (dipakai di Data Consumable)
// ------------------------------------------------------------------
export interface ConsumableCartItemType {
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
  tanggalPengambilan: string; // ditampilkan, format "16 Juli 2026"
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
  consumable_id: string; // relasi ke ConsumableItemType.id
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

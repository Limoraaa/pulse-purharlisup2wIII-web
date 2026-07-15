// ------------------------------------------------------------------
// Data Consumable (Bahan Habis Pakai)
// ------------------------------------------------------------------
export interface ConsumableItemType {
  id: string; 
  kode_barang: string;
  nama: string;
  merk: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  stok_awal: number; // Ini adalah total stok yang tersedia
}

// Payload untuk form Tambah/Edit Consumable
export type ConsumableFormValues = Omit<ConsumableItemType, "id">;

// ------------------------------------------------------------------
// Antrean Pengambilan Consumable
// ------------------------------------------------------------------
export interface ConsumableCartItemType {
  consumable_id: string; // Relasi ke ConsumableItemType.id
  kode_barang: string;
  nama: string;
  jumlah: number;
  stok_tersedia: number; // Untuk membatasi jumlah pengambilan agar tidak melebihi stok
}
// ------------------------------------------------------------------
// Transaksi Consumable (Masuk & Keluar)
// ------------------------------------------------------------------
// Consumable tidak dipinjam, melainkan ada alur masuk (restock) dan keluar (pemakaian)
export interface ConsumableLogItemType {
  id: string;
  consumable_id: string; // Relasi ke ConsumableItemType.id
  kode_barang: string;
  nama: string;
  jumlah: number;
  tanggal: string;
}

// ------------------------------------------------------------------
// Form Pemakaian Consumable (Consumable Keluar)
// ------------------------------------------------------------------
export interface ConsumableOutFormValues {
  consumable_id: string;
  jumlah: number;
  tanggal_keluar: string;
  area_pekerjaan: string;
  dipakai_oleh: string; // Nama teknisi atau ID peminjam
}

// ------------------------------------------------------------------
// Form Restock Consumable (Consumable Masuk)
// ------------------------------------------------------------------
export interface ConsumableInFormValues {
  consumable_id: string;
  jumlah: number;
  tanggal_masuk: string;
  keterangan: string; // Contoh: "Pembelian rutin" atau "Barang dari supplier"
}
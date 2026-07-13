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

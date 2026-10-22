export type ChecklistStatus = "baik" | "perlu_perhatian" | "rusak";

export interface ChecklistItemResult {
  item: string;
  status: ChecklistStatus;
}

// Pilihan jenis oli/pelumas untuk part mesin; "Lainnya" diketik bebas
export const JENIS_OLI = ["Oli mesin", "Oli hidrolik", "Oli gear", "Oli spindle", "Oli slideway", "Grease"];
export const SATUAN_OLI = ["Liter", "ml", "Kg", "Gram"];

// Spesifikasi oli standar sebuah part (opsional, hanya part yang memakai oli)
export interface OliSpec {
  merek: string; // mis. Shell
  jenis: string; // mis. Oli mesin
  kode: string; // kode oli, mis. AX7
  kapasitas?: number | null; // kapasitas standar, acuan teknisi
  satuan?: string | null;
}

// Tindakan oli saat checklist: hanya dicek, ditambah (top-up), atau diganti semua
export type TindakanOli = "tidak" | "tambah" | "ganti";

export interface MachinePart {
  id: string;
  partNumber: string;
  partName: string;
  checklistItems: string[]; // poin-poin pemeriksaan untuk part ini (bisa dari IK template)
  xPercent: number; // posisi horizontal relatif terhadap lebar gambar (0-100)
  yPercent: number; // posisi vertikal relatif terhadap tinggi gambar (0-100)
  oli?: OliSpec | null;
}

// Payload yang disimpan/di-load dari backend per mesin_produksi_id
export interface PartMappingPayload {
  gambarUrl: string | null;
  parts: MachinePart[];
}

// "Shell · Oli mesin · AX7"
export const labelOli = (o: Pick<OliSpec, "merek" | "jenis" | "kode">) =>
  [o.merek, o.jenis, o.kode].filter(Boolean).join(" · ");

// 1.5 -> "1,5"
export const formatJumlahOli = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

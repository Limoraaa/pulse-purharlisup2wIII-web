export type ChecklistStatus = "baik" | "perlu_perhatian" | "rusak";

export interface ChecklistItemResult {
  item: string;
  status: ChecklistStatus;
}

export interface MachinePart {
  id: string;
  partNumber: string;
  partName: string;
  checklistItems: string[]; // poin-poin pemeriksaan untuk part ini (bisa dari IK template)
  xPercent: number; // posisi horizontal relatif terhadap lebar gambar (0-100)
  yPercent: number; // posisi vertikal relatif terhadap tinggi gambar (0-100)
}

// Payload yang disimpan/di-load dari backend per mesin_produksi_id
export interface PartMappingPayload {
  gambarUrl: string | null;
  parts: MachinePart[];
}
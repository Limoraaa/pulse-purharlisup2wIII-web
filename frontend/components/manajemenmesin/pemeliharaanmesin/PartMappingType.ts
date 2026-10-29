export type ChecklistStatus = "baik" | "perlu_perhatian" | "rusak";

export interface ChecklistItemResult {
  item: string;
  status: ChecklistStatus;
}

// Tindakan oli saat kegiatan pemeliharaan: ditambah (top-up) atau diganti semua.
// Oli diatur per mesin (oli standar di Data Mesin) dan dipilih dari halaman Data Oli.
export type TindakanOli = "tambah" | "ganti";

// Satu sudut pandang/gambar dari sebuah mesin (tampak depan, area kerja, panel, dst.)
export interface MachineView {
  id: string;
  nama: string;
  gambarUrl: string;
}

export interface MachinePart {
  id: string;
  viewId: string; // view tempat titik part ini ditandai
  partNumber: string; // unik per mesin (lintas view)
  partName: string;
  checklistItems: string[]; // poin-poin pemeriksaan untuk part ini (bisa dari IK template)
  xPercent: number; // posisi horizontal relatif terhadap lebar gambar (0-100)
  yPercent: number; // posisi vertikal relatif terhadap tinggi gambar (0-100)
}

// Payload mentah dari backend per mesin_produksi_id.
// Data lama hanya punya gambarUrl + parts tanpa viewId; gunakan normalisasiMapping().
export interface PartMappingPayload {
  gambarUrl?: string | null; // tetap dikirim = gambar view pertama (kompatibilitas data lama)
  views?: MachineView[];
  parts: (Omit<MachinePart, "viewId"> & { viewId?: string })[];
}

export const VIEW_DEFAULT_ID = "view-utama";

// Ubah payload lama (1 gambar) maupun baru (multi-view) menjadi bentuk multi-view yang seragam
export function normalisasiMapping(res?: PartMappingPayload | null): { views: MachineView[]; parts: MachinePart[] } {
  let views = res?.views ?? [];
  if (views.length === 0 && res?.gambarUrl) {
    views = [{ id: VIEW_DEFAULT_ID, nama: "Tampak utama", gambarUrl: res.gambarUrl }];
  }
  const fallbackViewId = views[0]?.id ?? "";
  const parts = (res?.parts ?? []).map((p) => ({ ...p, viewId: p.viewId ?? fallbackViewId }));
  return { views, parts };
}

// 1.5 -> "1,5"
export const formatJumlahOli = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
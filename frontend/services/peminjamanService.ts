import apiFetch from "lib/api";
import { CartItemType } from "types/DataToolsTypes";

interface CreatePeminjamanPayload {
  tanggal: string;
  tool_id: string;
  peminta_id: string;
  jumlah: number;
  area_pekerjaan: string;
  dicatat_oleh: string;
}

// Cart bisa berisi banyak alat sekaligus, tapi backend cuma terima 1 alat
// per transaksi -> submit satu per satu, semua dengan tanggal & peminjam yang sama.
export async function submitPeminjaman(
  cartItems: CartItemType[],
  pemintaId: string,
  areaKerja: string,
  dicatatOleh: string
): Promise<void> {
  const tanggal = new Date().toISOString(); // timestamp saat ini, termasuk jam

  for (const item of cartItems) {
    const payload: CreatePeminjamanPayload = {
      tanggal,
      tool_id: item.toolId,
      peminta_id: pemintaId,
      jumlah: item.jumlah,
      area_pekerjaan: areaKerja,
      dicatat_oleh: dicatatOleh,
    };

    await apiFetch("/peminjaman", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
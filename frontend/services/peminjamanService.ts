import apiFetch from "lib/api";
import { CartItemType } from "types/DataToolsTypes";
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

interface CreatePeminjamanPayload {
  tanggal: string;
  tool_id: string;
  peminta_id: string;
  jumlah: number;
  area_pekerjaan: string;
  spesifikasi?: string;
  keterangan?: string;
  dicatat_oleh: string;
}

// Cart bisa berisi banyak alat sekaligus, tapi backend cuma terima 1 alat
// per transaksi -> submit satu per satu, semua dengan tanggal & peminjam yang sama.
export async function submitPeminjaman(
  cartItems: CartItemType[],
  pemintaId: string,
  areaKerja: string,
  dicatatOleh: string,
  spesifikasi?: string,
  keterangan?: string
): Promise<void> {
  const tanggal = new Date().toISOString();

  for (const item of cartItems) {
    const payload: CreatePeminjamanPayload = {
      tanggal,
      tool_id: item.toolId,
      peminta_id: pemintaId,
      jumlah: item.jumlah,
      area_pekerjaan: areaKerja,
      spesifikasi,
      keterangan,
      dicatat_oleh: dicatatOleh,
    };

    await apiFetch("/peminjaman", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
// Bentuk response index() dari Laravel, dengan relasi tool & peminta ter-load
// Bentuk response index() dari Laravel, dengan relasi tool & peminta ter-load
  interface PeminjamanIndexApiResponse {
    id: string;
    tanggal: string;
    tool_id: string;
    jumlah: number;
    area_pekerjaan: string | null;
    spesifikasi: string | null;
    keterangan: string | null;
    tanggal_kembali: string | null;
    tool: {
      kode_barang: string;
      nama_barang: string;
      merk: string | null;
      type: string | null;
      warna: string | null;
      ukuran: string | null;
    } | null;
    peminta: {
      nama: string;
      divisi: string;
    } | null;
  }
  
  function mapPeminjamanFromApi(item: PeminjamanIndexApiResponse): PeminjamanAktifItemType {
    return {
      id: item.id,
      toolId: item.tool_id,
      tanggal: item.tanggal,
      kodeBarang: item.tool?.kode_barang ?? "-",
      namaBarang: item.tool?.nama_barang ?? "-",
      merk: item.tool?.merk ?? "-",
      tipe: item.tool?.type ?? "-",
      warna: item.tool?.warna ?? "-",
      ukuran: item.tool?.ukuran ?? "-",
      jumlah: item.jumlah,
      namaPeminjam: item.peminta?.nama ?? "-",
      divisi: item.peminta?.divisi ?? "-",
      areaKerja: item.area_pekerjaan ?? "-",
      spesifikasi: item.spesifikasi ?? "-",
      keterangan: item.keterangan ?? "-",
    };
  }
  
  // Ambil semua peminjaman yang MASIH AKTIF (tanggal_kembali masih null)
  export async function getPeminjamanAktif(): Promise<PeminjamanAktifItemType[]> {
    const data: PeminjamanIndexApiResponse[] = await apiFetch("/peminjaman");
    return data
      .filter((item) => item.tanggal_kembali === null)
      .map(mapPeminjamanFromApi);
  }
  
  // Tandai 1 peminjaman sebagai sudah dikembalikan
  // (pakai endpoint yang sudah ada: PATCH /api/peminjaman/{id}/kembalikan)
  export async function tandaiDikembalikan(id: string): Promise<void> {
    await apiFetch(`/peminjaman/${id}/kembali`, { method: "PATCH" });
  }
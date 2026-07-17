import apiFetch from "lib/api";
import { CartItemType, PeminjamanAktifItemType } from "types/DataToolsTypes";
import { RiwayatPeminjamanType } from "types/RiwayatTypes";

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

// DIPERTAHANKAN untuk kompatibilitas lama, TIDAK DIPAKAI LAGI oleh flow cart baru.
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

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatTanggalJam(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, "0");
  const bulan = BULAN_SINGKAT[d.getMonth()];
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${bulan} ${year}, ${hour}:${minute}`;
}

// Nomor transaksi buatan: semua alat yang dipinjam dalam satu kali submit form
// punya timestamp "tanggal" yang identik persis (di-generate sekali sebelum loop
// di submitPeminjaman), jadi kombinasi tanggal+peminta cukup unik untuk grouping.
function buildNomorTransaksi(tanggalIso: string, pemintaNama: string): string {
  const timestamp = new Date(tanggalIso).getTime();
  const pemintaCode = pemintaNama.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return `TRX-${timestamp}-${pemintaCode}`;
}

function mapRiwayatFromApi(item: PeminjamanIndexApiResponse): RiwayatPeminjamanType {
  const namaPeminjam = item.peminta?.nama ?? "-";
  return {
    id: item.id,
    nomor_transaksi: buildNomorTransaksi(item.tanggal, namaPeminjam),
    tanggal_pinjam: formatTanggalJam(item.tanggal),
    tanggal_kembali: item.tanggal_kembali ? formatTanggalJam(item.tanggal_kembali) : "-",
    kode_barang: item.tool?.kode_barang ?? "-",
    nama_barang: item.tool?.nama_barang ?? "-",
    merk: item.tool?.merk ?? "-",
    tipe: item.tool?.type ?? "-",
    warna: item.tool?.warna ?? "-",
    ukuran: item.tool?.ukuran ?? "-",
    jumlah: item.jumlah,
    namaPeminjam: namaPeminjam,
    nama_peminjam: namaPeminjam,
    divisi: item.peminta?.divisi ?? "-",
    areaKerja: item.area_pekerjaan ?? "-",
    area_kerja: item.area_pekerjaan ?? "-",
    spesifikasi: item.spesifikasi ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

export async function getPeminjamanAktif(): Promise<PeminjamanAktifItemType[]> {
  const data: PeminjamanIndexApiResponse[] = await apiFetch("/peminjaman");
  return data.filter((item) => item.tanggal_kembali === null).map(mapPeminjamanFromApi);
}

export async function tandaiDikembalikan(id: string): Promise<void> {
  await apiFetch(`/peminjaman/${id}/kembali`, { method: "PATCH" });
}

// ================= CART (temporary_cart) — FLOW BARU =================

export interface AntreanItemResponse {
  cart_id: string | number;
  tool_id: string;
  kode_barang: string;
  nama_barang: string;
  qty: number;
  max_jumlah: number;
}

// Dipanggil dari: tombol "+" manual di web, DAN app Flutter setelah scan QR/barcode.
export async function scanTool(
  toolId: string,
  jumlah = 1
): Promise<{ message: string; qty: number }> {
  return apiFetch("/peminjaman/scan", {
    method: "POST",
    body: JSON.stringify({ tools_id: toolId, jumlah }),
  });
}

export async function fetchAntrean(): Promise<AntreanItemResponse[]> {
  const res = (await apiFetch("/peminjaman/antrean")) as { data: AntreanItemResponse[] };
  return res.data;
}

export async function updateCartItem(cartId: string | number, qty: number): Promise<void> {
  await apiFetch(`/peminjaman/cart/${cartId}`, {
    method: "PATCH",
    body: JSON.stringify({ qty }),
  });
}

export async function removeCartItem(cartId: string | number): Promise<void> {
  await apiFetch(`/peminjaman/cart/${cartId}`, { method: "DELETE" });
}

export async function prosesPeminjamanApi(params: {
  pemintaId: string;
  dicatatOleh: string;
  areaKerja?: string;
  spesifikasi?: string;
  keterangan?: string;
}): Promise<void> {
  await apiFetch("/peminjaman/proses", {
    method: "POST",
    body: JSON.stringify({
      peminta_id: params.pemintaId,
      dicatat_oleh: params.dicatatOleh,
      area_pekerjaan: params.areaKerja,
      spesifikasi: params.spesifikasi,
      keterangan: params.keterangan,
    }),
  });
}

// Ambil semua peminjaman yang SUDAH SELESAI (tanggal_kembali sudah terisi)
export async function getRiwayatPeminjaman(): Promise<RiwayatPeminjamanType[]> {
  const data: PeminjamanIndexApiResponse[] = await apiFetch("/peminjaman");
  return data
    .filter((item) => item.tanggal_kembali !== null)
    .map(mapRiwayatFromApi);
}
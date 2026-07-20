import apiFetch from "lib/api";
import { CartItemType, PeminjamanAktifItemType } from "types/DataToolsTypes";
import { RiwayatPeminjamanType } from "types/RiwayatTypes";

// --- INTERFACES ---

export interface PeminjamanIndexApiResponse {
  id: string;
  tanggal: string;
  tanggal_kembali: string | null;
  jumlah: number;
  area_pekerjaan: string;
  spesifikasi?: string;
  keterangan?: string;
  tool?: {
    id: string;
    kode_barang: string;
    nama_barang: string;
    merk: string;
    type: string;
    warna: string;
    ukuran: string;
  };
  peminta?: {
    nama: string;
    divisi: string;
  };
}

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

// --- UTILS & MAPPERS ---

function formatTanggalJam(isoString: string): string {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}

function buildNomorTransaksi(tanggalIso: string, pemintaNama: string): string {
  const timestamp = new Date(tanggalIso).getTime();
  const pemintaCode = pemintaNama.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return `TRX-${timestamp}-${pemintaCode}`;
}

function mapPeminjamanFromApi(item: PeminjamanIndexApiResponse): PeminjamanAktifItemType {
  return {
    id: item.id,
    toolId: item.tool?.id ?? "-",
    tanggal: formatTanggalJam(item.tanggal),
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

// --- EXPORTED FUNCTIONS ---

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

export async function getPeminjamanAktif(): Promise<PeminjamanAktifItemType[]> {
  const data: PeminjamanIndexApiResponse[] = await apiFetch("/peminjaman");
  return data.filter((item) => item.tanggal_kembali === null).map(mapPeminjamanFromApi);
}

export async function getRiwayatPeminjaman(): Promise<RiwayatPeminjamanType[]> {
  const data: PeminjamanIndexApiResponse[] = await apiFetch("/peminjaman");
  return data
    .filter((item) => item.tanggal_kembali !== null)
    .map(mapRiwayatFromApi);
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

export async function scanTool(toolId: string, jumlah = 1): Promise<{ message: string; qty: number }> {
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
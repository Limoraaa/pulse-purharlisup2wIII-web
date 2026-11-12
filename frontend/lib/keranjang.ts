import api from "lib/api";
import { fetchAntrean, AntreanItemResponse } from "services/peminjamanService";

// Keranjang Ruang Tools disimpan di server (tabel temporary_cart): alat lewat /peminjaman/antrean,
// consumable lewat /consumable-keluar/antrean. Halaman Data Tools dan Data Consumable sama-sama
// membaca keduanya dari server, sehingga isi keranjang selalu sama di kedua halaman (dan di tab lain).

export interface KeranjangTool {
  cartId: string | number;
  toolId: string;
  namaBarang: string;
  kodeBarang: string;
  jumlah: number;
  maxJumlah: number;
  item_type: "tool";
}

export interface KeranjangConsumable {
  id: string;
  consumable_id: string;
  kode_barang: string;
  nama: string;
  jumlah: number;
  stok_tersedia: number;
  item_type: "consumable";
}

interface AntreanConsumableApiItem {
  id: string;
  consumable_id: string;
  kodeBarang?: string;
  kode_barang?: string;
  namaBarang?: string;
  nama?: string;
  qty?: number;
  jumlah?: number;
  stok_tersedia?: number;
}

// Satu kartu per alat (baris antrean dengan alat yang sama dijumlahkan)
export const kelompokkanKeranjangTools = (rows: AntreanItemResponse[]): KeranjangTool[] =>
  rows.reduce((acc: KeranjangTool[], item) => {
    const ada = acc.find((c) => c.toolId === item.tools_id);
    if (ada) {
      ada.jumlah += item.qty ?? 1;
    } else {
      acc.push({
        cartId: item.id,
        toolId: item.tools_id,
        namaBarang: item.nama_barang || "Nama Alat Tidak Ditemukan",
        kodeBarang: item.kode_barang || "-",
        jumlah: item.qty ?? 1,
        maxJumlah: item.max_jumlah ?? 99,
        item_type: "tool",
      });
    }
    return acc;
  }, []);

export async function ambilKeranjangTools(): Promise<KeranjangTool[]> {
  return kelompokkanKeranjangTools(await fetchAntrean());
}

export async function ambilKeranjangConsumable(): Promise<KeranjangConsumable[]> {
  const json = await api<{ data: AntreanConsumableApiItem[] } | AntreanConsumableApiItem[]>("/consumable-keluar/antrean");
  const rows = Array.isArray(json) ? json : json.data || [];
  return rows.map((item) => ({
    id: item.id,
    consumable_id: item.consumable_id,
    kode_barang: item.kodeBarang || item.kode_barang || "-",
    nama: item.namaBarang || item.nama || "Bahan Dihapus",
    jumlah: item.qty || item.jumlah || 1,
    stok_tersedia: item.stok_tersedia ?? 0,
    item_type: "consumable",
  }));
}

// Urutan stabil berdasarkan id barang supaya posisi kartu tidak lompat-lompat
export function urutkanKeranjang<T>(items: T[]): T[] {
  const kunci = (x: T) => {
    const o = x as { toolId?: unknown; consumable_id?: unknown; id?: unknown };
    return String(o.toolId ?? o.consumable_id ?? o.id ?? "");
  };
  return [...items].sort((a, b) => kunci(a).localeCompare(kunci(b)));
}

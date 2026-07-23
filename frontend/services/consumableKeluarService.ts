import apiFetch from "lib/api";
import { RiwayatConsumableKeluarType } from "types/RiwayatTypes";
import { 
  ConsumableItemType, 
  ConsumableFormValues, 
  ConsumableOutFormValues 
} from "types/DataConsumableTypes";

// ==========================================
// MASTER DATA CONSUMABLE (CRUD)
// ==========================================

export async function getConsumables(): Promise<ConsumableItemType[]> {
  const response = await apiFetch<any>("/consumable");
  // Menyesuaikan struktur response Laravel (bisa berupa array langsung atau terbungkus key 'data')
  const data = Array.isArray(response) ? response : response.data || [];
  
  return data.map((item: any) => ({
    id: item.id,
    kode_barang: item.kode_barang,
    nama: item.nama,
    merk: item.merk || "-",
    tipe: item.type || item.tipe || "-",
    er_e: item.er_e || "-",
    ukuran: item.ukuran || "-",
    stok_awal: item.stok_awal ?? 0,
  }));
}

export async function createConsumable(values: ConsumableFormValues): Promise<ConsumableItemType> {
  const token = localStorage.getItem("token");
  const response = await apiFetch<any>("/consumable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });

  const item = response.data || response;
  return {
    id: item.id,
    kode_barang: item.kode_barang,
    nama: item.nama,
    merk: item.merk || "-",
    tipe: item.type || item.tipe || "-",
    er_e: item.er_e || "-",
    ukuran: item.ukuran || "-",
    stok_awal: item.stok_awal ?? 0,
  };
}

export async function updateConsumable(id: string, values: ConsumableFormValues): Promise<ConsumableItemType> {
  const token = localStorage.getItem("token");
  const response = await apiFetch<any>(`/consumable/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });

  const item = response.data || response;
  return {
    id: item.id,
    kode_barang: item.kode_barang,
    nama: item.nama,
    merk: item.merk || "-",
    tipe: item.type || item.tipe || "-",
    er_e: item.er_e || "-",
    ukuran: item.ukuran || "-",
    stok_awal: item.stok_awal ?? 0,
  };
}

export async function deleteConsumable(id: string): Promise<void> {
  const token = localStorage.getItem("token");
  await apiFetch(`/consumable/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ==========================================
// RIWAYAT & TRANSAKSI CONSUMABLE KELUAR
// ==========================================

function formatTanggalJam(isoString: string): string {
  const d = new Date(isoString);

  const parts = new Intl.DateTimeFormat("id-ID", {
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

interface ConsumableKeluarApiResponse {
  id: string;
  tanggal: string;
  consumable_id: string;
  jumlah_keluar: number;
  pekerjaan_area: string | null;
  keterangan: string | null;
  consumable: {
    kode_barang: string;
    nama: string;
    merk: string | null;
    type: string | null;
    er_e: string | null;
    ukuran: string | null;
  } | null;
  peminta: {
    nama: string;
    kategori: string | null;
  } | null;
}

function mapRiwayatConsumableKeluarFromApi(
  item: ConsumableKeluarApiResponse
): RiwayatConsumableKeluarType {
  const namaPeminta = item.peminta?.nama ?? "-";
  return {
    id: item.id,
    nomor_transaksi: buildNomorTransaksi(item.tanggal, namaPeminta),
    tanggal_pengambilan: formatTanggalJam(item.tanggal),
    kode_barang: item.consumable?.kode_barang ?? "-",
    nama_barang: item.consumable?.nama ?? "-",
    merk: item.consumable?.merk ?? "-",
    tipe: item.consumable?.type ?? "-",
    er_e: item.consumable?.er_e ?? "-",
    ukuran: item.consumable?.ukuran ?? "-",
    jumlah: item.jumlah_keluar,
    nama_peminta: namaPeminta,
    divisi: item.peminta?.kategori ?? "-",
    area_kerja: item.pekerjaan_area ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

export async function getRiwayatConsumableKeluar(): Promise<RiwayatConsumableKeluarType[]> {
  const response = await apiFetch<any>("/consumable-keluar");
  const data: ConsumableKeluarApiResponse[] = Array.isArray(response) ? response : response.data || [];
  return data.map(mapRiwayatConsumableKeluarFromApi);
}

/**
 * Memproses pengeluaran consumable berdasarkan data antrean di database (temporary_cart).
 * Memastikan barang dari hasil scan HP dan web terproses secara sinkron.
 */
export async function submitConsumableKeluar(
  values: ConsumableOutFormValues,
  dicatatOleh: string,
  token: string
): Promise<void> {
  const payload = {
    peminta_id: values.pemintaId,
    pekerjaan_area: values.areaKerja,
    keterangan: values.keterangan || "",
    dicatat_oleh: dicatatOleh,
  };

  await apiFetch("/consumable-keluar/proses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
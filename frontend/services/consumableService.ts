import apiFetch from "lib/api";
import { ConsumableItemType, ConsumableFormValues } from "types/DataConsumableTypes";

interface ConsumableApiResponse {
  id: string;
  kode_barang: string;
  nama: string;
  merk: string | null;
  type: string | null;
  er_e: string | null;
  ukuran: string | null;
  satuan: string | null;
  stok_awal: number;
  stok_awal_asli: number;
  total_masuk: number;
  total_keluar: number;
}

interface ConsumableApiPayload {
  kode_barang: string;
  nama: string;
  merk: string;
  type: string;
  er_e: string;
  ukuran: string;
  satuan: string;
  stok_awal: number;
  stok_awal_asli?: number;
}

function mapConsumableFromApi(item: ConsumableApiResponse): ConsumableItemType {
  return {
    id: item.id,
    kode_barang: item.kode_barang,
    nama: item.nama,
    merk: item.merk ?? "-",
    tipe: item.type ?? "-",
    er_e: item.er_e ?? "-",
    ukuran: item.ukuran ?? "-",
    satuan: item.satuan ?? "-",
    stok_awal: item.stok_awal,
    stok_awal_asli: item.stok_awal_asli,
    total_masuk: item.total_masuk,
    total_keluar: item.total_keluar,
  };
}

function mapConsumableToApi(values: ConsumableFormValues): ConsumableApiPayload {
  const payload: ConsumableApiPayload = {
    kode_barang: values.kode_barang,
    nama: values.nama,
    merk: values.merk,
    type: values.tipe,
    er_e: values.er_e,
    ukuran: values.ukuran,
    satuan: values.satuan,
    stok_awal: values.stok_awal,
  };

  if (values.stok_awal_asli !== undefined) {
    payload.stok_awal_asli = values.stok_awal_asli;
  }

  return payload;
}

// urutan natural: T-1, T-2, T-3, ... T-10 (bukan T-1, T-10, T-2 ala alfabetis biasa)
function sortByKode(items: ConsumableItemType[]): ConsumableItemType[] {
  return [...items].sort((a, b) =>
    b.kode_barang.localeCompare(a.kode_barang, undefined, { numeric: true })
  );
}

export async function getConsumables(): Promise<ConsumableItemType[]> {
  const data: ConsumableApiResponse[] = await apiFetch("/consumable");
  return sortByKode(data.map(mapConsumableFromApi));
}

export async function createConsumable(values: ConsumableFormValues): Promise<ConsumableItemType> {
  const data: ConsumableApiResponse = await apiFetch("/consumable", {
    method: "POST",
    body: JSON.stringify(mapConsumableToApi(values)),
  });
  return mapConsumableFromApi(data);
}

export async function updateConsumable(id: string, values: ConsumableFormValues): Promise<ConsumableItemType> {
  const data: ConsumableApiResponse = await apiFetch(`/consumable/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapConsumableToApi(values)),
  });
  return mapConsumableFromApi(data);
}

export async function deleteConsumable(id: string): Promise<void> {
  await apiFetch(`/consumable/${id}`, { method: "DELETE" });
}
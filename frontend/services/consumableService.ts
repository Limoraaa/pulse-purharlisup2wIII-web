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
  stok_awal: number;
}

interface ConsumableApiPayload {
  kode_barang: string;
  nama: string;
  merk: string;
  type: string;
  er_e: string;
  ukuran: string;
  stok_awal: number;
}

function mapConsumableFromApi(item: ConsumableApiResponse): ConsumableItemType {
  return {
    id: item.id,
    kode_barang: item.kode_barang,
    nama: item.nama,
    merk: item.merk ?? "-",
    type: item.type ?? "-", // Ensure ConsumableItemType has 'tipe'
    er_e: item.er_e ?? "-",
    ukuran: item.ukuran ?? "-",
    stok_awal: item.stok_awal,
  };
}

function mapConsumableToApi(values: ConsumableFormValues): ConsumableApiPayload {
  return {
    kode_barang: values.kode_barang,
    nama: values.nama,
    merk: values.merk,
    type: values.type, // Ensure ConsumableFormValues has 'tipe'
    er_e: values.er_e,
    ukuran: values.ukuran,
    stok_awal: values.stok_awal,
  };
}

// urutan natural: T-1, T-2, T-3, ... T-10 (bukan T-1, T-10, T-2 ala alfabetis biasa)
function sortByKode(items: ConsumableItemType[]): ConsumableItemType[] {
  return [...items].sort((a, b) =>
    a.kode_barang.localeCompare(b.kode_barang, undefined, { numeric: true })
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
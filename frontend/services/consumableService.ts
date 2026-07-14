import apiFetch from "lib/api";
import { ConsumableItemType, ConsumableFormValues } from "types/DataConsumableTypes";

// Bentuk data mentah dari Laravel
interface ConsumableApiResponse {
  id: string;
  kode_barang: string;
  nama: string;
  merk: string | null;
  er_e: string | null;
  ukuran: string | null;
  stok_awal: number;
}

// Bentuk payload untuk Create/Update ke Laravel
interface ConsumableApiPayload {
  kode_barang: string;
  nama: string;
  merk: string;
  er_e: string;
  ukuran: string;
  stok_awal: number;
}

// Map dari bentuk backend ke bentuk frontend (ConsumableItemType)
function mapConsumableFromApi(item: ConsumableApiResponse): ConsumableItemType {
  return {
    id: item.id,
    kode_barang: item.kode_barang,
    nama: item.nama,
    merk: item.merk ?? "-",
    er_e: item.er_e ?? "-",
    ukuran: item.ukuran ?? "-",
    stok_awal: item.stok_awal,
  };
}

// Map dari form values ke payload backend
function mapConsumableToApi(values: ConsumableFormValues): ConsumableApiPayload {
  return {
    kode_barang: values.kode_barang,
    nama: values.nama,
    merk: values.merk,
    er_e: values.er_e,
    ukuran: values.ukuran,
    stok_awal: values.stok_awal,
  };
}

export async function getConsumables(): Promise<ConsumableItemType[]> {
  // Pastikan endpoint sesuai dengan route Laravel: /api/consumable
  const data: ConsumableApiResponse[] = await apiFetch("/consumable");
  return data.map(mapConsumableFromApi);
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
import apiFetch from "lib/api";
import { ConsumableMasukType, ConsumableMasukFormValues } from "types/DataConsumableTypes";

interface ConsumableMasukApiResponse {
  id: string;
  tanggal: string;
  consumable_id: string;
  jumlah_masuk: number;
  keterangan: string | null;
  dicatat_oleh: string;
  consumable?: {
    id: string;
    kode_barang: string;
    nama: string;
    merk: string | null;
    type: string | null;
    er_e: string | null;
    ukuran: string | null;
    stok_awal: number;
  };
}

interface CreateConsumableMasukPayload {
  tanggal: string;
  consumable_id: string;
  jumlah_masuk: number;
  keterangan: string;
  dicatat_oleh: string;
}

interface UpdateConsumableMasukPayload {
  tanggal?: string;
  keterangan?: string;
}

function mapFromApi(item: ConsumableMasukApiResponse): ConsumableMasukType {
  return {
    id: item.id,
    tanggal: item.tanggal,
    consumable_id: item.consumable_id,
    kode_barang: item.consumable?.kode_barang ?? "",
    nama: item.consumable?.nama ?? "",
    merk: item.consumable?.merk ?? "-",
    tipe: item.consumable?.type ?? "-",
    er_e: item.consumable?.er_e ?? "-",
    ukuran: item.consumable?.ukuran ?? "-",
    jumlah_masuk: item.jumlah_masuk,
    keterangan: item.keterangan ?? "",
  };
}

export async function getConsumableMasuk(): Promise<ConsumableMasukType[]> {
  const data: ConsumableMasukApiResponse[] = await apiFetch("/consumable-masuk");
  return data
    .map(mapFromApi)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function createConsumableMasuk(
  values: ConsumableMasukFormValues,
  dicatatOleh: string
): Promise<ConsumableMasukType> {
  const payload: CreateConsumableMasukPayload = {
    tanggal: values.tanggal,
    consumable_id: values.consumable_id,
    jumlah_masuk: values.jumlah_masuk,
    keterangan: values.keterangan,
    dicatat_oleh: dicatatOleh,
  };

  const data: ConsumableMasukApiResponse = await apiFetch("/consumable-masuk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

// Backend cuma izinkan ubah tanggal & keterangan (jumlah_masuk butuh recalculation,
// jadi sengaja tidak bisa diubah lewat update biasa)
export async function updateConsumableMasuk(
  id: string,
  values: { tanggal: string; keterangan: string }
): Promise<ConsumableMasukType> {
  const payload: UpdateConsumableMasukPayload = {
    tanggal: values.tanggal,
    keterangan: values.keterangan,
  };

  const data: ConsumableMasukApiResponse = await apiFetch(`/consumable-masuk/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

export async function deleteConsumableMasuk(id: string): Promise<void> {
  await apiFetch(`/consumable-masuk/${id}`, { method: "DELETE" });
}
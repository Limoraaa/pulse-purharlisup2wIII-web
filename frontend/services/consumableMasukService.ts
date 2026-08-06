import apiFetch from "lib/api";
import { ConsumableMasukType, ConsumableMasukFormValues } from "types/DataConsumableTypes";

interface ConsumableMasukApiResponse {
  id: string;
  tanggal: string;
  consumable_id: string;
  jumlah_masuk: number;
  keterangan: string | null;
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
  // Digabung menjadi satu deklarasi fleksibel yang bisa berupa string ID atau objek relasi dari Laravel
  dicatat_oleh?: string | {
    id: string;
    nama?: string;
    name?: string;
    nama_lengkap?: string;
    nama_pegawai?: string;
  };
  dicatatOleh?: {
    id: string;
    nama?: string;
    name?: string;
  };
  dicatat_oleh_rel?: {
    id: string;
    nama?: string;
    name?: string;
  };
}

interface CreateConsumableMasukPayload {
  tanggal: string;
  consumable_id: string;
  jumlah_masuk: number;
  keterangan: string;
  peminta_id: string; 
}

interface UpdateConsumableMasukPayload {
  tanggal?: string;
  jumlah_masuk?: number;
  keterangan?: string;
}

function mapFromApi(item: ConsumableMasukApiResponse): ConsumableMasukType {
  // Menangkap objek relasi secara aman dari berbagai kemungkinan format key API backend
  const relasiUser = 
    item.dicatatOleh || 
    item.dicatat_oleh_rel || 
    (typeof item.dicatat_oleh === "object" ? item.dicatat_oleh : null);

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
    
    dicatatOleh: relasiUser ? {
      id: relasiUser.id ?? "",
      name: relasiUser.nama ?? relasiUser.name ?? (relasiUser as any).nama_lengkap ?? (relasiUser as any).nama_pegawai ?? "Tidak Diketahui",
    } : undefined,
  };
}

export async function getConsumableMasuk(): Promise<ConsumableMasukType[]> {
  const data: ConsumableMasukApiResponse[] = await apiFetch("/consumable-masuk");
  return data
    .map(mapFromApi)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function createConsumableMasuk(
  values: ConsumableMasukFormValues & { peminta_id?: string; id_card?: string }
): Promise<ConsumableMasukType> {
  const payload: CreateConsumableMasukPayload = {
    tanggal: values.tanggal,
    consumable_id: values.consumable_id,
    jumlah_masuk: values.jumlah_masuk,
    keterangan: values.keterangan,
    peminta_id: values.peminta_id || values.id_card || "", 
  };

  const data: ConsumableMasukApiResponse = await apiFetch("/consumable-masuk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

export async function updateConsumableMasuk(
  id: string,
  values: { tanggal: string; jumlah_masuk: number; keterangan: string }
): Promise<ConsumableMasukType> {
  const payload: UpdateConsumableMasukPayload = {
    tanggal: values.tanggal,
    jumlah_masuk: values.jumlah_masuk,
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
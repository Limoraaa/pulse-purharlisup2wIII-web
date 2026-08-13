import apiFetch from "lib/api";
import { ToolMasukType, ToolMasukFormValues } from "types/DataToolsTypes";

interface ToolMasukApiResponse {
  id: string;
  tanggal: string;
  tool_id: string;
  jumlah_masuk: number;
  keterangan: string | null;
  tool?: {
    id: string;
    kode_barang: string;
    nama_barang: string;
    merk: string | null;
    type: string | null;
    warna: string | null;
    ukuran: string | null;
    stok: number;
  };
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

interface CreateToolMasukPayload {
  tanggal: string;
  tool_id: string;
  jumlah_masuk: number;
  keterangan: string;
  peminta_id: string;
}

interface UpdateToolMasukPayload {
  tanggal?: string;
  jumlah_masuk?: number;
  keterangan?: string;
}

function mapFromApi(item: ToolMasukApiResponse): ToolMasukType {
  const relasiUser =
    item.dicatatOleh ||
    item.dicatat_oleh_rel ||
    (typeof item.dicatat_oleh === "object" ? item.dicatat_oleh : null);

  return {
    id: item.id,
    tanggal: item.tanggal,
    tool_id: item.tool_id,
    kode_barang: item.tool?.kode_barang ?? "",
    nama_barang: item.tool?.nama_barang ?? "",
    merk: item.tool?.merk ?? "-",
    tipe: item.tool?.type ?? "-",
    warna: item.tool?.warna ?? "-",
    ukuran: item.tool?.ukuran ?? "-",
    jumlah_masuk: item.jumlah_masuk,
    keterangan: item.keterangan ?? "",

    dicatatOleh: relasiUser ? {
      id: relasiUser.id ?? "",
      name: relasiUser.nama ?? relasiUser.name ?? (relasiUser as any).nama_lengkap ?? (relasiUser as any).nama_pegawai ?? "Tidak Diketahui",
    } : undefined,
  };
}

export async function getToolMasuk(): Promise<ToolMasukType[]> {
  const data: ToolMasukApiResponse[] = await apiFetch("/tools-masuk");
  return data
    .map(mapFromApi)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function createToolMasuk(
  values: ToolMasukFormValues & { peminta_id?: string; id_card?: string }
): Promise<ToolMasukType> {
  const payload: CreateToolMasukPayload = {
    tanggal: values.tanggal,
    tool_id: values.tool_id,
    jumlah_masuk: values.jumlah_masuk,
    keterangan: values.keterangan,
    peminta_id: values.peminta_id || values.id_card || "",
  };

  const data: ToolMasukApiResponse = await apiFetch("/tools-masuk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

export async function updateToolMasuk(
  id: string,
  values: { tanggal: string; jumlah_masuk: number; keterangan: string }
): Promise<ToolMasukType> {
  const payload: UpdateToolMasukPayload = {
    tanggal: values.tanggal,
    jumlah_masuk: values.jumlah_masuk,
    keterangan: values.keterangan,
  };

  const data: ToolMasukApiResponse = await apiFetch(`/tools-masuk/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

export async function deleteToolMasuk(id: string): Promise<void> {
  await apiFetch(`/tools-masuk/${id}`, { method: "DELETE" });
}
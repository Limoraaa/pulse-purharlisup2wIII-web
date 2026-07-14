import apiFetch from "lib/api";
import { ToolItemType, ToolFormValues } from "types/DataToolsTypes";

// Bentuk data mentah persis seperti yang dikirim Laravel (snake_case)
interface ToolApiResponse {
  id: string;
  kode_barang: string;
  nama_barang: string;
  merk: string | null;
  type: string | null;
  warna: string | null;
  ukuran: string | null;
  keadaan: string;
  stok: number;
  sedang_dipinjam: number;
}

// Bentuk payload yang dikirim ke Laravel saat create/update
interface ToolApiPayload {
  kode_barang: string;
  nama_barang: string;
  merk: string;
  type: string;
  warna: string;
  ukuran: string;
  keadaan: string;
  stok: number;
}

const keadaanToKondisi = (keadaan: string): ToolItemType["kondisi"] => {
  return keadaan === "R" ? "Rusak" : "Baik";
};

const kondisiToKeadaan = (kondisi: ToolItemType["kondisi"]): string => {
  return kondisi === "Baik" ? "B" : "R";
};

// Ubah 1 objek dari bentuk backend (snake_case) ke bentuk yang dipakai komponen (camelCase)
function mapToolFromApi(item: ToolApiResponse): ToolItemType {
  return {
    id: item.id,
    kodeBarang: item.kode_barang,
    namaBarang: item.nama_barang,
    merk: item.merk ?? "-",
    tipe: item.type ?? "-",
    warna: item.warna ?? "-",
    ukuran: item.ukuran ?? "-",
    kondisi: keadaanToKondisi(item.keadaan),
    stok: item.stok,
    dipinjam: item.sedang_dipinjam,
  };
}

// Ubah form values (camelCase) ke payload yang dimengerti Laravel (snake_case)
function mapToolToApi(values: ToolFormValues): ToolApiPayload {
  return {
    kode_barang: values.kodeBarang,
    nama_barang: values.namaBarang,
    merk: values.merk,
    type: values.tipe,
    warna: values.warna,
    ukuran: values.ukuran,
    keadaan: kondisiToKeadaan(values.kondisi),
    stok: values.stok,
  };
}

function sortByKode(tools: ToolItemType[]): ToolItemType[] {
  return [...tools].sort((a, b) =>
    a.kodeBarang.localeCompare(b.kodeBarang, undefined, { numeric: true })
  );
}

export async function getTools(): Promise<ToolItemType[]> {
  const data: ToolApiResponse[] = await apiFetch("/tools");
  return sortByKode(data.map(mapToolFromApi));
}

export async function createTool(values: ToolFormValues): Promise<ToolItemType> {
  const data: ToolApiResponse = await apiFetch("/tools", {
    method: "POST",
    body: JSON.stringify(mapToolToApi(values)),
  });
  return mapToolFromApi(data);
}

export async function updateTool(id: string, values: ToolFormValues): Promise<ToolItemType> {
  const data: ToolApiResponse = await apiFetch(`/tools/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapToolToApi(values)),
  });
  return mapToolFromApi(data);
}

export async function deleteTool(id: string): Promise<void> {
  await apiFetch(`/tools/${id}`, { method: "DELETE" });
}

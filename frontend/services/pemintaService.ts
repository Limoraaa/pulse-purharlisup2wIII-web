import apiFetch from "lib/api";
import { PeminjamType } from "types/DataToolsTypes";

interface PemintaApiResponse {
  id: string;
  nama: string;
  kategori: string | null;
}

function mapPemintaFromApi(item: PemintaApiResponse): PeminjamType {
  return {
    id: item.id,
    nama: item.nama,
    divisi: item.kategori ?? "-",
  };
}

export async function getPeminta(): Promise<PeminjamType[]> {
  const data: PemintaApiResponse[] = await apiFetch("/peminta");
  return data.map(mapPemintaFromApi);
}
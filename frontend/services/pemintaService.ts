import apiFetch from "lib/api";
import { PeminjamType } from "types/DataToolsTypes";
import { PeminjamFormValues } from "components/ruangtools/datapeminjam/PeminjamFormModal";

interface PemintaApiResponse {
  id: string; // Ini sekarang berisi nomor RFID atau UUID bawaan
  nama: string;
  divisi: string | null;
  aktif: boolean;
}

interface PemintaApiPayload {
  id?: string; // Tambahkan ini agar ID hasil scan dikirim ke Laravel
  nama: string;
  divisi: string;
}

function mapPemintaFromApi(item: PemintaApiResponse): PeminjamType {
  return {
    id: item.id,
    nama: item.nama,
    divisi: item.divisi ?? "-",
    aktif: item.aktif,
  };
}

function mapPemintaToApi(values: PeminjamFormValues): PemintaApiPayload {
  const payload: PemintaApiPayload = {
    nama: values.nama,
    divisi: values.divisi,
  };

  // Jika kolom RFID di form diisi, masukkan ke paket data untuk dikirim ke API
  if (values.id && values.id.trim() !== "") {
    payload.id = values.id;
  }

  return payload;
}

// Semua peminjam (aktif + nonaktif) -- dipakai di halaman manajemen Data Peminjam
export async function getPeminta(): Promise<PeminjamType[]> {
  const data = await apiFetch<PemintaApiResponse[]>("/peminta");
  return data.map(mapPemintaFromApi);
}

// Cuma peminjam yang AKTIF -- dipakai buat dropdown di form peminjaman
// (biar peminjam yang sudah dinonaktifkan tidak bisa dipilih lagi)
export async function getPemintaAktif(): Promise<PeminjamType[]> {
  const data = await apiFetch<PemintaApiResponse[]>("/peminta?aktif=1");
  return data.map(mapPemintaFromApi);
}

export async function createPeminta(values: PeminjamFormValues): Promise<PeminjamType> {
  const data = await apiFetch<PemintaApiResponse>("/peminta", {
    method: "POST",
    body: JSON.stringify(mapPemintaToApi(values)),
  });
  return mapPemintaFromApi(data);
}

export async function updatePeminta(id: string, values: PeminjamFormValues): Promise<PeminjamType> {
  const data = await apiFetch<PemintaApiResponse>(`/peminta/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapPemintaToApi(values)),
  });
  return mapPemintaFromApi(data);
}

// Ganti nama dari deletePeminta -> nonaktifkanPeminta, karena backend
// sekarang tidak lagi hapus permanen (supaya riwayat transaksi lama aman).
export async function nonaktifkanPeminta(id: string): Promise<PeminjamType> {
  const res = await apiFetch<{ message: string; data: PemintaApiResponse }>(
    `/peminta/${id}`,
    { method: "DELETE" }
  );
  return mapPemintaFromApi(res.data);
}

export async function aktifkanPeminta(id: string): Promise<PeminjamType> {
  const res = await apiFetch<{ message: string; data: PemintaApiResponse }>(
    `/peminta/${id}/aktifkan`,
    { method: "PATCH" }
  );
  return mapPemintaFromApi(res.data);
}
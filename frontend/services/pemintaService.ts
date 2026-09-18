import apiFetch from "lib/api";
import { PeminjamType } from "types/DataToolsTypes";
import { PeminjamFormValues } from "components/ruangtools/datapeminjam/PeminjamFormModal";

interface PemintaApiResponse {
  id: string; // Ini sekarang berisi nomor RFID atau UUID bawaan
  nama: string;
  divisi: string | null;
  aktif: boolean;
  role?: "user" | "inventory man"; // <-- Tambahkan properti role
}

interface PemintaApiPayload {
  id?: string; // Tambahkan ini agar ID hasil scan dikirim ke Laravel
  nama: string;
  divisi: string;
  role?: "user" | "inventory man"; // <-- Tambahkan properti role
}

function mapPemintaFromApi(item: PemintaApiResponse): PeminjamType {
  return {
    id: item.id,
    nama: item.nama,
    divisi: item.divisi ?? "-",
    aktif: item.aktif,
    role: item.role ?? "user", // <-- Petakan role dari API
  };
}

function mapPemintaToApi(values: PeminjamFormValues & { role?: "user" | "inventory man" }): PemintaApiPayload {
  const payload: PemintaApiPayload = {
    nama: values.nama,
    divisi: values.divisi,
    role: values.role ?? "user", // <-- Kirim role ke API
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

// --- FUNGSI BARU: KHUSUS UNTUK MENGUBAH ROLE SAJA ---
export async function updateRolePeminta(id: string, role: "user" | "inventory man"): Promise<PeminjamType> {
  const data = await apiFetch<PemintaApiResponse>(`/peminta/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return mapPemintaFromApi(data);
}

// Ganti nama dari deletePeminta -> nonaktifkanPeminta
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
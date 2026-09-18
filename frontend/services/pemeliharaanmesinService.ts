import api from "lib/api";

// Tipe data untuk Mesin Produksi
export interface MesinItemType {
  id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  lokasi_ruang: string;
  status: 'Aktif' | 'Maintenance' | 'Rusak';
}

// Tipe data untuk Log Pemeliharaan / Kartu Gantung
export interface LogPemeliharaanType {
  id: number | string;
  mesin_produksi_id: number | string;
  uraian_pemeliharaan: string;
  waktu_pelaksana: string;
  keterangan?: string;
  paraf: string;
}

// 1. Mengambil semua data mesin produksi
export async function getMesinProduksi(): Promise<MesinItemType[]> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: MesinItemType[] } | MesinItemType[]>("/mesin-produksi", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res) ? res : res.data || [];
}

// 2. Menambah data mesin produksi baru
export async function createMesinProduksi(data: Omit<MesinItemType, 'id'>): Promise<MesinItemType> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: MesinItemType } | MesinItemType>("/mesin-produksi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return (res as any).data || res;
}

// 3. Mengambil riwayat log pemeliharaan berdasarkan ID Mesin (Kartu Gantung)
export async function getLogPemeliharaanByMesin(mesinId: number | string): Promise<LogPemeliharaanType[]> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: LogPemeliharaanType[] } | LogPemeliharaanType[]>(
    `/log-pemeliharaan/mesin/${mesinId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return Array.isArray(res) ? res : res.data || [];
}

// 4. Menambah catatan log pemeliharaan / kartu gantung baru
export async function createLogPemeliharaan(data: {
  mesin_produksi_id: number | string;
  uraian_pemeliharaan: string;
  waktu_pelaksana: string;
  keterangan?: string;
  paraf: string;
}): Promise<LogPemeliharaanType> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: LogPemeliharaanType } | LogPemeliharaanType>("/log-pemeliharaan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return (res as any).data || res;
}
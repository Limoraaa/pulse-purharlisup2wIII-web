// frontend/services/oliService.ts
import api from '../lib/api';

export interface OliItem {
  id: number;
  kode_oli: string;
  nama_oli: string;
  stok: number;
  satuan: string;
  batas_minimum: number;
}

export const fetchOli = async (): Promise<OliItem[]> => {
  const response: any = await api('/olis', { method: 'GET' });
  return response.data || [];
};

export const createOli = async (data: Partial<OliItem>) => {
  const response: any = await api('/olis', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

export const updateOli = async (id: number, data: Partial<OliItem>) => {
  const response: any = await api(`/olis/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
};

export const deleteOli = async (id: number) => {
  await api(`/olis/${id}`, { method: 'DELETE' });
};
// Riwayat pemakaian satu oli: dipakai di mesin mana saja dan kapan
export interface RiwayatOliItem {
  id: number;
  tanggal: string;
  mesin_id: number;
  kode_mesin: string | null;
  nama_mesin: string | null;
  tindakan: 'tambah' | 'ganti' | null;
  jumlah: number | string | null;
  paraf: string;
}

export const fetchRiwayatOli = async (id: number): Promise<RiwayatOliItem[]> => {
  const response: any = await api(`/olis/${id}/riwayat`, { method: 'GET' });
  return response.data || [];
};

'use client';

import { useEffect, useState } from 'react';
import api from '/lib/api';

interface PeminjamanItem {
  id: string;
  jumlah: number;
  tanggal: string;
  nama_pekerjaan: string;
  tool?: {
    nama_barang: string;
    kode_barang: string;
  };
  peminta?: {
    nama: string;
  };
}

export default function PeminjamanBelumKembaliPage() {
  const [listData, setListData] = useState<PeminjamanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res: any = await api('/peminjaman/belum-kembali');
      setListData(res.data || []);
    } catch (error) {
      console.error('Gagal memuat data alat belum kembali', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKembalikan = async (id: string) => {
    if (!confirm('Tandai alat ini sudah dikembalikan?')) return;
    try {
      await api(`/peminjaman/${id}/kembali`, {
        method: 'PATCH',
      });
      fetchData();
    } catch (error: any) {
      alert(error?.message || 'Gagal memproses pengembalian');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Memuat data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Daftar Peminjam Alat Belum Mengembalikan</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peminjam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Alat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pinjam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pekerjaan</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Tidak ada alat yang belum dikembalikan. Semua aman!
                </td>
              </tr>
            ) : (
              listData.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {item.peminta?.nama || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {item.tool?.nama_barang || 'Alat Dihapus'} <span className="text-xs text-gray-400">({item.tool?.kode_barang})</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.jumlah}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{new Date(item.tanggal).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.nama_pekerjaan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleKembalikan(item.id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                    >
                      Tandai Kembali
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
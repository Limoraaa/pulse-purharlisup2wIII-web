'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { IconEdit, IconPackages, IconPlus, IconTrash } from '@tabler/icons-react';
import api from 'lib/api';
import { useFeedback } from 'components/common/FeedbackProvider';
import KebutuhanMesinFormModal, { JenisKebutuhan, KebutuhanItem } from './KebutuhanMesinFormModal';

const JENIS_META: Record<JenisKebutuhan, { label: string; bg: string; text: string }> = {
  alat: { label: 'Alat', bg: 'primary-subtle', text: 'primary-emphasis' },
  consumable: { label: 'Consumable', bg: 'warning-subtle', text: 'warning-emphasis' },
};

const formatJumlah = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });

interface Props {
  mesinId: number | string;
  canManage: boolean;
}

/**
 * Kebutuhan alat & consumable untuk pemeliharaan satu mesin.
 * Catatan mandiri (nama, jumlah, satuan, keterangan), tidak terhubung ke stok gudang.
 * Kelola penuh: tambah, ubah, hapus. Lihat saja: hanya melihat.
 */
export default function KebutuhanMesinPanel({ mesinId, canManage }: Props) {
  const { notify, confirm } = useFeedback();
  const { data: items = [], error, isLoading, mutate } = useSWR<KebutuhanItem[]>(
    mesinId ? `/kebutuhan-mesin?mesin_id=${mesinId}` : null,
    async (url: string) => (await api<{ data: KebutuhanItem[] }>(url)).data
  );

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KebutuhanItem | null>(null);

  const jumlahAlat = items.filter((i) => i.jenis === 'alat').length;
  const jumlahConsumable = items.length - jumlahAlat;

  const bukaTambah = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const bukaEdit = (item: KebutuhanItem) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleSaved = async (pesan: string) => {
    setShowForm(false);
    await mutate();
    notify(pesan, 'success');
  };

  const handleHapus = async (item: KebutuhanItem) => {
    const setuju = await confirm({
      title: 'Hapus kebutuhan?',
      message: `"${item.nama_barang}" akan dihapus dari daftar kebutuhan mesin ini.`,
      confirmLabel: 'Ya, hapus',
    });
    if (!setuju) return;
    try {
      await api(`/kebutuhan-mesin/${item.id}`, { method: 'DELETE' });
      await mutate();
      notify('Kebutuhan berhasil dihapus.', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Kebutuhan gagal dihapus.', 'danger');
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <IconPackages size={18} className="text-primary" /> Kebutuhan Alat &amp; Consumable
          </h6>
          <div className="small text-secondary">
            Daftar alat dan consumable yang dibutuhkan untuk pemeliharaan mesin ini.
          </div>
        </div>
        {canManage && (
          <Button size="sm" variant="primary" onClick={bukaTambah} className="d-inline-flex align-items-center gap-1">
            <IconPlus size={16} /> Tambah Kebutuhan
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="sm" />
        </div>
      ) : error ? (
        <Alert variant="danger" className="small d-flex justify-content-between align-items-center">
          <span>{error.message || 'Data kebutuhan gagal dimuat.'}</span>
          <Button size="sm" variant="outline-danger" onClick={() => mutate()}>Muat ulang</Button>
        </Alert>
      ) : items.length === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <IconPackages size={36} className="mb-2 opacity-50" />
          <p className="fw-semibold mb-1">Belum ada kebutuhan</p>
          <p className="small text-secondary mb-0">
            {canManage
              ? 'Klik "Tambah Kebutuhan" untuk mencatat alat atau consumable yang dibutuhkan.'
              : 'Kebutuhan alat dan consumable untuk mesin ini belum dicatat.'}
          </p>
        </div>
      ) : (
        <>
          <div className="small text-secondary mb-2">
            {items.length} kebutuhan · {jumlahAlat} alat · {jumlahConsumable} consumable
          </div>
          <div className="table-responsive border rounded-3">
            <Table hover className="mb-0 align-middle text-nowrap">
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: 50 }}>No</th>
                  <th style={{ width: 120 }}>Jenis</th>
                  <th>Nama Barang</th>
                  <th className="text-end" style={{ width: 150 }}>Jumlah</th>
                  <th>Keterangan</th>
                  {canManage && <th className="text-center" style={{ width: 100 }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const meta = JENIS_META[item.jenis];
                  return (
                    <tr key={item.id}>
                      <td className="text-center text-secondary">{i + 1}</td>
                      <td>
                        <Badge bg={meta.bg} text={meta.text} className="fw-semibold">{meta.label}</Badge>
                      </td>
                      <td className="fw-semibold text-wrap">{item.nama_barang}</td>
                      <td className="text-end">
                        <span className="fw-semibold">{formatJumlah(item.jumlah)}</span>{' '}
                        <span className="text-secondary">{item.satuan}</span>
                      </td>
                      <td className="text-wrap small text-secondary">{item.keterangan || '-'}</td>
                      {canManage && (
                        <td className="text-center">
                          <div className="d-inline-flex gap-1">
                            <Button size="sm" variant="light" className="border" onClick={() => bukaEdit(item)} title="Edit" aria-label={`Edit ${item.nama_barang}`}>
                              <IconEdit size={16} />
                            </Button>
                            <Button size="sm" variant="light" className="border text-danger" onClick={() => handleHapus(item)} title="Hapus" aria-label={`Hapus ${item.nama_barang}`}>
                              <IconTrash size={16} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {canManage && (
        <KebutuhanMesinFormModal
          show={showForm}
          onHide={() => setShowForm(false)}
          onSaved={handleSaved}
          mesinId={mesinId}
          item={editItem}
        />
      )}
    </div>
  );
}

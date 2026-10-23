'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Spinner, Alert, Badge, Modal, Form } from 'react-bootstrap';
import { IconPlus, IconEdit, IconTrash, IconDroplet, IconHistory } from '@tabler/icons-react';
import { usePermission } from 'hooks/usePermissions';
import { useFeedback } from 'components/common/FeedbackProvider';
import { formatTanggal } from 'components/ruangtools/common/dateUtils';
import { fetchOli, createOli, updateOli, deleteOli, fetchRiwayatOli, OliItem, RiwayatOliItem } from 'services/oliService';

export default function DataOliManager() {
  const canManage = usePermission('manage_inventaris');
  const { confirm: confirmDialog, notify } = useFeedback();

  // Riwayat pemakaian oli (dari Checklist Visual pemeliharaan mesin)
  const [riwayatOli, setRiwayatOli] = useState<OliItem | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatOliItem[]>([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  const bukaRiwayat = async (oli: OliItem) => {
    setRiwayatOli(oli);
    setRiwayat([]);
    setLoadingRiwayat(true);
    try {
      setRiwayat(await fetchRiwayatOli(oli.id));
    } catch (err: any) {
      notify(err.message || 'Gagal memuat riwayat oli');
    } finally {
      setLoadingRiwayat(false);
    }
  };
  
  const [olis, setOlis] = useState<OliItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalShow, setModalShow] = useState(false);
  const [editItem, setEditItem] = useState<OliItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    kode_oli: '',
    nama_oli: '',
    stok: '',
    satuan: 'Liter',
    batas_minimum: '5'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchOli();
      setOlis(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data oli');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (item: OliItem | null = null) => {
    setEditItem(item);
    if (item) {
      setFormData({
        kode_oli: item.kode_oli,
        nama_oli: item.nama_oli,
        stok: String(item.stok),
        satuan: item.satuan,
        batas_minimum: String(item.batas_minimum)
      });
    } else {
      setFormData({ kode_oli: '', nama_oli: '', stok: '', satuan: 'Liter', batas_minimum: '5' });
    }
    setModalShow(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        stok: Number(formData.stok),
        batas_minimum: Number(formData.batas_minimum)
      };

      if (editItem) {
        await updateOli(editItem.id, payload);
      } else {
        await createOli(payload);
      }
      setModalShow(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog({
      title: 'Hapus Data Oli?',
      message: 'Data oli ini akan dihapus.',
      confirmLabel: 'Ya, hapus',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteOli(id);
      loadData();
    } catch (err: any) {
      notify(err.message || 'Gagal menghapus data');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Monitoring Ketersediaan Oli</h3>
          <p className="text-muted mb-0 small">Pantau stok oli dan cairan pelumas mesin secara real-time.</p>
        </div>
        {canManage && (
          <Button variant="primary" className="fw-semibold shadow-sm" onClick={() => handleOpenModal()}>
            <IconPlus size={18} className="me-2" /> Tambah Oli Baru
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light text-secondary">
                <tr>
                  <th className="py-3 px-4 border-0">Kode</th>
                  <th className="py-3 px-4 border-0">Nama Oli / Pelumas</th>
                  <th className="py-3 px-4 text-end border-0">Sisa Stok</th>
                  <th className="py-3 px-4 text-center border-0">Status</th>
                  <th className="py-3 px-4 text-center border-0">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {olis.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-muted">Belum ada data master oli.</td></tr>
                ) : (
                  olis.map((oli) => {
                    const isKritis = oli.stok <= oli.batas_minimum;
                    return (
                      <tr key={oli.id}>
                        <td className="px-4 fw-medium text-secondary">{oli.kode_oli}</td>
                        <td className="px-4 fw-bold text-dark">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary-subtle p-2 rounded text-primary">
                              <IconDroplet size={16} />
                            </div>
                            {oli.nama_oli}
                          </div>
                        </td>
                        <td className={`px-4 text-end fw-bolder fs-5 ${isKritis ? 'text-danger' : 'text-success'}`}>
                          {oli.stok} <span className="fs-6 fw-normal text-muted">{oli.satuan}</span>
                        </td>
                        <td className="px-4 text-center">
                          {isKritis ? (
                            <Badge bg="danger" className="px-3 py-2 rounded-pill">Stok Kritis</Badge>
                          ) : (
                            <Badge bg="success" className="px-3 py-2 rounded-pill">Aman</Badge>
                          )}
                        </td>
                        <td className="px-4 text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <Button variant="light" size="sm" className="border shadow-sm text-primary" title="Riwayat pemakaian" onClick={() => bukaRiwayat(oli)}>
                              <IconHistory size={14} />
                            </Button>
                          {canManage && (
                            <>
                              <Button variant="light" size="sm" className="border shadow-sm text-secondary" onClick={() => handleOpenModal(oli)}>
                                <IconEdit size={14} />
                              </Button>
                              <Button variant="light" size="sm" className="border shadow-sm text-danger" onClick={() => handleDelete(oli.id)}>
                                <IconTrash size={14} />
                              </Button>
                            </>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Riwayat Pemakaian */}
      <Modal show={!!riwayatOli} onHide={() => setRiwayatOli(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <IconHistory size={20} /> Riwayat Pemakaian {riwayatOli?.kode_oli} - {riwayatOli?.nama_oli}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingRiwayat ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : riwayat.length === 0 ? (
            <div className="text-center text-muted py-4">Oli ini belum pernah dipakai di Checklist Visual.</div>
          ) : (
            <Table size="sm" hover responsive className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Tanggal</th>
                  <th>Mesin</th>
                  <th>Tindakan</th>
                  <th className="text-end">Jumlah</th>
                  <th>Teknisi</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr key={r.id}>
                    <td className="text-nowrap">{formatTanggal(r.tanggal)}</td>
                    <td>{r.kode_mesin} - {r.nama_mesin}</td>
                    <td>{r.tindakan === 'ganti' ? <Badge bg="primary">Ganti</Badge> : <Badge bg="info" text="dark">Tambah</Badge>}</td>
                    <td className="text-end text-nowrap">
                      {Number(r.jumlah).toLocaleString('id-ID', { maximumFractionDigits: 2 })} {riwayatOli?.satuan}
                    </td>
                    <td>{r.paraf}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Form */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered backdrop="static">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">{editItem ? 'Edit Data Oli' : 'Tambah Oli Baru'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Kode Oli</Form.Label>
              <Form.Control required value={formData.kode_oli} onChange={e => setFormData({...formData, kode_oli: e.target.value})} placeholder="Contoh: OLI-MT-01" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Nama Oli / Pelumas</Form.Label>
              <Form.Control required value={formData.nama_oli} onChange={e => setFormData({...formData, nama_oli: e.target.value})} placeholder="Contoh: Shell Tellus S2 V 46" />
            </Form.Group>
            <div className="row mb-3">
              <div className="col-8">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Stok Saat Ini</Form.Label>
                  <Form.Control type="number" step="0.01" required value={formData.stok} onChange={e => setFormData({...formData, stok: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-4">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Satuan</Form.Label>
                  <Form.Control required value={formData.satuan} onChange={e => setFormData({...formData, satuan: e.target.value})} />
                </Form.Group>
              </div>
            </div>
            <Form.Group>
              <Form.Label className="small fw-semibold">Batas Minimum (Alert)</Form.Label>
              <Form.Control type="number" step="0.01" required value={formData.batas_minimum} onChange={e => setFormData({...formData, batas_minimum: e.target.value})} />
              <Form.Text className="text-muted">Sistem akan memberi peringatan jika stok di bawah angka ini.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={() => setModalShow(false)} disabled={saving}>Batal</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Data'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
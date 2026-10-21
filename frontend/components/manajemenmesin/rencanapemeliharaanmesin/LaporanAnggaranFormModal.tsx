'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

// ---------- Tipe & konstanta yang dipakai halaman Laporan Anggaran ----------
export type StatusPekerjaan = 'belum_dikerjakan' | 'sedang_dikerjakan' | 'sudah_dikerjakan';

export interface PekerjaanItem {
  id: number;
  tahun: number;
  bulan: number;
  nama_pekerjaan: string;
  rincian: string | null;
  biaya: number;
  biaya_aktual: number | null;
  status: StatusPekerjaan;
  nama_vendor: string | null;
  no_po: string | null;
  keterangan: string | null;
}

export interface DisburseItem {
  id: number;
  tahun: number;
  bulan: number;
  uraian: string;
  nominal: number;
}

export const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface Props {
  show: boolean;
  onHide: () => void;
  tahun: number;
  jenis: 'pekerjaan' | 'disburse'; // menentukan isi form
  defaultBulan: number;
  editItem: PekerjaanItem | DisburseItem | null; // null = tambah baru
  onSave: (payload: any, id?: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function LaporanAnggaranFormModal({ show, onHide, tahun, jenis, defaultBulan, editItem, onSave, onDelete }: Props) {
  const [bulan, setBulan] = useState(defaultBulan);

  // Field rencana pekerjaan
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [rincian, setRincian] = useState('');
  const [biaya, setBiaya] = useState('');
  const [status, setStatus] = useState<StatusPekerjaan>('belum_dikerjakan');
  const [namaVendor, setNamaVendor] = useState('');
  const [noPo, setNoPo] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [biayaAktual, setBiayaAktual] = useState('');

  // Field disburse
  const [uraian, setUraian] = useState('');
  const [nominal, setNominal] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!show) return;
    setError('');
    setConfirmDelete(false);
    setBulan(editItem?.bulan ?? defaultBulan);

    const p = jenis === 'pekerjaan' ? (editItem as PekerjaanItem | null) : null;
    setNamaPekerjaan(p?.nama_pekerjaan ?? '');
    setRincian(p?.rincian ?? '');
    setBiaya(p ? String(p.biaya) : '');
    setStatus(p?.status ?? 'belum_dikerjakan');
    setNamaVendor(p?.nama_vendor ?? '');
    setNoPo(p?.no_po ?? '');
    setKeterangan(p?.keterangan ?? '');
    setBiayaAktual(p?.biaya_aktual != null ? String(p.biaya_aktual) : '');

    const d = jenis === 'disburse' ? (editItem as DisburseItem | null) : null;
    setUraian(d?.uraian ?? '');
    setNominal(d ? String(d.nominal) : '');
  }, [show, editItem, jenis, defaultBulan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload =
        jenis === 'pekerjaan'
          ? {
              tahun,
              bulan,
              nama_pekerjaan: namaPekerjaan,
              rincian: rincian || null,
              biaya: Number(biaya) || 0,
              biaya_aktual: biayaAktual === '' ? null : Number(biayaAktual),
              status,
              nama_vendor: namaVendor || null,
              no_po: noPo || null,
              keterangan: keterangan || null,
            }
          : { tahun, bulan, uraian, nominal: Number(nominal) || 0 };
      await onSave(payload, editItem?.id);
    } catch (err: any) {
      setError(err?.message || 'Data gagal disimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem) return;
    setSaving(true);
    setError('');
    try {
      await onDelete(editItem.id);
    } catch (err: any) {
      setError(err?.message || 'Data gagal dihapus. Coba lagi.');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  const namaJenis = jenis === 'pekerjaan' ? 'rencana pekerjaan' : 'disburse';

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size={jenis === 'pekerjaan' ? 'lg' : undefined}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">
            {editItem ? 'Ubah' : 'Tambah'} {namaJenis}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="py-2 small">
              {error}
            </Alert>
          )}

          {jenis === 'pekerjaan' ? (
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label className="small fw-semibold">Bulan</Form.Label>
                <Form.Select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
                  {MONTHS_LONG.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m} {tahun}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-8">
                <Form.Label className="small fw-semibold">Nama pekerjaan</Form.Label>
                <Form.Control
                  required
                  autoFocus
                  value={namaPekerjaan}
                  onChange={(e) => setNamaPekerjaan(e.target.value)}
                  placeholder="Contoh: Service & perbaikan mesin CNC bubut"
                />
              </div>

              <div className="col-12">
                <Form.Label className="small fw-semibold">Rincian pekerjaan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={rincian}
                  onChange={(e) => setRincian(e.target.value)}
                  placeholder={'Satu baris untuk satu butir pekerjaan\nInvestigasi mesin\nGanti selang lubrikasi'}
                />
              </div>

              <div className="col-md-6">
                <Form.Label className="small fw-semibold">Biaya rencana (Rp)</Form.Label>
                <Form.Control type="number" min={0} required value={biaya} onChange={(e) => setBiaya(e.target.value)} />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-semibold">Status</Form.Label>
                <Form.Select value={status} onChange={(e) => setStatus(e.target.value as StatusPekerjaan)}>
                  <option value="belum_dikerjakan">Belum dikerjakan</option>
                  <option value="sedang_dikerjakan">Sedang dikerjakan</option>
                  <option value="sudah_dikerjakan">Sudah dikerjakan</option>
                </Form.Select>
              </div>

              <div className="col-md-6">
                <Form.Label className="small fw-semibold">Vendor pelaksana</Form.Label>
                <Form.Control value={namaVendor} onChange={(e) => setNamaVendor(e.target.value)} placeholder="Contoh: CV STI" />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-semibold">No. PO / penugasan</Form.Label>
                <Form.Control value={noPo} onChange={(e) => setNoPo(e.target.value)} />
              </div>

              <div className="col-md-6">
                <Form.Label className="small fw-semibold">Keterangan</Form.Label>
                <Form.Control
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Anggaran menggunakan penugasan"
                />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-semibold">Biaya dibayarkan (Rp)</Form.Label>
                <Form.Control type="number" min={0} value={biayaAktual} onChange={(e) => setBiayaAktual(e.target.value)} />
                <Form.Text className="text-muted">Isi jika sudah dibayar. Pekerjaan akan masuk ke tabel &quot;dibayarkan&quot;.</Form.Text>
              </div>
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Bulan</Form.Label>
                <Form.Select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
                  {MONTHS_LONG.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m} {tahun}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Uraian</Form.Label>
                <Form.Control
                  required
                  autoFocus
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                  placeholder="Contoh: Perbaikan dan pemeliharaan crane 10 ton"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-semibold">Nominal (Rp)</Form.Label>
                <Form.Control type="number" min={0} required value={nominal} onChange={(e) => setNominal(e.target.value)} />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          {editItem ? (
            confirmDelete ? (
              <div className="d-flex align-items-center gap-2">
                <Button variant="danger" size="sm" type="button" onClick={handleDelete} disabled={saving}>
                  Ya, hapus data ini
                </Button>
                <Button variant="link" size="sm" type="button" className="text-muted" onClick={() => setConfirmDelete(false)}>
                  Tidak jadi
                </Button>
              </div>
            ) : (
              <Button variant="outline-danger" type="button" onClick={() => setConfirmDelete(true)} disabled={saving}>
                Hapus
              </Button>
            )
          ) : (
            <div />
          )}
          <div className="d-flex gap-2">
            <Button variant="secondary" type="button" onClick={onHide} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
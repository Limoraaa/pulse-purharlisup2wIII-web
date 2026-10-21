'use client';
import { useState } from 'react';
import { Modal, Form, Button, Alert, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import api from 'lib/api';

export type JenisKebutuhan = 'alat' | 'consumable';

export interface KebutuhanItem {
  id: number;
  mesin_produksi_id: number;
  jenis: JenisKebutuhan;
  nama_barang: string;
  jumlah: number;
  satuan: string;
  keterangan: string | null;
}

// Satuan dikelompokkan agar mudah dicari; "Lainnya" untuk satuan di luar daftar
export const SATUAN_GROUPS: { label: string; options: string[] }[] = [
  { label: 'Jumlah', options: ['Pcs', 'Unit', 'Set', 'Buah', 'Pasang', 'Lembar', 'Batang'] },
  { label: 'Kemasan', options: ['Box', 'Pack', 'Dus', 'Roll', 'Botol', 'Kaleng', 'Tube', 'Sak'] },
  { label: 'Berat', options: ['Gram', 'Kg', 'Ons'] },
  { label: 'Volume', options: ['ml', 'Liter', 'Galon'] },
  { label: 'Panjang', options: ['cm', 'Meter'] },
];
const SEMUA_SATUAN = SATUAN_GROUPS.flatMap((g) => g.options);
const SATUAN_LAINNYA = '__lainnya__';

interface FormState {
  jenis: JenisKebutuhan | '';
  nama_barang: string;
  jumlah: string;
  satuan: string;
  satuan_lain: string;
  keterangan: string;
}

const FORM_KOSONG: FormState = { jenis: '', nama_barang: '', jumlah: '1', satuan: '', satuan_lain: '', keterangan: '' };

// Terima koma maupun titik sebagai pemisah desimal ("1,5" / "1.5")
const keAngka = (teks: string) => Number(teks.replace(',', '.'));
const keTeks = (angka: number) => String(Math.round(angka * 100) / 100).replace('.', ',');

interface Props {
  show: boolean;
  onHide: () => void;
  onSaved: (pesan: string) => void;
  mesinId: number | string;
  // Diisi saat mengedit; kosong saat menambah
  item: KebutuhanItem | null;
}

export default function KebutuhanMesinFormModal({ show, onHide, onSaved, mesinId, item }: Props) {
  const [form, setForm] = useState<FormState>(FORM_KOSONG);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Isi ulang form setiap kali modal dibuka
  const handleEnter = () => {
    setErrors({});
    setFormError(null);
    if (!item) {
      setForm(FORM_KOSONG);
      return;
    }
    const satuanDikenal = SEMUA_SATUAN.includes(item.satuan);
    setForm({
      jenis: item.jenis,
      nama_barang: item.nama_barang,
      jumlah: keTeks(item.jumlah),
      satuan: satuanDikenal ? item.satuan : SATUAN_LAINNYA,
      satuan_lain: satuanDikenal ? '' : item.satuan,
      keterangan: item.keterangan ?? '',
    });
  };

  const ubah = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Tombol − / + menambah atau mengurangi 1, tidak bisa kurang dari 1
  const geser = (delta: number) => {
    const sekarang = keAngka(form.jumlah);
    const dasar = Number.isFinite(sekarang) ? sekarang : 0;
    ubah('jumlah', keTeks(Math.max(1, dasar + delta)));
  };

  const validasi = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.jenis) e.jenis = 'Pilih jenis kebutuhan.';
    if (!form.nama_barang.trim()) e.nama_barang = 'Nama barang wajib diisi.';
    const jumlah = keAngka(form.jumlah);
    if (!form.jumlah.trim() || !Number.isFinite(jumlah) || jumlah <= 0) e.jumlah = 'Jumlah harus lebih dari 0.';
    if (!form.satuan) e.satuan = 'Pilih satuan.';
    if (form.satuan === SATUAN_LAINNYA && !form.satuan_lain.trim()) e.satuan_lain = 'Tulis satuannya.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validasi()) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      mesin_produksi_id: Number(mesinId),
      jenis: form.jenis,
      nama_barang: form.nama_barang.trim(),
      jumlah: keAngka(form.jumlah),
      satuan: form.satuan === SATUAN_LAINNYA ? form.satuan_lain.trim() : form.satuan,
      keterangan: form.keterangan.trim() || null,
    };
    try {
      await api(item ? `/kebutuhan-mesin/${item.id}` : '/kebutuhan-mesin', {
        method: item ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      onSaved(item ? 'Kebutuhan berhasil diperbarui.' : 'Kebutuhan berhasil ditambahkan.');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Kebutuhan gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} onEnter={handleEnter} centered backdrop="static" contentClassName="border-0 rounded-4">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton={!saving} className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5">{item ? 'Edit Kebutuhan' : 'Tambah Kebutuhan'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

          <Row className="g-3">
            <Col md={5}>
              <Form.Label className="small fw-semibold">Jenis <span className="text-danger">*</span></Form.Label>
              <Form.Select value={form.jenis} onChange={(e) => ubah('jenis', e.target.value as JenisKebutuhan | '')} isInvalid={!!errors.jenis}>
                <option value="">Pilih jenis...</option>
                <option value="alat">Alat</option>
                <option value="consumable">Consumable</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.jenis}</Form.Control.Feedback>
            </Col>
            <Col md={7}>
              <Form.Label className="small fw-semibold">Nama Barang <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={form.nama_barang}
                onChange={(e) => ubah('nama_barang', e.target.value)}
                placeholder="Contoh: Kunci Pas Set 8–24 mm"
                maxLength={255}
                isInvalid={!!errors.nama_barang}
              />
              <Form.Control.Feedback type="invalid">{errors.nama_barang}</Form.Control.Feedback>
            </Col>

            <Col md={5}>
              <Form.Label className="small fw-semibold">Jumlah <span className="text-danger">*</span></Form.Label>
              <InputGroup hasValidation>
                <Button
                  variant="outline-secondary"
                  onClick={() => geser(-1)}
                  disabled={keAngka(form.jumlah) <= 1}
                  aria-label="Kurangi jumlah"
                  className="d-flex align-items-center"
                >
                  <IconMinus size={16} />
                </Button>
                <Form.Control
                  value={form.jumlah}
                  onChange={(e) => ubah('jumlah', e.target.value.replace(/[^0-9.,]/g, ''))}
                  inputMode="decimal"
                  className="text-center fw-semibold"
                  aria-label="Jumlah"
                  isInvalid={!!errors.jumlah}
                />
                <Button variant="outline-secondary" onClick={() => geser(1)} aria-label="Tambah jumlah" className="d-flex align-items-center">
                  <IconPlus size={16} />
                </Button>
                <Form.Control.Feedback type="invalid">{errors.jumlah}</Form.Control.Feedback>
              </InputGroup>
              <Form.Text className="text-secondary">Boleh desimal, misalnya 1,5</Form.Text>
            </Col>
            <Col md={7}>
              <Form.Label className="small fw-semibold">Satuan <span className="text-danger">*</span></Form.Label>
              <Form.Select value={form.satuan} onChange={(e) => ubah('satuan', e.target.value)} isInvalid={!!errors.satuan}>
                <option value="">Pilih satuan...</option>
                {SATUAN_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map((s) => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
                <option value={SATUAN_LAINNYA}>Lainnya…</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.satuan}</Form.Control.Feedback>
              {form.satuan === SATUAN_LAINNYA && (
                <>
                  <Form.Control
                    className="mt-2"
                    value={form.satuan_lain}
                    onChange={(e) => ubah('satuan_lain', e.target.value)}
                    placeholder="Tulis satuan, misalnya: Ikat"
                    maxLength={30}
                    isInvalid={!!errors.satuan_lain}
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">{errors.satuan_lain}</Form.Control.Feedback>
                </>
              )}
            </Col>

            <Col xs={12}>
              <Form.Label className="small fw-semibold">Keterangan <span className="text-secondary fw-normal">(opsional)</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.keterangan}
                onChange={(e) => ubah('keterangan', e.target.value)}
                placeholder="Contoh: Untuk penggantian chuck saat servis bulanan"
                maxLength={1000}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="border" onClick={onHide} disabled={saving}>Batal</Button>
          <Button type="submit" variant="primary" disabled={saving} className="d-inline-flex align-items-center gap-2">
            {saving && <Spinner animation="border" size="sm" />}
            {item ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';

import { getPemintaListForConsumable, updateOrderConsumable } from '/services/orderConsumableService';

interface OrderConsumableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderData: any;
}

const STATUS_OPTIONS = [
  { value: 'belum dibeli', label: 'Belum Dibeli' },
  { value: 'on progres', label: 'On Progres' },
  { value: 'sudah dibeli', label: 'Sudah Dibeli' },
  { value: 'ditolak', label: 'Ditolak' },
];

export default function OrderConsumableEditModal({ isOpen, onClose, onSuccess, orderData }: OrderConsumableEditModalProps) {
  const [peminjamList, setPeminjamList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    peminta_id: '',
    nama_barang: '',
    merek: '',
    tipe: '',
    er_e: '',
    ukuran: '',
    pekerjaan: '', // <-- TAMBAHAN FIELD PEKERJAAN
    jumlah: 1,
    satuan: 'Pcs',
    status_pembelian: 'belum dibeli',
    tanggal_kedatangan: '',
  });

  useEffect(() => {
    if (isOpen) {
      getPemintaListForConsumable().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setPeminjamList(Array.isArray(data) ? data : []);
      }).catch(console.error);

      if (orderData) {
        setForm({
          peminta_id: orderData.peminta_id || '',
          nama_barang: orderData.nama_barang || '',
          merek: orderData.merek || '',
          tipe: orderData.tipe || '',
          er_e: orderData.er_e || '',
          ukuran: orderData.ukuran || '',
          pekerjaan: orderData.pekerjaan || '', // <-- LOAD DATA PEKERJAAN
          jumlah: orderData.jumlah || 1,
          satuan: orderData.satuan || 'Pcs',
          status_pembelian: orderData.status_pembelian || 'belum dibeli',
          tanggal_kedatangan: orderData.tanggal_kedatangan || '',
        });
      }
    }
  }, [isOpen, orderData]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        peminta_id: form.peminta_id,
        nama_barang: form.nama_barang,
        merek: form.merek || null,
        tipe: form.tipe || null,
        er_e: form.er_e || null,
        ukuran: form.ukuran || null,
        pekerjaan: form.pekerjaan || null, // <-- MASUKKAN KE PAYLOAD EDIT
        jumlah: Number(form.jumlah),
        satuan: form.satuan,
        status_pembelian: form.status_pembelian,
      };

      if (form.status_pembelian === 'sudah dibeli' && form.tanggal_kedatangan) {
        payload.tanggal_kedatangan = form.tanggal_kedatangan;
      }

      await updateOrderConsumable(orderData.id, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Gagal memperbarui data order consumable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static" size="lg" scrollable>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="h5 mb-0">Edit Order Consumable</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <Form id="formEditOrderConsumable" onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Nama Pengusul</Form.Label>
                <Form.Select
                  required
                  value={form.peminta_id}
                  onChange={e => handleChange('peminta_id', e.target.value)}
                >
                  <option value="" disabled>-- Pilih Nama Pengusul --</option>
                  {peminjamList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Nama Barang</Form.Label>
                <Form.Control
                  value={form.nama_barang}
                  onChange={e => handleChange('nama_barang', e.target.value)}
                  placeholder="Nama barang..."
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Merk</Form.Label>
                <Form.Control
                  value={form.merek}
                  onChange={e => handleChange('merek', e.target.value)}
                  placeholder="Merk barang..."
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipe</Form.Label>
                <Form.Control
                  value={form.tipe}
                  onChange={e => handleChange('tipe', e.target.value)}
                  placeholder="Tipe..."
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>ER / E</Form.Label>
                <Form.Control
                  value={form.er_e}
                  onChange={e => handleChange('er_e', e.target.value)}
                  placeholder="ER/E..."
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Ukuran</Form.Label>
                <Form.Control
                  value={form.ukuran}
                  onChange={e => handleChange('ukuran', e.target.value)}
                  placeholder="Ukuran..."
                />
              </Form.Group>
            </Col>

            {/* INPUT PEKERJAAN DI EDIT MODAL */}
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Pekerjaan</Form.Label>
                <Form.Control
                  value={form.pekerjaan}
                  onChange={e => handleChange('pekerjaan', e.target.value)}
                  placeholder="Keterangan pekerjaan..."
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Jumlah</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  required
                  value={form.jumlah}
                  onChange={e => handleChange('jumlah', e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Satuan</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={form.satuan}
                  onChange={e => handleChange('satuan', e.target.value)}
                  placeholder="Cth: Pcs, Kg, Dus"
                />
              </Form.Group>
            </Col>
  
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Status</Form.Label>
                <Form.Select
                  value={form.status_pembelian}
                  onChange={e => handleChange('status_pembelian', e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {form.status_pembelian === 'sudah dibeli' && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Tanggal Kedatangan</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={form.tanggal_kedatangan ? form.tanggal_kedatangan.slice(0, 16) : ''}
                    onChange={e => handleChange('tanggal_kedatangan', e.target.value)}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="outline-secondary" onClick={onClose} disabled={isSubmitting}>Batal</Button>
        <Button variant="primary" type="submit" form="formEditOrderConsumable" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
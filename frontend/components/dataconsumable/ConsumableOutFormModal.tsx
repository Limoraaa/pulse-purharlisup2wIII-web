"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { ConsumableOutFormValues, ConsumableCartItemType } from "types/DataConsumableTypes";

// Format tanggal hari ini (YYYY-MM-DD)
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Struktur awal form (Header Transaksi)
const emptyForm = (): ConsumableOutFormValues => ({
  consumable_id: "MULTIPLE", // Nilai dummy karena kita pakai keranjang (cartItems)
  jumlah: 0,                 // Nilai dummy karena kita pakai keranjang (cartItems)
  tanggal_keluar: getTodayDate(),
  area_pekerjaan: "",
  dipakai_oleh: "",
});

interface ConsumableOutFormModalProps {
  show: boolean;
  onClose: () => void;
  // Saat submit, kita kirim header form DAN list barangnya
  onSubmit: (values: ConsumableOutFormValues, items: ConsumableCartItemType[]) => void;
  cartItems: ConsumableCartItemType[];
}

const ConsumableOutFormModal = ({
  show,
  onClose,
  onSubmit,
  cartItems,
}: ConsumableOutFormModalProps) => {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (show) setForm(emptyForm());
  }, [show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mengirim form data beserta list barang di keranjang
    onSubmit(form, cartItems);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Form Pengambilan Bahan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Tanggal Pemakaian</Form.Label>
              <Form.Control 
                type="date" 
                required
                value={form.tanggal_keluar} 
                onChange={(e) => setForm({...form, tanggal_keluar: e.target.value})} 
              />
            </Col>
            <Col md={12}>
              <Form.Label>Dipakai Oleh (Teknisi/Staff)</Form.Label>
              <Form.Control 
                required 
                placeholder="Nama pemakai" 
                value={form.dipakai_oleh} 
                onChange={(e) => setForm({...form, dipakai_oleh: e.target.value})} 
              />
            </Col>
            <Col md={12}>
              <Form.Label>Area Pekerjaan</Form.Label>
              <Form.Control 
                required 
                placeholder="Contoh: Lab Produksi" 
                value={form.area_pekerjaan} 
                onChange={(e) => setForm({...form, area_pekerjaan: e.target.value})} 
              />
            </Col>
          </Row>

          <div className="mt-4">
            <div className="text-secondary small text-uppercase mb-2">Ringkasan Bahan yang Diambil</div>
            <ul className="list-unstyled mb-0 border rounded p-2">
              {cartItems.map((item) => (
                <li key={item.consumable_id} className="d-flex justify-content-between border-bottom py-2 small">
                  <span className="fw-medium">{item.nama}</span>
                  <span className="text-muted">{item.jumlah} unit</span>
                </li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={cartItems.length === 0}>
            Konfirmasi Pengambilan
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConsumableOutFormModal;
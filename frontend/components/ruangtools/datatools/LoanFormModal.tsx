"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";

// import custom types
import { LoanFormValues, PeminjamType, CartItemType } from "types/DataToolsTypes";

// import required data files
import { PeminjamData } from "data/PeminjamData";

// format tanggal hari ini -> "13 Juli 2026"
const formatToday = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const emptyForm = (): LoanFormValues => ({
  tanggalPeminjaman: formatToday(),
  peminjamId: "",
  namaPeminjam: "",
  divisi: "",
  areaKerja: "",
});

interface LoanFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: LoanFormValues) => void;
  cartItems: CartItemType[];
}

const LoanFormModal = ({
  show,
  onClose,
  onSubmit,
  cartItems,
}: LoanFormModalProps) => {
  const [form, setForm] = useState<LoanFormValues>(emptyForm());

  // reset form & refresh tanggal setiap modal dibuka
  useEffect(() => {
    if (show) {
      setForm(emptyForm());
    }
  }, [show]);

  const handlePeminjamChange = (peminjamId: string) => {
    const selected = PeminjamData.find((p: PeminjamType) => p.id === peminjamId);
    setForm((prev) => ({
      ...prev,
      peminjamId,
      namaPeminjam: selected?.nama || "",
      divisi: selected?.divisi || "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Form Peminjaman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Tanggal Peminjaman</Form.Label>
              <Form.Control value={form.tanggalPeminjaman} disabled readOnly />
              <Form.Text className="text-secondary">
                Otomatis terisi sesuai tanggal hari ini.
              </Form.Text>
            </Col>
            <Col md={12}>
              <Form.Label>Nama Peminjam</Form.Label>
              <Form.Select
                required
                value={form.peminjamId}
                onChange={(e) => handlePeminjamChange(e.target.value)}
              >
                <option value="">-- Pilih Peminjam --</option>
                {PeminjamData.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={12}>
              <Form.Label>Divisi</Form.Label>
              <Form.Control value={form.divisi} disabled readOnly />
              <Form.Text className="text-secondary">
                Otomatis terisi berdasarkan peminjam yang dipilih.
              </Form.Text>
            </Col>
            <Col md={12}>
              <Form.Label>Area Kerja</Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Gardu Induk A"
                value={form.areaKerja}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, areaKerja: e.target.value }))
                }
              />
            </Col>
          </Row>

          <div className="mt-4">
            <div className="text-secondary small text-uppercase mb-2">
              Ringkasan Alat
            </div>
            <ul className="list-unstyled mb-0">
              {cartItems.map((item) => (
                <li
                  key={item.toolId}
                  className="d-flex justify-content-between border-bottom py-2 small"
                >
                  <span>{item.namaBarang}</span>
                  <span className="fw-semibold">{item.jumlah} unit</span>
                </li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={!form.peminjamId}>
            Konfirmasi Peminjaman
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LoanFormModal;

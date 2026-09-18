"use client";
import { useState } from "react";
import { Modal, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import api from "lib/api";

interface MesinFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

export default function MesinFormModal({ show, onHide, onSuccess }: MesinFormModalProps) {
  const [kodeMesin, setKodeMesin] = useState("");
  const [namaMesin, setNamaMesin] = useState("");
  const [lokasiRuang, setLokasiRuang] = useState("");
  const [statusMesin, setStatusMesin] = useState("Aktif");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("token");
      await api("/mesin-produksi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kode_mesin: kodeMesin,
          nama_mesin: namaMesin,
          lokasi_ruang: lokasiRuang,
          status: statusMesin,
        }),
      });

      setKodeMesin("");
      setNamaMesin("");
      setLokasiRuang("");
      setStatusMesin("Aktif");
      onSuccess();
      onHide();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data mesin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Tambah Data Mesin Produksi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Kode Mesin <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: 3MFC1"
                value={kodeMesin}
                onChange={(e) => setKodeMesin(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Nama Mesin <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Mesin CNC Milling 5 Axis"
                value={namaMesin}
                onChange={(e) => setNamaMesin(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Lokasi / Ruang <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: WORKSHOP 2"
                value={lokasiRuang}
                onChange={(e) => setLokasiRuang(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Status <span className="text-danger">*</span></Form.Label>
              <Form.Select value={statusMesin} onChange={(e) => setStatusMesin(e.target.value)}>
                <option value="Aktif">Aktif</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Rusak">Rusak</option>
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : "Simpan Mesin"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
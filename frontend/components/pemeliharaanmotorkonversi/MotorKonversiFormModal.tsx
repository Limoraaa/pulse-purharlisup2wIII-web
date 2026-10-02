"use client";
import { useState } from "react";
import { Modal, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import api from "lib/api";

interface MotorKonversiFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

export function MotorKonversiFormModal({ show, onHide, onSuccess }: MotorKonversiFormModalProps) {
  const [kodeMotor, setKodeMotor] = useState("");
  const [namaMotor, setNamaMotor] = useState("");
  const [merek, setMerek] = useState("");
  const [warna, setWarna] = useState("");
  const [lokasiPenempatan, setLokasiPenempatan] = useState("");
  const [nomorPolisi, setNomorPolisi] = useState("");
  const [statusMotor, setStatusMotor] = useState("Aktif");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("token");
      await api("/motor-konversi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kode_motor: kodeMotor,
          nama_motor: namaMotor,
          merek: merek,
          warna: warna,
          lokasi_penempatan: lokasiPenempatan,
          nomor_polisi: nomorPolisi,
          status: statusMotor,
        }),
      });

      // Reset Form
      setKodeMotor("");
      setNamaMotor("");
      setMerek("");
      setWarna("");
      setLokasiPenempatan("");
      setNomorPolisi("");
      setStatusMotor("Aktif");
      
      onSuccess();
      onHide();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data motor konversi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Tambah Data Motor Konversi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Kode Asset / Motor <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: MK-001"
                value={kodeMotor}
                onChange={(e) => setKodeMotor(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Tipe / Nama Motor <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Honda Beat Electric"
                value={namaMotor}
                onChange={(e) => setNamaMotor(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Merek <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Honda, Yamaha"
                value={merek}
                onChange={(e) => setMerek(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Warna <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Hitam, Merah"
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Plat Nomor <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: D 1234 ABC"
                value={nomorPolisi}
                onChange={(e) => setNomorPolisi(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Lokasi Penempatan <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Workshop UP2W III"
                value={lokasiPenempatan}
                onChange={(e) => setLokasiPenempatan(e.target.value)}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Status <span className="text-danger">*</span></Form.Label>
              <Form.Select value={statusMotor} onChange={(e) => setStatusMotor(e.target.value)}>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : "Simpan Motor"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

MotorKonversiFormModal.displayName = "MotorKonversiFormModal";
"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Alert } from "react-bootstrap";

import { PeminjamType } from "types/DataToolsTypes";

// "aktif" sengaja dikeluarkan -- status aktif/nonaktif diatur lewat
// tombol terpisah (nonaktifkanPeminta/aktifkanPeminta), bukan form ini.
export type PeminjamFormValues = Omit<PeminjamType, "id" | "aktif">;

const emptyForm: PeminjamFormValues = {
  nama: "",
  divisi: "",
};

interface PeminjamFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: PeminjamFormValues) => void;
  initialData?: PeminjamType | null;
  error?: string | null;
}

const PeminjamFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  error = null,
}: PeminjamFormModalProps) => {
  const [form, setForm] = useState<PeminjamFormValues>(emptyForm);
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      setForm(
        initialData
          ? { nama: initialData.nama, divisi: initialData.divisi }
          : emptyForm
      );
    }
  }, [show, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {isEditMode ? "Edit Data Peminjam" : "Tambah Data Peminjam"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Nama Pegawai</Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Ahmad Sobari"
                value={form.nama}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nama: e.target.value }))
                }
              />
            </Col>
            <Col md={12}>
              <Form.Label>Divisi</Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Pemeliharaan Trafo"
                value={form.divisi}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, divisi: e.target.value }))
                }
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit">
            {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PeminjamFormModal;
"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Alert } from "react-bootstrap";
import { IconUser, IconPencil, IconPlus } from "@tabler/icons-react";

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
    <Modal show={show} onHide={onClose} centered className="peminjam-form-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="peminjam-form-title-icon">
              {isEditMode ? <IconPencil size={20} /> : <IconUser size={20} />}
            </span>
            {isEditMode ? "Edit Data Peminjam" : "Tambah Data Peminjam"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {isEditMode && (
            <div className="peminjam-form-hero mb-4">
              <div className="text-secondary small">Sedang mengubah data</div>
              <div className="fw-semibold">
                {initialData?.nama}{" "}
                <span className="text-secondary">({initialData?.divisi})</span>
              </div>
            </div>
          )}

          <div className="peminjam-form-section">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Informasi Pegawai
            </div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>
                  Nama Pegawai <span className="text-danger">*</span>
                </Form.Label>
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
                <Form.Label>
                  Divisi <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  placeholder="Contoh: Pemeliharaan"
                  value={form.divisi}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, divisi: e.target.value }))
                  }
                />
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="d-inline-flex align-items-center gap-2"
          >
            {isEditMode ? <IconPencil size={18} /> : <IconPlus size={18} />}
            {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PeminjamFormModal;
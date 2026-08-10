"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Alert } from "react-bootstrap";
import { IconUser, IconPencil, IconPlus, IconIdBadge2 } from "@tabler/icons-react";

import { PeminjamType } from "types/DataToolsTypes";

// Kita gunakan "id" untuk menyimpan kode RFID dan menambahkan opsi role
export type PeminjamFormValues = Omit<PeminjamType, "id" | "aktif"> & { 
  id?: string;
  role?: "Pekerja" | "inventory man";
};

const emptyForm: PeminjamFormValues = {
  id: "",
  nama: "",
  divisi: "",
  role: "Pekerja",
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
          ? { 
              id: initialData.id, // Ambil ID (RFID/UUID) dari database
              nama: initialData.nama, 
              divisi: initialData.divisi,
              role: initialData.role || "Pekerja", // Masukkan data role
            }
          : emptyForm
      );
    }
  }, [show, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Fungsi khusus untuk menangkap ketikan dari RFID Reader
  const handleRfidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Scanner RFID selalu mengirimkan "Enter" setelah UID selesai dibaca.
    // Kita harus mencegahnya agar form tidak langsung tersubmit.
    if (e.key === "Enter") {
      e.preventDefault();
    }
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

              <Col md={12}>
                <Form.Label>
                  Role Akses <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  required
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ 
                      ...prev, 
                      role: e.target.value as "Pekerja" | "inventory man" 
                    }))
                  }
                >
                  <option value="Pekerja">Pekerja (User Biasa)</option>
                  <option value="inventory man">Inventory Man</option>
                </Form.Select>
                <Form.Text className="text-muted small">
                  Inventory man memiliki hak akses tambahan untuk melakukan input stok Consumable Masuk.
                </Form.Text>
              </Col>

              <Col md={12}>
                <hr className="my-2" />
                <Form.Label className="d-flex align-items-center gap-2 text-primary fw-semibold">
                  <IconIdBadge2 size={18} />
                  ID Kartu RFID
                </Form.Label>
                <Form.Control
                  type="text" // Diubah ke text agar hasil scan langsung terlihat, tidak blank!
                  placeholder={isEditMode ? "Sudah terdaftar" : "Klik di sini, lalu tap kartu ke reader..."}
                  value={form.id}
                  readOnly={isEditMode} // Kalau edit, input ini dimatikan supaya ID utama tidak terubah
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, id: e.target.value }))
                  }
                  onKeyDown={handleRfidKeyDown}
                  autoComplete="off"
                  className={isEditMode ? "bg-light text-muted" : ""} // Beri efek abu-abu kalau mode edit
                />
                {!isEditMode ? (
                   <Form.Text className="text-muted small">
                     Kosongkan jika pegawai belum memiliki kartu, sistem akan membuatkan ID otomatis.
                   </Form.Text>
                ) : (
                   <Form.Text className="text-muted small">
                     ID Kartu RFID tidak dapat diubah setelah pegawai didaftarkan.
                   </Form.Text>
                )}
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
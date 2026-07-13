"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";

// import custom types
import { ToolFormValues, ToolItemType, ToolCondition } from "types/DataToolsTypes";

const KONDISI_OPTIONS: ToolCondition[] = ["Baik", "Rusak Ringan", "Rusak Berat"];

const emptyForm: ToolFormValues = {
  kodeBarang: "",
  namaBarang: "",
  merk: "",
  tipe: "",
  warna: "",
  ukuran: "",
  kondisi: "Baik",
  stok: 0,
  dipinjam: 0,
};

interface ToolFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: ToolFormValues) => void;
  initialData?: ToolItemType | null; // ada isinya = mode Edit, kosong = mode Tambah
}

const ToolFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
}: ToolFormModalProps) => {
  const [form, setForm] = useState<ToolFormValues>(emptyForm);
  const isEditMode = Boolean(initialData);

  // isi ulang form setiap kali modal dibuka, baik untuk Tambah (kosong)
  // maupun Edit (terisi data yang dipilih)
  useEffect(() => {
    if (show) {
      setForm(initialData ? { ...initialData } : emptyForm);
    }
  }, [show, initialData]);

  const handleChange = (
    field: keyof ToolFormValues,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {isEditMode ? "Edit Data Alat" : "Tambah Data Alat"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Kode Barang</Form.Label>
              <Form.Control
                required
                placeholder="Contoh: TL-092-B"
                value={form.kodeBarang}
                onChange={(e) => handleChange("kodeBarang", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Nama Barang</Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Multimeter Digital"
                value={form.namaBarang}
                onChange={(e) => handleChange("namaBarang", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Merk</Form.Label>
              <Form.Control
                required
                value={form.merk}
                onChange={(e) => handleChange("merk", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Tipe</Form.Label>
              <Form.Control
                required
                value={form.tipe}
                onChange={(e) => handleChange("tipe", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Warna</Form.Label>
              <Form.Control
                required
                value={form.warna}
                onChange={(e) => handleChange("warna", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Ukuran</Form.Label>
              <Form.Control
                required
                value={form.ukuran}
                onChange={(e) => handleChange("ukuran", e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Kondisi</Form.Label>
              <Form.Select
                value={form.kondisi}
                onChange={(e) =>
                  handleChange("kondisi", e.target.value as ToolCondition)
                }
              >
                {KONDISI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Stok</Form.Label>
              <Form.Control
                required
                type="number"
                min={0}
                value={form.stok}
                onChange={(e) =>
                  handleChange("stok", Number(e.target.value))
                }
              />
            </Col>
            <Col md={4}>
              <Form.Label>Dipinjam</Form.Label>
              <Form.Control
                required
                type="number"
                min={0}
                max={form.stok}
                value={form.dipinjam}
                onChange={(e) =>
                  handleChange("dipinjam", Number(e.target.value))
                }
              />
              <Form.Text className="text-secondary">
                Tersedia: {Math.max(form.stok - form.dipinjam, 0)}
              </Form.Text>
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

export default ToolFormModal;

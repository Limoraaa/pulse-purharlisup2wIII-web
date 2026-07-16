"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";

// Import tipe data yang sesuai dengan model Consumable
import { ConsumableFormValues, ConsumableItemType } from "types/DataConsumableTypes";

const emptyForm: ConsumableFormValues = {
  kode_barang: "",
  nama: "",
  merk: "",
  tipe: "",
  er_e: "",
  ukuran: "",
  stok_awal: 0,
};

interface ConsumableFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: ConsumableFormValues) => void;
  initialData?: ConsumableItemType | null;
}

const ConsumableToolFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
}: ConsumableFormModalProps) => {
  const [form, setForm] = useState<ConsumableFormValues>(emptyForm);
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      setForm(initialData ? { ...initialData } : emptyForm);
    }
  }, [show, initialData]);

  const handleChange = (
    field: keyof ConsumableFormValues,
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
            {isEditMode ? "Edit Data Consumable" : "Tambah Data Consumable"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Kode Barang <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: CS-001"
                value={form.kode_barang}
                onChange={(e) => handleChange("kode_barang", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Nama Barang <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Baut M8"
                value={form.nama}
                onChange={(e) => handleChange("nama", e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Merk</Form.Label>
              <Form.Control
                value={form.merk}
                onChange={(e) => handleChange("merk", e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Tipe</Form.Label>
              <Form.Control
                value={form.tipe}
                onChange={(e) => handleChange("tipe", e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>ER / E</Form.Label>
              <Form.Control
                value={form.er_e}
                onChange={(e) => handleChange("er_e", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Ukuran</Form.Label>
              <Form.Control
                value={form.ukuran}
                onChange={(e) => handleChange("ukuran", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Stok Awal <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={form.stok_awal === 0 ? "" : String(form.stok_awal)}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                  const withoutLeadingZero = digitsOnly.replace(/^0+(?=\d)/, "");
                  handleChange("stok_awal", withoutLeadingZero === "" ? 0 : Number(withoutLeadingZero));
                }}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit">
            {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConsumableToolFormModal;

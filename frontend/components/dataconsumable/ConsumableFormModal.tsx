"use client";
import { useEffect, useRef, useState } from "react";
import { Modal, Form, Row, Col, Button, Alert } from "react-bootstrap";

import { ConsumableFormValues, ConsumableItemType } from "types/DataConsumableTypes";

const emptyForm: ConsumableFormValues = {
  kode_barang: "",
  nama: "",
  merk: "",
  type: "",
  er_e: "",
  ukuran: "",
  stok_awal: 0,
};

// Cari kode berikutnya berdasarkan pola "PREFIX-angka" yang paling sering dipakai,
// contoh: dari [T-001, T-002, ..., T-029] -> saran berikutnya "T-030"
function suggestNextCode(existingCodes: string[]): string {
  const regex = /^([A-Za-z]+)-(\d+)$/;
  const countByPrefix: Record<string, number> = {};
  const maxByPrefix: Record<string, { num: number; width: number }> = {};

  existingCodes.forEach((code) => {
    const match = code.match(regex);
    if (!match) return;
    const [, prefix, digits] = match;
    const num = parseInt(digits, 10);

    countByPrefix[prefix] = (countByPrefix[prefix] || 0) + 1;

    if (!maxByPrefix[prefix] || num > maxByPrefix[prefix].num) {
      maxByPrefix[prefix] = { num, width: digits.length };
    }
  });

  const topPrefix = Object.keys(countByPrefix).sort(
    (a, b) => countByPrefix[b] - countByPrefix[a]
  )[0];

  if (!topPrefix) return "";

  const { num, width } = maxByPrefix[topPrefix];
  const nextNum = num + 1;
  return `${topPrefix}-${String(nextNum).padStart(width, "0")}`;
}

interface ConsumableFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: ConsumableFormValues) => void;
  initialData?: ConsumableItemType | null;
  error?: string | null;
  existingCodes?: string[];
}

const ConsumableToolFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  error = null,
  existingCodes = [],
}: ConsumableFormModalProps) => {
  const [form, setForm] = useState<ConsumableFormValues>(emptyForm);
  const isEditMode = Boolean(initialData);

  const wasShown = useRef(false);

useEffect(() => {
    if (show && !wasShown.current) {
      // modal baru saja DIBUKA (transisi dari tertutup ke terbuka) -> reset form
      if (initialData) {
        setForm({ ...initialData });
      } else {
        setForm({ ...emptyForm, kode_barang: suggestNextCode(existingCodes) });
      }
    }
    wasShown.current = show;
  }, [show, initialData, existingCodes]);

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
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Kode Barang <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: CS-001"
                value={form.kode_barang}
                onChange={(e) => handleChange("kode_barang", e.target.value)}
              />
              {!isEditMode && (
                <Form.Text className="text-secondary">
                  Saran otomatis berdasarkan kode terakhir, boleh diubah manual.
                </Form.Text>
              )}
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
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
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
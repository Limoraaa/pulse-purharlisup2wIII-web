"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { IconTool, IconPencil, IconPlus } from "@tabler/icons-react";

// import custom types
import { ToolFormValues, ToolItemType, ToolCondition } from "types/DataToolsTypes";

const KONDISI_OPTIONS: ToolCondition[] = ["Baik", "Rusak"];

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
  suggestedKodeBarang?: string; // kode barang otomatis untuk mode Tambah
}

const ToolFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  suggestedKodeBarang,
}: ToolFormModalProps) => {
  const [form, setForm] = useState<ToolFormValues>(emptyForm);
  const isEditMode = Boolean(initialData);

  useEffect(() => {
  if (show) {
    if (initialData) {
      setForm({ ...initialData });
    } else {
      setForm({ ...emptyForm, kodeBarang: suggestedKodeBarang || "" });
    }
  }
}, [show, initialData, suggestedKodeBarang]);

  

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
    <Modal show={show} onHide={onClose} centered size="lg" className="tool-form-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="tool-form-title-icon">
              {isEditMode ? <IconPencil size={20} /> : <IconTool size={20} />}
            </span>
            {isEditMode ? "Edit Data Alat" : "Tambah Data Alat"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isEditMode && (
            <div className="tool-form-hero mb-4">
              <div className="text-secondary small">Sedang mengubah data</div>
              <div className="fw-semibold">
                {initialData?.namaBarang}{" "}
                <span className="text-secondary">({initialData?.kodeBarang})</span>
              </div>
            </div>
          )}

          <div className="tool-form-section">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Informasi Alat
            </div>
            <Row className="g-3">
            <Col md={6}>
              <Form.Label>
                Kode Barang <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                placeholder="Contoh: I-092"
                value={form.kodeBarang}
                onChange={(e) => handleChange("kodeBarang", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>
                Nama Barang <span className="text-danger">*</span>
              </Form.Label>
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
                value={form.merk}
                onChange={(e) => handleChange("merk", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Tipe</Form.Label>
              <Form.Control
                value={form.tipe}
                onChange={(e) => handleChange("tipe", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Warna</Form.Label>
              <Form.Control
                value={form.warna}
                onChange={(e) => handleChange("warna", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Ukuran</Form.Label>
              <Form.Control
                value={form.ukuran}
                onChange={(e) => handleChange("ukuran", e.target.value)}
              />
            </Col>

            {/* Kondisi cuma ditampilkan saat Edit — data baru selalu mulai dari "Baik" */}
            {isEditMode ? (
              <Col md={6}>
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
            ) : null}

            <Col md={isEditMode ? 6 : 12}>
              <Form.Label>
                Stok <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={form.stok === 0 ? "" : String(form.stok)}
                onChange={(e) => {
                  // hanya izinkan digit, buang leading zero otomatis
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                  const withoutLeadingZero = digitsOnly.replace(/^0+(?=\d)/, "");
                  handleChange("stok", withoutLeadingZero === "" ? 0 : Number(withoutLeadingZero));
                }}
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
        
export default ToolFormModal;
"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";

// import custom types
import {
  ConsumableItemType,
  ConsumableMasukType,
  ConsumableMasukFormValues,
} from "types/DataConsumableTypes";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const emptyForm = (): ConsumableMasukFormValues => ({
  tanggal: getTodayDate(),
  consumable_id: "",
  kode_barang: "",
  nama: "",
  merk: "",
  tipe: "",
  er_e: "",
  ukuran: "",
  jumlah_masuk: 0,
  keterangan: "",
});

interface ConsumableMasukFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: ConsumableMasukFormValues) => void;
  initialData?: ConsumableMasukType | null; // ada isinya = mode Edit
  consumableOptions: ConsumableItemType[]; // sumber dropdown "Kode Barang", dari Data Consumable
}

const ConsumableMasukFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  consumableOptions,
}: ConsumableMasukFormModalProps) => {
  const [form, setForm] = useState<ConsumableMasukFormValues>(emptyForm());
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      setForm(initialData ? { ...initialData } : emptyForm());
    }
  }, [show, initialData]);

  // pilih barang dari dropdown -> auto-isi Nama, Merk, Tipe, ER/E, Ukuran
  const handleSelectConsumable = (consumableId: string) => {
    const selected = consumableOptions.find((c) => c.id === consumableId);
    setForm((prev) => ({
      ...prev,
      consumable_id: consumableId,
      kode_barang: selected?.kode_barang || "",
      nama: selected?.nama || "",
      merk: selected?.merk || "",
      tipe: selected?.tipe || "",
      er_e: selected?.er_e || "",
      ukuran: selected?.ukuran || "",
    }));
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
            {isEditMode ? "Edit Consumable Masuk" : "Tambah Consumable Masuk"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Tanggal</Form.Label>
              <Form.Control
                type="date"
                required
                value={form.tanggal}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tanggal: e.target.value }))
                }
              />
            </Col>
            <Col md={6}>
              <Form.Label>Kode Barang</Form.Label>
              <Form.Select
                required
                value={form.consumable_id}
                onChange={(e) => handleSelectConsumable(e.target.value)}
                disabled={isEditMode} // kode barang tidak diubah saat edit, cukup jumlah/keterangan
              >
                <option value="">-- Pilih Kode Barang --</option>
                {consumableOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.kode_barang} — {c.nama}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Nama Barang</Form.Label>
              <Form.Control value={form.nama} disabled readOnly />
            </Col>
            <Col md={6}>
              <Form.Label>Merk</Form.Label>
              <Form.Control value={form.merk} disabled readOnly />
            </Col>
            <Col md={4}>
              <Form.Label>Tipe</Form.Label>
              <Form.Control value={form.tipe} disabled readOnly />
            </Col>
            <Col md={4}>
              <Form.Label>ER / E</Form.Label>
              <Form.Control value={form.er_e} disabled readOnly />
            </Col>
            <Col md={4}>
              <Form.Label>Ukuran</Form.Label>
              <Form.Control value={form.ukuran} disabled readOnly />
            </Col>

            <Col md={6}>
              <Form.Label>Jumlah Masuk</Form.Label>
              <Form.Control
                required
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={form.jumlah_masuk === 0 ? "" : String(form.jumlah_masuk)}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                  const withoutLeadingZero = digitsOnly.replace(/^0+(?=\d)/, "");
                  setForm((prev) => ({
                    ...prev,
                    jumlah_masuk:
                      withoutLeadingZero === "" ? 0 : Number(withoutLeadingZero),
                  }));
                }}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Keterangan</Form.Label>
              <Form.Control
                placeholder="Contoh: Pembelian dari Supplier A"
                value={form.keterangan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, keterangan: e.target.value }))
                }
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!form.consumable_id || form.jumlah_masuk <= 0}
          >
            {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConsumableMasukFormModal;

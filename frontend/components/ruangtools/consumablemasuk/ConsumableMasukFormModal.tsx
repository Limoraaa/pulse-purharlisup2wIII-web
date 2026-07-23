"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Alert } from "react-bootstrap";
import { IconTruckDelivery, IconPencil, IconPlus } from "@tabler/icons-react";

// import custom types
import {
  ConsumableItemType,
  ConsumableMasukType,
  ConsumableMasukFormValues,
} from "types/DataConsumableTypes";

// Tampilan "16 Juli 2026, 14:32" dari timestamp ISO
const formatTanggalJam = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const tanggal = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const jam = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${tanggal}, ${jam}`;
};

// Konversi ISO timestamp -> format yang dimengerti <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm", pakai waktu lokal browser)
const toDatetimeLocalValue = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const emptyForm = (): ConsumableMasukFormValues => ({
  tanggal: new Date().toISOString(), // otomatis waktu saat ini (tanggal + jam)
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
  error?: string | null;
}

const ConsumableMasukFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  consumableOptions = [],
  error = null,
}: ConsumableMasukFormModalProps) => {
  const [consumableSearchText, setConsumableSearchText] = useState("");
  const [form, setForm] = useState<ConsumableMasukFormValues>(emptyForm());
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      setForm(initialData ? { ...initialData } : emptyForm());
      setConsumableSearchText("");
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
    <Modal show={show} onHide={onClose} centered size="lg" className="consumablemasuk-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="consumablemasuk-title-icon">
              {isEditMode ? <IconPencil size={20} /> : <IconTruckDelivery size={20} />}
            </span>
            {isEditMode ? "Edit Consumable Masuk" : "Tambah Consumable Masuk"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {isEditMode && (
            <div className="consumablemasuk-hero mb-4">
              <div className="text-secondary small">Sedang mengubah catatan</div>
              <div className="fw-semibold">
                {initialData?.nama}{" "}
                <span className="text-secondary">({initialData?.kode_barang})</span>
              </div>
            </div>
          )}

          <div className="consumablemasuk-section">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Informasi Barang Masuk
            </div>
            <Row className="g-3">
            <Col md={6}>
              <Form.Label>Tanggal</Form.Label>
              {isEditMode ? (
                <>
                  <Form.Control
                    type="datetime-local"
                    required
                    value={toDatetimeLocalValue(form.tanggal)}
                    onChange={(e) => {
                      const local = e.target.value; // "YYYY-MM-DDTHH:mm"
                      if (!local) return;
                      setForm((prev) => ({
                        ...prev,
                        tanggal: new Date(local).toISOString(),
                      }));
                    }}
                  />
                  <Form.Text className="text-secondary">
                    Bisa dikoreksi manual kalau perlu.
                  </Form.Text>
                </>
              ) : (
                <>
                  <Form.Control value={formatTanggalJam(form.tanggal)} disabled readOnly />
                  <Form.Text className="text-secondary">
                    Otomatis terisi sesuai tanggal &amp; jam saat ini.
                  </Form.Text>
                </>
              )}
            </Col>
            <Col md={6}>
              <Form.Label>Kode Barang</Form.Label>
              <Form.Control
                required
                list="consumable-options"
                placeholder="Ketik atau pilih kode barang..."
                disabled={isEditMode}
                value={
                  form.consumable_id
                    ? `${form.kode_barang} — ${form.nama}`
                    : consumableSearchText
                }
                onChange={(e) => {
                  const typed = e.target.value;
                  setConsumableSearchText(typed);

                  // cocokkan ke opsi yang persis sama teksnya (setelah dipilih dari datalist,
                  // browser otomatis isi input dengan value yang sama persis kayak di <option>)
                  const match = consumableOptions.find(
                    (c) => `${c.kode_barang} — ${c.nama}` === typed
                  );
                  if (match) {
                    handleSelectConsumable(match.id);
                  } else {
                    // ketikan belum cocok opsi manapun -> kosongkan pilihan
                    setForm((prev) => ({
                      ...prev,
                      consumable_id: "",
                      kode_barang: "",
                      nama: "",
                      merk: "",
                      tipe: "",
                      er_e: "",
                      ukuran: "",
                    }));
                  }
                }}
              />
              <datalist id="consumable-options">
                {consumableOptions.map((c) => (
                  <option key={c.id} value={`${c.kode_barang} — ${c.nama}`} />
                ))}
              </datalist>
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
                value={form.keterangan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, keterangan: e.target.value }))
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
            disabled={!form.consumable_id || form.jumlah_masuk <= 0}
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

export default ConsumableMasukFormModal;
"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { IconClipboardList, IconCheck } from "@tabler/icons-react";
import { ConsumableOutFormValues, ConsumableCartItemType } from "types/DataConsumableTypes";
import { PeminjamType } from "types/DataToolsTypes";
import { getPeminta } from "services/pemintaService";

const formatToday = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const emptyForm = (): ConsumableOutFormValues => ({
  tanggalPengambilan: formatToday(),
  pemintaId: "",
  namaPeminta: "",
  divisi: "",
  areaKerja: "",
  keterangan: "",
});

interface ConsumableOutFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: ConsumableOutFormValues, items: ConsumableCartItemType[]) => void;
  cartItems: ConsumableCartItemType[];
  submitting?: boolean;
  error?: string | null;
}

const ConsumableOutFormModal = ({
  show,
  onClose,
  onSubmit,
  cartItems,
  submitting = false,
  error = null,
}: ConsumableOutFormModalProps) => {
  const [pemintaSearchText, setPemintaSearchText] = useState("");
  const [form, setForm] = useState<ConsumableOutFormValues>(emptyForm());
  const [pemintaList, setPemintaList] = useState<PeminjamType[]>([]);
  const [loadingPeminta, setLoadingPeminta] = useState(false);

  useEffect(() => {
  if (show) {
    setForm(emptyForm());
    setPemintaSearchText("");
    setLoadingPeminta(true);
    getPeminta()
      .then(setPemintaList)
      .catch(() => setPemintaList([]))
      .finally(() => setLoadingPeminta(false));
  }
}, [show]);

  const handlePemintaChange = (pemintaId: string) => {
    const selected = pemintaList.find((p) => p.id === pemintaId);
    setForm((prev) => ({
      ...prev,
      pemintaId,
      namaPeminta: selected?.nama || "",
      divisi: selected?.divisi || "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, cartItems);
  };

  return (
    <Modal show={show} onHide={submitting ? undefined : onClose} centered size="lg" backdrop={submitting ? "static" : true} className="consumable-out-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="consumable-out-title-icon">
              <IconClipboardList size={20} />
            </span>
            Form Pengambilan Bahan
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Section: Data Pemakai */}
          <div className="consumable-out-section mb-4">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Data Pemakai
            </div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Tanggal Pengambilan</Form.Label>
                <Form.Control value={form.tanggalPengambilan} disabled readOnly />
                <Form.Text className="text-secondary">
                  Otomatis terisi sesuai tanggal &amp; jam saat ini.
                </Form.Text>
              </Col>
              <Col md={6}>
                <Form.Label>
                  Dipakai Oleh (Teknisi/Staff) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  list="peminta-options"
                  placeholder={loadingPeminta ? "Memuat..." : "Ketik atau pilih nama pemakai..."}
                  disabled={loadingPeminta}
                  value={form.pemintaId ? form.namaPeminta : pemintaSearchText}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setPemintaSearchText(typed);

                    const match = pemintaList.find((p) => p.nama === typed);
                    if (match) {
                      handlePemintaChange(match.id);
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        pemintaId: "",
                        namaPeminta: "",
                        divisi: "",
                      }));
                    }
                  }}
                />
                <datalist id="peminta-options">
                  {pemintaList.map((p) => (
                    <option key={p.id} value={p.nama} />
                  ))}
                </datalist>
              </Col>
              <Col md={6}>
                <Form.Label>Divisi</Form.Label>
                <Form.Control value={form.divisi} disabled readOnly />
                <Form.Text className="text-secondary">
                  Otomatis terisi berdasarkan pemakai.
                </Form.Text>
              </Col>
            </Row>
          </div>

          {/* Section: Detail Pekerjaan */}
          <div className="consumable-out-section mb-4">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Detail Pekerjaan
            </div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>
                  Area Pekerjaan <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  placeholder="Contoh: Lab Produksi"
                  value={form.areaKerja}
                  onChange={(e) => setForm((prev) => ({ ...prev, areaKerja: e.target.value }))}
                  disabled={submitting}
                />
              </Col>
              <Col md={12}>
                <Form.Label>
                  Keterangan <span className="text-secondary fw-normal">(opsional)</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Catatan tambahan jika ada"
                  value={form.keterangan}
                  onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                  disabled={submitting}
                />
              </Col>
            </Row>
          </div>

          {/* Section: Ringkasan Bahan */}
          <div className="consumable-out-summary">
            <div className="text-secondary small text-uppercase fw-semibold mb-2">
              Ringkasan Bahan yang Diambil
            </div>
            <ul className="list-unstyled mb-0 consumable-out-summary-list">
              {cartItems.map((item) => (
                <li key={item.consumable_id} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small">
                  <span className="fw-medium">{item.nama}</span>
                  <span className="fw-semibold">{item.jumlah} unit</span>
                </li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={cartItems.length === 0 || !form.pemintaId || submitting}
            className="d-inline-flex align-items-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" />
                Memproses...
              </>
            ) : (
              <>
                <IconCheck size={18} />
                Konfirmasi Pengambilan
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConsumableOutFormModal;
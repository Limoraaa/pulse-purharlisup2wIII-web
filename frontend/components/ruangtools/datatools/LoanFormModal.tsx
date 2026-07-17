"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";

import { LoanFormValues, PeminjamType, CartItemType } from "types/DataToolsTypes";
import { getPeminta } from "services/pemintaService";

const formatToday = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const emptyForm = (): LoanFormValues => ({
  tanggalPeminjaman: formatToday(),
  peminjamId: "",
  namaPeminjam: "",
  divisi: "",
  areaKerja: "",
  spesifikasi: "",
  keterangan: "",
});

interface LoanFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: LoanFormValues) => void;
  cartItems: CartItemType[];
  submitting?: boolean; // ← tambahan baru
}

const LoanFormModal = ({
  show,
  onClose,
  onSubmit,
  cartItems,
  submitting = false,
}: LoanFormModalProps) => {
  const [peminjamSearchText, setPeminjamSearchText] = useState("");
  const [form, setForm] = useState<LoanFormValues>(emptyForm());
  const [peminjamList, setPeminjamList] = useState<PeminjamType[]>([]);
  const [loadingPeminjam, setLoadingPeminjam] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(emptyForm());
      setPeminjamSearchText("");
      setLoadingPeminjam(true);
      getPeminta()
        .then(setPeminjamList)
        .catch(() => setPeminjamList([]))
        .finally(() => setLoadingPeminjam(false));
    }
  }, [show]);

  const handlePeminjamChange = (peminjamId: string) => {
    const selected = peminjamList.find((p) => p.id === peminjamId);
    setForm((prev) => ({
      ...prev,
      peminjamId,
      namaPeminjam: selected?.nama || "",
      divisi: selected?.divisi || "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={submitting ? undefined : onClose} centered backdrop={submitting ? "static" : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title as="h5">Form Peminjaman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Tanggal Peminjaman</Form.Label>
              <Form.Control value={form.tanggalPeminjaman} disabled readOnly />
              <Form.Text className="text-secondary">
                Otomatis terisi sesuai tanggal &amp; jam saat ini.
              </Form.Text>
            </Col>
            <Col md={12}>
              <Form.Label>Nama Peminjam</Form.Label>
              <Form.Control
                required
                list="peminjam-options"
                placeholder={loadingPeminjam ? "Memuat..." : "Ketik atau pilih nama peminjam..."}
                disabled={loadingPeminjam}
                value={form.peminjamId ? form.namaPeminjam : peminjamSearchText}
                onChange={(e) => {
                  const typed = e.target.value;
                  setPeminjamSearchText(typed);

                  const match = peminjamList.find((p) => p.nama === typed);
                  if (match) {
                    handlePeminjamChange(match.id);
                  } else {
                    setForm((prev) => ({
                      ...prev,
                      peminjamId: "",
                      namaPeminjam: "",
                      divisi: "",
                    }));
                  }
                }}
              />
              <datalist id="peminjam-options">
                {peminjamList.map((p) => (
                  <option key={p.id} value={p.nama} />
                ))}
              </datalist>
            </Col>
            <Col md={12}>
              <Form.Label>Divisi</Form.Label>
              <Form.Control value={form.divisi} disabled readOnly />
              <Form.Text className="text-secondary">
                Otomatis terisi berdasarkan peminjam yang dipilih.
              </Form.Text>
            </Col>
            <Col md={12}>
              <Form.Label>Area Kerja</Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Gardu Induk A"
                value={form.areaKerja}
                onChange={(e) => setForm((prev) => ({ ...prev, areaKerja: e.target.value }))}
                disabled={submitting}
              />
            </Col>
            <Col md={12}>
              <Form.Label>
                Spesifikasi <span className="text-secondary fw-normal">(opsional)</span>
              </Form.Label>
              <Form.Control
                value={form.spesifikasi}
                onChange={(e) => setForm((prev) => ({ ...prev, spesifikasi: e.target.value }))}
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

          <div className="mt-4">
            <div className="text-secondary small text-uppercase mb-2">Ringkasan Alat</div>
            <ul className="list-unstyled mb-0">
              {cartItems.map((item) => (
                <li key={item.toolId} className="d-flex justify-content-between border-bottom py-2 small">
                  <span>{item.namaBarang}</span>
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
          <Button variant="primary" type="submit" disabled={!form.peminjamId || submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Memproses...
              </>
            ) : (
              "Konfirmasi Peminjaman"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LoanFormModal;
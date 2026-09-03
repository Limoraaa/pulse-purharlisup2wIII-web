"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { IconClipboardList, IconCheck } from "@tabler/icons-react";

import { PeminjamType } from "types/DataToolsTypes";
import { getPemintaAktif } from "services/pemintaService";
// Jika Anda memiliki service untuk pekerjaan, Anda bisa mengimpornya di sini.
// import { getPekerjaanAktif } from "services/pekerjaanService";

const formatToday = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export interface UniversalFormValues {
  tanggalPeminjaman?: string;
  tanggalPengambilan?: string;
  peminjamId?: string;
  pemintaId?: string;
  namaPeminjam?: string;
  namaPeminta?: string;
  divisi: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi?: string;
  keterangan: string;
}

const emptyForm = (): UniversalFormValues => ({
  tanggalPeminjaman: formatToday(),
  peminjamId: "",
  namaPeminjam: "",
  divisi: "",
  namaPekerjaan: "",
  areaKerja: "",
  spesifikasi: "",
  keterangan: "",
});

interface LoanFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: UniversalFormValues) => void;
  cartItems: any[];
  submitting?: boolean;
  error?: string | null;
}

const LoanFormModal = ({
  show,
  onClose,
  onSubmit,
  cartItems,
  submitting = false,
  error = null,
}: LoanFormModalProps) => {
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState<UniversalFormValues>(emptyForm());
  
  const [peminjamList, setPeminjamList] = useState<PeminjamType[]>([]);
  const [loadingPeminjam, setLoadingPeminjam] = useState(false);

  // State untuk Data Pekerjaan
  const [pekerjaanList, setPekerjaanList] = useState<any[]>([]);
  const [loadingPekerjaan, setLoadingPekerjaan] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(emptyForm());
      setSearchText("");
      
      // Fetch Peminta
      setLoadingPeminjam(true);
      getPemintaAktif()
        .then(setPeminjamList)
        .catch(() => setPeminjamList([]))
        .finally(() => setLoadingPeminjam(false));

      // Fetch Pekerjaan Aktif
      setLoadingPekerjaan(true);
      // Ganti URL ini dengan konfigurasi API / axios instance Anda jika diperlukan
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      fetch(`${apiUrl}/pekerjaan/active`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPekerjaanList(data.data);
          }
        })
        .catch((err) => console.error("Gagal memuat data pekerjaan:", err))
        .finally(() => setLoadingPekerjaan(false));
    }
  }, [show]);

  const handleSelectPeminjam = (id: string) => {
    const selected = peminjamList.find((p) => p.id === id);
    setForm((prev) => ({
      ...prev,
      peminjamId: id,
      pemintaId: id, // Mapping ganda untuk support kedua tipe manager
      namaPeminjam: selected?.nama || "",
      namaPeminta: selected?.nama || "",
      divisi: selected?.divisi || "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <Modal show={show} onHide={submitting ? undefined : onClose} centered size="lg" backdrop={submitting ? "static" : true} className="loan-form-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="loan-form-title-icon">
              <IconClipboardList size={20} />
            </span>
            Form Peminjaman &amp; Pengambilan Inventaris
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Section: Data Peminjam / Pemakai */}
          <div className="loan-form-section mb-4">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Data Peminjam / Pemakai
            </div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Tanggal Transaksi</Form.Label>
                <Form.Control value={form.tanggalPeminjaman} disabled readOnly />
                <Form.Text className="text-secondary">
                  Otomatis terisi sesuai tanggal &amp; jam saat ini.
                </Form.Text>
              </Col>
              
              <Col md={6}>
                <Form.Label>
                  Nama Peminjam / Tap Kartu RFID <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  list="peminjam-options"
                  placeholder={loadingPeminjam ? "Memuat..." : "Ketik nama atau tap kartu RFID di sini..."}
                  disabled={loadingPeminjam || submitting}
                  value={form.peminjamId ? `${form.namaPeminjam} (${form.peminjamId})` : searchText}
                  onFocus={() => {
                    if (form.peminjamId) {
                      setSearchText("");
                      setForm((prev) => ({ ...prev, peminjamId: "", pemintaId: "", namaPeminjam: "", namaPeminta: "", divisi: "" }));
                    }
                  }}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setSearchText(typed);

                    const match = peminjamList.find(
                      (p) => 
                        p.nama.toLowerCase() === typed.toLowerCase() || 
                        p.id.toLowerCase() === typed.toLowerCase()
                    );

                    if (match) {
                      handleSelectPeminjam(match.id);
                      setSearchText("");
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        peminjamId: "",
                        pemintaId: "",
                        namaPeminjam: "",
                        namaPeminta: "",
                        divisi: "",
                      }));
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                <datalist id="peminjam-options">
                  {peminjamList.map((p) => (
                    <option key={p.id} value={p.nama}>
                      {`Divisi: ${p.divisi} | RFID: ${p.id}`}
                    </option>
                  ))}
                </datalist>
                <Form.Text className="text-muted small">
                  Silakan ketik nama manual, pilih dari dropdown, atau langsung tap kartu RFID.
                </Form.Text>
              </Col>

              <Col md={6}>
                <Form.Label>Divisi</Form.Label>
                <Form.Control value={form.divisi} disabled readOnly placeholder="Otomatis terisi..." />
                <Form.Text className="text-secondary">
                  Otomatis terisi berdasarkan peminjam.
                </Form.Text>
              </Col>
            </Row>
          </div>

          {/* Section: Detail Pekerjaan */}
          <div className="loan-form-section mb-4">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Detail Pekerjaan
            </div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>
                  Nama Pekerjaan <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  list="pekerjaan-options"
                  placeholder={loadingPekerjaan ? "Memuat..." : "Ketik atau pilih nama pekerjaan..."}
                  value={form.namaPekerjaan}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaPekerjaan: e.target.value }))}
                  disabled={loadingPekerjaan || submitting}
                  autoComplete="off"
                />
                <datalist id="pekerjaan-options">
                  {pekerjaanList.map((pek) => (
                    <option key={pek.id} value={pek.nama_pekerjaan} />
                  ))}
                </datalist>
                <Form.Text className="text-muted small">
                  Silakan ketik nama manual atau pilih dari dropdown pekerjaan aktif.
                </Form.Text>
              </Col>
              <Col md={12}>
                <Form.Label>
                  Area Kerja <span className="text-secondary fw-normal">(opsional)</span>
                </Form.Label>
                <Form.Select
                  value={form.areaKerja}
                  onChange={(e) => setForm((prev) => ({ ...prev, areaKerja: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="">Pilih area kerja...</option>
                  <option value="W2 Konvensional">W2 Konvensional</option>
                  <option value="W2 CNC">W2 CNC</option>
                  <option value="W3">W3</option>
                  <option value="W4">W4</option>
                  <option value="BU">BU</option>
                </Form.Select>
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

          {/* Section: Ringkasan Item */}
          <div className="loan-form-summary">
            <div className="text-secondary small text-uppercase fw-semibold mb-2">
              Ringkasan Item Dipilih ({cartItems.length} jenis)
            </div>
            <ul className="list-unstyled mb-0 loan-summary-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {cartItems.map((item, index) => {
                const displayName = item.namaBarang || item.nama || "Nama Barang Tidak Diketahui";
                const displayCode = item.kodeBarang || item.kode_barang || "";
                const uniqueKey = item.toolId || item.consumable_id || item.cartId || item.id || index;

                return (
                  <li key={uniqueKey} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom">
                    <div className="d-flex flex-column">
                      <span className="fw-semibold">{displayName}</span>
                      {displayCode && <span className="text-secondary" style={{ fontSize: "11px" }}>{displayCode}</span>}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {item.item_type && (
                        <span className={`badge bg-${item.item_type === 'tool' ? 'info' : 'warning'} text-dark`} style={{ fontSize: '9px' }}>
                          {item.item_type.toUpperCase()}
                        </span>
                      )}
                      <span className="fw-semibold">{item.jumlah || item.qty} unit</span>
                    </div>
                  </li>
                );
              })}
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
            disabled={!form.peminjamId || submitting || cartItems.length === 0}
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
                Konfirmasi Transaksi
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LoanFormModal;
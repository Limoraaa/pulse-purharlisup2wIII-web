"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Alert } from "react-bootstrap";
import { IconTruckDelivery, IconPencil, IconPlus } from "@tabler/icons-react";

// import custom types
import { ToolItemType } from "types/DataToolsTypes";
import { ToolMasukType, ToolMasukFormValues } from "types/DataToolsTypes";

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
const toDatetimeLocalValue = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const emptyForm = (): ToolMasukFormValues => ({
  tanggal: new Date().toISOString(),
  tool_id: "",
  kode_barang: "",
  nama_barang: "",
  merk: "",
  tipe: "",
  warna: "",
  ukuran: "",
  jumlah_masuk: 0,
  keterangan: "",
  id_card: "",
});

interface ToolMasukFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: ToolMasukFormValues & { peminta_id?: string }) => void;
  initialData?: ToolMasukType | null;
  toolOptions: ToolItemType[];
  error?: string | null;
}

const ToolMasukFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  toolOptions = [],
  error = null,
}: ToolMasukFormModalProps) => {
  const [toolSearchText, setToolSearchText] = useState("");
  const [form, setForm] = useState<ToolMasukFormValues>(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false); // Pengaman double submit dari scanner
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      setForm(initialData ? { ...initialData, id_card: "" } : emptyForm());
      setToolSearchText("");
      setIsSubmitting(false);
    }
  }, [show, initialData]);

  // Pilih alat dari dropdown -> auto-isi atribut
    const [selectedTool, setSelectedTool] = useState<ToolItemType | null>(null);

  // Pilih alat dari dropdown -> auto-isi atribut
  const handleSelectTool = (toolId: string) => {
    const selected = toolOptions.find((t) => t.id === toolId);
    setSelectedTool(selected || null);
    setForm((prev) => ({
      ...prev,
      tool_id: toolId,
      kode_barang: selected?.kodeBarang || "",
      nama_barang: selected?.namaBarang || "",
      merk: selected?.merk || "",
      tipe: selected?.tipe || "",
      warna: selected?.warna || "",
      ukuran: selected?.ukuran || "",
    }));
  };

  const isMesinStokPenuh = selectedTool?.kategori === "mesin" && selectedTool.stok >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Mencegah proses dobel jalan bersamaan

    setIsSubmitting(true);
    try {
      // Mengirim data dengan memetakan id_card ke peminta_id agar diterima backend
      await onSubmit({
        ...form,
        peminta_id: form.id_card,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="toolsmasuk-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="toolsmasuk-title-icon">
              {isEditMode ? <IconPencil size={20} /> : <IconTruckDelivery size={20} />}
            </span>
            {isEditMode ? "Edit Tools Masuk" : "Tambah Tools Masuk"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {isMesinStokPenuh && (
            <Alert variant="warning">
              Alat ini berkategori Mesin dan stoknya sudah 1 (penuh). Mesin dicatat 1 kode = 1 unit fisik, jadi tidak bisa direstock lagi lewat kode yang sama.
            </Alert>
          )}

          {isEditMode && (
            <div className="toolsmasuk-hero mb-4">
              <div className="text-secondary small">Sedang mengubah catatan</div>
              <div className="fw-semibold">
                {initialData?.nama_barang}{" "}
                <span className="text-secondary">({initialData?.kode_barang})</span>
              </div>
            </div>
          )}

          <div className="toolsmasuk-section">
            <div className="text-secondary small text-uppercase fw-semibold mb-3">
              Informasi Alat Masuk
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
                        const local = e.target.value;
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
                  list="tool-options"
                  placeholder="Ketik atau pilih kode barang..."
                  disabled={isEditMode}
                  value={
                    form.tool_id
                      ? `${form.kode_barang} — ${form.nama_barang}`
                      : toolSearchText
                  }
                  onChange={(e) => {
                    const typed = e.target.value;
                    setToolSearchText(typed);

                    const match = toolOptions.find(
                      (t) => `${t.kodeBarang} — ${t.namaBarang}` === typed
                    );
                    if (match) {
                      handleSelectTool(match.id);
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        tool_id: "",
                        kode_barang: "",
                        nama_barang: "",
                        merk: "",
                        tipe: "",
                        warna: "",
                        ukuran: "",
                      }));
                    }
                  }}
                />
                <datalist id="tool-options">
                  {toolOptions.map((t) => (
                    <option key={t.id} value={`${t.kodeBarang} — ${t.namaBarang}`} />
                  ))}
                </datalist>
              </Col>

              <Col md={6}>
                <Form.Label>Nama Barang</Form.Label>
                <Form.Control value={form.nama_barang} disabled readOnly />
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
                <Form.Label>Warna</Form.Label>
                <Form.Control value={form.warna} disabled readOnly />
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

            {/* Input Otorisasi ID Card / RFID */}
            <div className="mt-4 border-top pt-3">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Otorisasi ID Card <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Tap ID Card Anda disini..."
                  value={form.id_card || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, id_card: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    // Mencegah form tersubmit otomatis dua kali saat scanner mengirim tombol Enter
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  required
                  autoFocus
                />
                <Form.Text className="text-muted">
                  Wajib melakukan tap ID Card untuk memverifikasi penambahan data.
                </Form.Text>
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!form.tool_id || form.jumlah_masuk <= 0 || !form.id_card || isSubmitting || isMesinStokPenuh}
            className="d-inline-flex align-items-center gap-2"
          >
            {isEditMode ? <IconPencil size={18} /> : <IconPlus size={18} />}
            {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Data"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ToolMasukFormModal;
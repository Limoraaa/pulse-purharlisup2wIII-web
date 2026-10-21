"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Modal, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import { IconPhoto, IconTrash } from "@tabler/icons-react";
import api from "lib/api";

export interface MesinFormData {
  id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  lokasi_ruang: string;
  status: string;
  foto_katalog?: string | null;
}

interface MesinFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  // Diisi saat mode edit; kosong/null untuk tambah mesin baru
  mesin?: MesinFormData | null;
}

const MAKS_FOTO = 2 * 1024 * 1024; // 2MB, sama dengan validasi backend

export default function MesinFormModal({ show, onHide, onSuccess, mesin }: MesinFormModalProps) {
  const isEdit = !!mesin;
  const [kodeMesin, setKodeMesin] = useState("");
  const [namaMesin, setNamaMesin] = useState("");
  const [lokasiRuang, setLokasiRuang] = useState("");
  const [statusMesin, setStatusMesin] = useState("Aktif");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  // Edit: foto lama dihapus tanpa diganti
  const [hapusFoto, setHapusFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Isi ulang form setiap modal dibuka (kosong untuk tambah, data mesin untuk edit)
  const handleEnter = () => {
    setKodeMesin(mesin?.kode_mesin ?? "");
    setNamaMesin(mesin?.nama_mesin ?? "");
    setLokasiRuang(mesin?.lokasi_ruang ?? "");
    setStatusMesin(mesin?.status ?? "Aktif");
    setFotoFile(null);
    setFotoPreview(mesin?.foto_katalog ?? null);
    setHapusFoto(false);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Foto harus berformat JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAKS_FOTO) {
      setFormError("Ukuran foto maksimal 2 MB.");
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    setHapusFoto(false);
    setFormError(null);
  };

  const handleRemovePhoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    setHapusFoto(isEdit && !!mesin?.foto_katalog);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Gunakan FormData agar file gambar bisa terkirim ke backend Laravel
    const formData = new FormData();
    formData.append("kode_mesin", kodeMesin);
    formData.append("nama_mesin", namaMesin);
    formData.append("lokasi_ruang", lokasiRuang);
    formData.append("status", statusMesin);
    if (fotoFile) formData.append("foto_katalog", fotoFile);
    if (hapusFoto) formData.append("hapus_foto", "1");
    // PHP tidak membaca file pada request PUT, jadi edit dikirim sebagai POST + _method=PUT
    if (isEdit) formData.append("_method", "PUT");

    try {
      await api(isEdit ? `/mesin-produksi/${mesin!.id}` : "/mesin-produksi", { method: "POST", body: formData });
      onSuccess();
      onHide();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data mesin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} onEnter={handleEnter} centered size="lg" backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">{isEdit ? "Edit Data Mesin Produksi" : "Tambah Data Mesin Produksi"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Row className="g-3">
            {/* Upload & preview foto katalog */}
            <Col md={12}>
              <Form.Label>Foto Katalog Mesin <span className="text-muted small">(Opsional)</span></Form.Label>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div
                  className="position-relative rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                  style={{ width: "160px", height: "120px" }}
                >
                  {fotoPreview ? (
                    <Image src={fotoPreview} alt="Preview foto mesin" fill sizes="160px" style={{ objectFit: "contain", padding: "4px" }} />
                  ) : (
                    <div className="text-muted text-center p-2">
                      <IconPhoto size={32} className="opacity-50" />
                      <div className="small">Belum ada foto</div>
                    </div>
                  )}
                </div>
                <div className="d-flex flex-column gap-1">
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">Format: JPG, PNG, WEBP. Maksimal 2 MB.</Form.Text>
                  {fotoPreview && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="align-self-start d-flex align-items-center gap-1"
                      onClick={handleRemovePhoto}
                    >
                      <IconTrash size={14} /> Hapus Foto
                    </Button>
                  )}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <Form.Label>Kode Mesin <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: IK.061.UP3"
                value={kodeMesin}
                onChange={(e) => setKodeMesin(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Nama Mesin <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Mesin Kompresor (Atlas Copco)"
                value={namaMesin}
                onChange={(e) => setNamaMesin(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Lokasi / Ruang <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required
                placeholder="Contoh: Workshop UP3"
                value={lokasiRuang}
                onChange={(e) => setLokasiRuang(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Status <span className="text-danger">*</span></Form.Label>
              <Form.Select value={statusMesin} onChange={(e) => setStatusMesin(e.target.value)}>
                <option value="Aktif">Aktif</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Rusak">Rusak</option>
                {/* Status "Tidak Aktif" diatur lewat tombol Nonaktifkan; tetap ditampilkan saat mengedit mesin nonaktif */}
                {mesin?.status === "Tidak Aktif" && <option value="Tidak Aktif">Tidak Aktif</option>}
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : isEdit ? "Simpan Perubahan" : "Simpan Mesin"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

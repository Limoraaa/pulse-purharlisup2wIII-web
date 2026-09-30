"use client";
import { useState, useRef } from "react";
import { Modal, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import { IconPlus, IconScooter, IconPhoto, IconTrash } from "@tabler/icons-react";
import Image from "next/image";
import api from "lib/api";

interface MotorKonversiFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

export function MotorKonversiFormModal({ show, onHide, onSuccess }: MotorKonversiFormModalProps) {
  const [kodeMotor, setKodeMotor] = useState("");
  const [namaMotor, setNamaMotor] = useState("");
  const [merek, setMerek] = useState("");
  const [warna, setWarna] = useState("");
  const [lokasiPenempatan, setLokasiPenempatan] = useState("");
  const [nomorPolisi, setNomorPolisi] = useState("");
  const [statusMotor, setStatusMotor] = useState("Aktif");
  
  // State untuk Foto Katalog & Preview
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFormError("File yang diunggah harus berupa gambar (JPG, PNG, WebP).");
        return;
      }
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleRemovePhoto = () => {
    setFotoFile(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setKodeMotor("");
    setNamaMotor("");
    setMerek("");
    setWarna("");
    setLokasiPenempatan("");
    setNomorPolisi("");
    setStatusMotor("Aktif");
    handleRemovePhoto();
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("token");

      // Menggunakan FormData agar file foto bisa terunggah ke backend
      const formData = new FormData();
      formData.append("kode_motor", kodeMotor);
      formData.append("nama_motor", namaMotor);
      formData.append("merek", merek);
      formData.append("warna", warna);
      formData.append("lokasi_penempatan", lokasiPenempatan);
      formData.append("nomor_polisi", nomorPolisi);
      formData.append("status", statusMotor);

      if (fotoFile) {
        formData.append("foto_katalog", fotoFile);
      }

      await api("/motor-konversi", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Jangan letakkan Content-Type 'application/json' agar browser mengatur boundary multipart/form-data
        },
        body: formData,
      });

      resetForm();
      onSuccess();
      onHide();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data motor konversi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="py-2 px-3 bg-body-tertiary">
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2 text-body">
            <IconScooter size={18} className="text-primary" />
            Tambah Data Motor Konversi
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-3 bg-body">
          {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
          
          <Row className="g-3">
            {/* Area Upload & Preview Foto */}
            <Col md={12}>
              <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                Foto Katalog Motor (Untuk Peta Part / Checklist Visual)
              </Form.Label>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div 
                  className="position-relative rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                  style={{ width: "130px", height: "95px" }}
                >
                  {fotoPreview ? (
                    <Image 
                      src={fotoPreview} 
                      alt="Preview Foto" 
                      fill 
                      sizes="130px"
                      style={{ objectFit: "contain", padding: "4px" }} 
                    />
                  ) : (
                    <div className="text-muted text-center p-2">
                      <IconPhoto size={28} className="opacity-50" />
                      <div style={{ fontSize: "0.65rem" }}>Belum ada foto</div>
                    </div>
                  )}
                </div>

                <div className="d-flex flex-column gap-1">
                  <Form.Control
                    ref={fileInputRef}
                    size="sm"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-body text-body"
                    style={{ fontSize: "0.75rem" }}
                  />
                  <div className="text-muted" style={{ fontSize: "0.68rem" }}>
                    Format: JPG, PNG, WEBP (Maksimal 2-5 MB). Disarankan rasio landscape.
                  </div>
                  {fotoPreview && (
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="py-0 px-2 mt-1 align-self-start d-flex align-items-center gap-1"
                      style={{ fontSize: "0.7rem" }}
                      onClick={handleRemovePhoto}
                    >
                      <IconTrash size={12} /> Hapus Foto
                    </Button>
                  )}
                </div>
              </div>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Kode Asset / Motor <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  required
                  placeholder="Contoh: MK-001"
                  value={kodeMotor}
                  onChange={(e) => setKodeMotor(e.target.value)}
                  className="bg-body text-body"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Tipe / Nama Motor <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  required
                  placeholder="Contoh: Honda Beat Electric"
                  value={namaMotor}
                  onChange={(e) => setNamaMotor(e.target.value)}
                  className="bg-body text-body"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Merek <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  required
                  placeholder="Contoh: Honda, Yamaha"
                  value={merek}
                  onChange={(e) => setMerek(e.target.value)}
                  className="bg-body text-body"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Warna <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  required
                  placeholder="Contoh: Hitam, Merah"
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                  className="bg-body text-body"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Plat Nomor <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  required
                  placeholder="Contoh: D 1234 ABC"
                  value={nomorPolisi}
                  onChange={(e) => setNomorPolisi(e.target.value)}
                  className="bg-body text-body"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Lokasi Penempatan <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  required
                  placeholder="Contoh: Workshop Konversi"
                  value={lokasiPenempatan}
                  onChange={(e) => setLokasiPenempatan(e.target.value)}
                  className="bg-body text-body"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                  Status <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select 
  size="sm" 
  value={statusMotor} 
  onChange={(e) => setStatusMotor(e.target.value)}
  className="bg-body text-body"
>
  <option value="Aktif">Aktif</option>
  <option value="Maintenance">Maintenance</option>
  <option value="Rusak">Rusak</option>
</Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        
        <Modal.Footer className="bg-body-tertiary py-2 px-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={isSubmitting}>
            Batal
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="d-flex align-items-center gap-1 fw-semibold px-3">
            {isSubmitting ? <Spinner animation="border" size="sm" /> : <IconPlus size={16} />}
            Simpan Motor
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

MotorKonversiFormModal.displayName = "MotorKonversiFormModal";
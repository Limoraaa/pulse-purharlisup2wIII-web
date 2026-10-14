"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import useSWR from "swr";
import api from "lib/api";
import { KalibrasiItem } from "./KalibrasiManager";

interface KalibrasiFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  editData?: KalibrasiItem | null;
  rencanaId?: number | null; // ID rencana pemeliharaan (jika dari tombol Kerjakan)
  mesinIdDefault?: number | string; // ID mesin bawaan dari halaman detail
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem("token");
  const res = await api<any>(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data || [];
};

const KalibrasiFormModal: React.FC<KalibrasiFormModalProps> = ({ 
  show, 
  onHide, 
  onSuccess, 
  editData, 
  rencanaId, 
  mesinIdDefault 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil data mesin untuk dropdown
  const { data: mesinList } = useSWR("/mesin-produksi", fetcher);

  const [formData, setFormData] = useState({
    mesin_produksi_id: "",
    tanggal_kalibrasi: "",
    tanggal_jatuh_tempo: "",
    nomor_sertifikat: "",
    kalibrator: "",
    hasil_status: "Lulus",
    keterangan: "",
  });
  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);

  useEffect(() => {
    if (show) {
      if (editData) {
        setFormData({
          mesin_produksi_id: editData.mesin_id.toString(),
          tanggal_kalibrasi: editData.tanggal_kalibrasi,
          tanggal_jatuh_tempo: editData.tanggal_jatuh_tempo,
          nomor_sertifikat: editData.nomor_sertifikat,
          kalibrator: editData.kalibrator,
          hasil_status: editData.hasil_status,
          keterangan: editData.keterangan || "",
        });
      } else {
        setFormData({
          mesin_produksi_id: mesinIdDefault ? mesinIdDefault.toString() : "",
          tanggal_kalibrasi: new Date().toISOString().split("T")[0],
          tanggal_jatuh_tempo: "",
          nomor_sertifikat: "",
          kalibrator: "",
          hasil_status: "Lulus",
          keterangan: "",
        });
      }
      setFileSertifikat(null);
      setError(null);
    }
  }, [show, editData, mesinIdDefault]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileSertifikat(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = new FormData();
    payload.append("mesin_produksi_id", formData.mesin_produksi_id);
    payload.append("tanggal_kalibrasi", formData.tanggal_kalibrasi);
    payload.append("tanggal_jatuh_tempo", formData.tanggal_jatuh_tempo);
    payload.append("nomor_sertifikat", formData.nomor_sertifikat);
    payload.append("kalibrator", formData.kalibrator);
    payload.append("hasil_status", formData.hasil_status);
    payload.append("keterangan", formData.keterangan);

    // Bawa ID rencana pemeliharaan agar tersambung ke jadwal
    if (rencanaId) {
      payload.append("rencana_pemeliharaan_id", rencanaId.toString());
    }

    if (fileSertifikat) {
      payload.append("file_sertifikat", fileSertifikat);
    }

    if (editData) {
      payload.append("_method", "PUT");
    }

    try {
      const url = editData ? `/pemeliharaan/kalibrasi/${editData.id}` : "/pemeliharaan/kalibrasi";
      const token = localStorage.getItem("token");
      
      const res = await api<any>(url, {
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` },
        body: payload as any,
      });

      if (res.success) {
        onSuccess();
        onHide();
      } else {
        setError(res.message || "Gagal menyimpan data.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="bg-body-tertiary">
        <Modal.Title className="fs-6 fw-bold">
          {editData ? "Edit Kalibrasi" : (rencanaId ? "Catat Kalibrasi (Dari Jadwal Rencana)" : "Catat Kalibrasi Baru")}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {rencanaId && (
             <Alert variant="info" className="py-2 small mb-3">
               Mencatat kalibrasi ini akan otomatis mengubah status jadwal rencana pemeliharaan menjadi <strong>Selesai</strong>.
             </Alert>
          )}

          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Pilih Mesin Produksi <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  name="mesin_produksi_id" 
                  value={formData.mesin_produksi_id} 
                  onChange={handleChange} 
                  required
                  disabled={!!mesinIdDefault} // Kunci jika sudah spesifik 1 mesin
                >
                  <option value="">-- Pilih Mesin --</option>
                  {mesinList?.map((m: any) => (
                    <option key={m.id} value={m.id}>[{m.kode_mesin}] {m.nama_mesin}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Nomor Sertifikat <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="nomor_sertifikat" value={formData.nomor_sertifikat} onChange={handleChange} required placeholder="Contoh: KAL-2026-001" />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Lembaga / Kalibrator <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="kalibrator" value={formData.kalibrator} onChange={handleChange} required placeholder="Contoh: PT. Kalibrasi Nasional" />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Tanggal Kalibrasi <span className="text-danger">*</span></Form.Label>
                <Form.Control type="date" name="tanggal_kalibrasi" value={formData.tanggal_kalibrasi} onChange={handleChange} required />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Tanggal Jatuh Tempo <span className="text-danger">*</span></Form.Label>
                <Form.Control type="date" name="tanggal_jatuh_tempo" value={formData.tanggal_jatuh_tempo} onChange={handleChange} required />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Status Kelayakan <span className="text-danger">*</span></Form.Label>
                <Form.Select name="hasil_status" value={formData.hasil_status} onChange={handleChange} required>
                  <option value="Lulus">Lulus (Layak Digunakan)</option>
                  <option value="Perlu Penyesuaian">Perlu Penyesuaian (Warning)</option>
                  <option value="Tidak Layak">Tidak Layak</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Upload Sertifikat (PDF/JPG) {editData && "(Opsional)"}</Form.Label>
                <Form.Control type="file" accept=".pdf, .jpg, .jpeg, .png" onChange={handleFileChange} />
                {editData?.file_sertifikat && (
                  <small className="text-success d-block mt-1">Sertifikat sudah ada. Upload baru untuk menimpa.</small>
                )}
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Keterangan Tambahan</Form.Label>
                <Form.Control as="textarea" rows={3} name="keterangan" value={formData.keterangan} onChange={handleChange} placeholder="Catatan penyesuaian kalibrasi jika ada..." />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-body-tertiary">
          <Button variant="outline-secondary" onClick={onHide} disabled={loading}>Batal</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2"/> Menyimpan...</> : "Simpan Kalibrasi"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default KalibrasiFormModal;
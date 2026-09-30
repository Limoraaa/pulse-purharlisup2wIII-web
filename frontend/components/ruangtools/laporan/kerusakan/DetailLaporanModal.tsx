"use client";
// import node module libraries
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <Col md={6}>
    <div className="detail-laporan-item">
      <div className="text-secondary small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">{value || <span className="text-secondary">-</span>}</div>
    </div>
  </Col>
);

interface DetailLaporanModalProps {
  show: boolean;
  onClose: () => void;
  item: LaporanKerusakanType | null;
}

const DetailLaporanModal = ({ show, onClose, item }: DetailLaporanModalProps) => {
  if (!item) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="detail-laporan-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="detail-laporan-title-icon">
            <IconAlertTriangle size={20} />
          </span>
          Detail Laporan Kerusakan
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hero: nama barang + kode + jumlah rusak */}
        <div className="detail-laporan-hero mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h4 className="mb-1">{item.nama_barang}</h4>
              <div className="text-secondary">
                Kode Barang:{" "}
                <span className="fw-semibold text-body">{item.kode_barang}</span>
              </div>
            </div>
            <Badge
              bg={item.status === "selesai_diperbaiki" ? "success-subtle" : "danger-subtle"}
              text={item.status === "selesai_diperbaiki" ? "success-emphasis" : "danger-emphasis"}
              className="detail-laporan-badge d-inline-flex align-items-center gap-1"
            >
              {item.status === "selesai_diperbaiki" ? (
                <IconCircleCheck size={16} />
              ) : (
                <IconAlertTriangle size={16} />
              )}
              {item.jumlah_rusak} unit {item.status === "selesai_diperbaiki" ? "diperbaiki" : "rusak"}
            </Badge>
          </div>
        </div>

        {/* Spesifikasi alat */}
        <div className="detail-laporan-section mb-4">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Spesifikasi Alat
          </div>
          <Row className="g-3">
            <DetailRow label="Merk" value={item.merk} />
            <DetailRow label="Tipe" value={item.tipe} />
            <DetailRow label="Warna" value={item.warna} />
            <DetailRow label="Ukuran" value={item.ukuran} />
          </Row>
        </div>

        {/* Informasi pengembalian */}
        <div className="detail-laporan-section mb-4">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Informasi Pengembalian
          </div>
          <Row className="g-3">
            <DetailRow label="Tgl & Jam Pengembalian" value={item.tanggal_pengembalian} />
            <DetailRow label="Nama Peminjam" value={item.nama_peminjam} />
            <DetailRow label="Divisi" value={item.divisi} />
            <DetailRow label="Nama Pekerjaan" value={item.nama_pekerjaan} />
            <DetailRow label="Area Kerja" value={item.area_kerja} />
          </Row>
        </div>

        {/* Keterangan */}
        <div className="detail-laporan-section">
          <div className="text-secondary small text-uppercase fw-semibold mb-2">
            Keterangan
          </div>
          <p className="mb-0">{item.keterangan || "-"}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DetailLaporanModal;

"use client";
// import node module libraries
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <Col md={6} className="mb-3">
    <div className="text-secondary small text-uppercase">{label}</div>
    <div className="fw-semibold">{value || "-"}</div>
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
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title as="h5">Detail Laporan Kerusakan</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <DetailRow label="Tgl & Jam Pengembalian" value={item.tanggal_pengembalian} />
          <DetailRow
            label="Jumlah Rusak"
            value={
              <Badge bg="danger-subtle" text="danger-emphasis">
                {item.jumlah_rusak}
              </Badge>
            }
          />
          <DetailRow label="Kode Barang" value={item.kode_barang} />
          <DetailRow label="Nama Barang" value={item.nama_barang} />
          <DetailRow label="Merk" value={item.merk} />
          <DetailRow label="Tipe" value={item.tipe} />
          <DetailRow label="Warna" value={item.warna} />
          <DetailRow label="Ukuran" value={item.ukuran} />
          <DetailRow label="Nama Peminjam" value={item.nama_peminjam} />
          <DetailRow label="Divisi" value={item.divisi} />
          <DetailRow label="Area Kerja" value={item.area_kerja} />
        </Row>
        <div className="mt-2">
          <div className="text-secondary small text-uppercase mb-1">
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

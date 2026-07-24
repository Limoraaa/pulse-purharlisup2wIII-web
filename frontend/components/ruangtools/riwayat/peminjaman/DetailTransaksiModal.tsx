"use client";
// import node module libraries
import { Modal, Button, Table, Row, Col, Badge } from "react-bootstrap";
import { IconFileInvoice } from "@tabler/icons-react";

// import custom types
import { RiwayatPeminjamanType } from "types/RiwayatTypes";

interface DetailTransaksiModalProps {
  show: boolean;
  onClose: () => void;
  items: RiwayatPeminjamanType[]; // semua baris dengan nomor_transaksi yang sama
}

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <Col md={6}>
    <div className="detail-transaksi-item">
      <div className="text-secondary small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">{value || <span className="text-secondary">-</span>}</div>
    </div>
  </Col>
);

const DetailTransaksiModal = ({
  show,
  onClose,
  items,
}: DetailTransaksiModalProps) => {
  if (items.length === 0) return null;
  const header = items[0];

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="detail-transaksi-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="detail-transaksi-title-icon">
            <IconFileInvoice size={20} />
          </span>
          Detail Transaksi
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hero: peminjam + jumlah item */}
        <div className="detail-transaksi-hero mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h4 className="mb-1">{header.nama_peminjam}</h4>
              <div className="text-secondary">
                Divisi: <span className="fw-semibold text-body">{header.divisi}</span>
              </div>
            </div>
            <Badge bg="primary-subtle" text="primary-emphasis" className="detail-transaksi-badge">
              {items.length} jenis barang
            </Badge>
          </div>
        </div>

        {/* Informasi transaksi */}
        <div className="detail-transaksi-section mb-4">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Informasi Transaksi
          </div>
          <Row className="g-3">
            <InfoItem label="Area Kerja" value={header.area_kerja} />
            <InfoItem label="Nama Peminjam" value={header.nama_peminjam} />
            <InfoItem label="Tanggal Pinjam" value={header.tanggal_pinjam} />
            <InfoItem label="Tanggal Kembali" value={header.tanggal_kembali} />
          </Row>
        </div>

        {/* Daftar barang */}
        <div className="detail-transaksi-section">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Daftar Barang
          </div>
          <div className="table-responsive">
            <Table size="sm" className="align-middle detail-transaksi-table mb-0">
              <thead>
                <tr>
                  <th>Kode Barang</th>
                  <th>Nama Barang</th>
                  <th>Merk</th>
                  <th>Tipe</th>
                  <th>Warna</th>
                  <th>Ukuran</th>
                  <th className="text-center">Jumlah</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.kode_barang}</td>
                    <td>{item.nama_barang}</td>
                    <td>{item.merk}</td>
                    <td>{item.tipe}</td>
                    <td>{item.warna}</td>
                    <td>{item.ukuran}</td>
                    <td className="text-center">{item.jumlah}</td>
                    <td className="text-secondary small">
                      {item.keterangan || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
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

export default DetailTransaksiModal;

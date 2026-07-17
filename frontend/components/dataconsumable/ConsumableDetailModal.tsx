"use client";
// import node module libraries
import { Modal, Button, Row, Col } from "react-bootstrap";

// import custom types
import { ConsumableItemType } from "types/DataConsumableTypes";

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

interface ConsumableDetailModalProps {
  show: boolean;
  onClose: () => void;
  consumable: ConsumableItemType | null;
}

const ConsumableDetailModal = ({ show, onClose, consumable }: ConsumableDetailModalProps) => {
  if (!consumable) return null;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Detail Consumable</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <DetailRow label="Kode Barang" value={consumable.kode_barang} />
          <DetailRow label="Nama Barang" value={consumable.nama} />
          <DetailRow label="Merk" value={consumable.merk} />
          <DetailRow label="Tipe" value={consumable.type} />
          <DetailRow label="ER / E" value={consumable.er_e} />
          <DetailRow label="Ukuran" value={consumable.ukuran} />
          <DetailRow
            label="Stok Tersedia"
            value={<span className="text-blue-600 fw-bold">{consumable.stok_awal}</span>}
          />
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConsumableDetailModal;
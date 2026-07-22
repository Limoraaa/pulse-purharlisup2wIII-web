"use client";
// import node module libraries
import { Modal, Button, Badge, Row, Col } from "react-bootstrap";
import {
  IconPackage,
  IconCircleCheck,
  IconAlertTriangle,
  IconBoxSeam,
} from "@tabler/icons-react";

// import custom types
import { ConsumableItemType } from "types/DataConsumableTypes";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
  <Col md={6}>
    <div className="consumable-detail-item">
      <div className="text-secondary small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">
        {value || <span className="text-secondary">-</span>}
      </div>
    </div>
  </Col>
);

interface ConsumableDetailModalProps {
  show: boolean;
  onClose: () => void;
  consumable: ConsumableItemType | null;
}

const ConsumableDetailModal = ({ show, onClose, consumable }: ConsumableDetailModalProps) => {
  if (!consumable) return null;

  const perluRestock = consumable.stok_awal < 5;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="consumable-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="consumable-detail-title-icon">
            <IconPackage size={20} />
          </span>
          Detail Consumable
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hero: nama barang + kode + status stok */}
        <div className="consumable-detail-hero mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h4 className="mb-1">{consumable.nama}</h4>
              <div className="text-secondary">
                Kode Barang:{" "}
                <span className="fw-semibold text-body">{consumable.kode_barang}</span>
              </div>
            </div>
            <Badge
              bg={perluRestock ? "danger-subtle" : "success-subtle"}
              text={perluRestock ? "danger-emphasis" : "success-emphasis"}
              className="consumable-detail-status d-inline-flex align-items-center gap-1"
            >
              {perluRestock ? (
                <IconAlertTriangle size={16} />
              ) : (
                <IconCircleCheck size={16} />
              )}
              {perluRestock ? "Perlu Restock" : "Stok Cukup"}
            </Badge>
          </div>
        </div>

        {/* Ringkasan stok */}
        <Row className="g-3 mb-4">
          <Col xs={12}>
            <div
              className={`consumable-detail-stat d-flex align-items-center gap-3 bg-${
                perluRestock ? "danger" : "success"
              }-subtle`}
            >
              <div className={`text-${perluRestock ? "danger" : "success"}`}>
                <IconBoxSeam size={28} />
              </div>
              <div>
                <div className="h3 mb-0 lh-1">{consumable.stok_awal}</div>
                <div className="text-secondary small mt-1">Stok Tersedia</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Informasi detail */}
        <div className="consumable-detail-section">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Spesifikasi
          </div>
          <Row className="g-3">
            <DetailRow label="Merk" value={consumable.merk} />
            <DetailRow label="Tipe" value={consumable.tipe} />
            <DetailRow label="ER / E" value={consumable.er_e} />
            <DetailRow label="Ukuran" value={consumable.ukuran} />
          </Row>
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

export default ConsumableDetailModal;

"use client";
// import node module libraries
import { Modal, Button, Badge, Row, Col } from "react-bootstrap";
import {
  IconTool,
  IconCircleCheck,
  IconAlertTriangle,
  IconPackage,
  IconArrowRight,
  IconChecks,
} from "@tabler/icons-react";

// import custom types
import { ToolItemType, ToolCondition } from "types/DataToolsTypes";

const kondisiVariant = (kondisi: ToolCondition) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak":
      return { bg: "danger-subtle", text: "danger-emphasis" };
  }
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <Col md={6}>
    <div className="tool-detail-item">
      <div className="text-secondary small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">{value || <span className="text-secondary">-</span>}</div>
    </div>
  </Col>
);

interface StatBoxProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  variant: "primary" | "warning" | "success" | "danger";
}
const StatBox = ({ label, value, icon, variant }: StatBoxProps) => (
  <Col xs={4}>
    <div className={`tool-detail-stat text-center bg-${variant}-subtle`}>
      <div className={`text-${variant} mb-1 d-flex justify-content-center`}>{icon}</div>
      <div className="h4 mb-0 lh-1">{value}</div>
      <div className="text-secondary small mt-1">{label}</div>
    </div>
  </Col>
);

interface ToolDetailModalProps {
  show: boolean;
  onClose: () => void;
  tool: ToolItemType | null;
}

const ToolDetailModal = ({ show, onClose, tool }: ToolDetailModalProps) => {
  if (!tool) return null;
  const { bg, text } = kondisiVariant(tool.kondisi);
  const tersedia = tool.stok - tool.dipinjam;
  const habis = tersedia <= 0;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="tool-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="tool-detail-title-icon">
            <IconTool size={20} />
          </span>
          Detail Alat
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hero: nama barang + kode + status kondisi */}
        <div className="tool-detail-hero mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h4 className="mb-1">{tool.namaBarang}</h4>
              <div className="text-secondary">
                Kode Barang: <span className="fw-semibold text-body">{tool.kodeBarang}</span>
              </div>
            </div>
            <Badge bg={bg} text={text} className="tool-detail-status d-inline-flex align-items-center gap-1">
              {tool.kondisi === "Baik" ? (
                <IconCircleCheck size={16} />
              ) : (
                <IconAlertTriangle size={16} />
              )}
              {tool.kondisi}
            </Badge>
          </div>
        </div>

        {/* Ringkasan stok */}
        <Row className="g-3 mb-4">
          <StatBox
            label="Total Stok"
            value={tool.stok}
            icon={<IconPackage size={22} />}
            variant="primary"
          />
          <StatBox
            label="Dipinjam"
            value={tool.dipinjam}
            icon={<IconArrowRight size={22} />}
            variant="warning"
          />
          <StatBox
            label="Tersedia"
            value={tersedia}
            icon={<IconChecks size={22} />}
            variant={habis ? "danger" : "success"}
          />
        </Row>

        {/* Informasi detail alat */}
        <div className="tool-detail-section">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Spesifikasi
          </div>
          <Row className="g-3">
            <DetailRow label="Merk" value={tool.merk} />
            <DetailRow label="Tipe" value={tool.tipe} />
            <DetailRow label="Warna" value={tool.warna} />
            <DetailRow label="Ukuran" value={tool.ukuran} />
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

export default ToolDetailModal;

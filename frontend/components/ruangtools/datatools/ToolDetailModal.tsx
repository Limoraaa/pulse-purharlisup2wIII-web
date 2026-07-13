"use client";
// import node module libraries
import { Modal, Button, Badge, Row, Col } from "react-bootstrap";

// import custom types
import { ToolItemType, ToolCondition } from "types/DataToolsTypes";

const kondisiVariant = (kondisi: ToolCondition) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak Ringan":
      return { bg: "warning-subtle", text: "warning-emphasis" };
    case "Rusak Berat":
      return { bg: "danger-subtle", text: "danger-emphasis" };
  }
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <Col md={6} className="mb-3">
    <div className="text-secondary small text-uppercase">{label}</div>
    <div className="fw-semibold">{value}</div>
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

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Detail Alat</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <DetailRow label="Kode Barang" value={tool.kodeBarang} />
          <DetailRow label="Nama Barang" value={tool.namaBarang} />
          <DetailRow label="Merk" value={tool.merk} />
          <DetailRow label="Tipe" value={tool.tipe} />
          <DetailRow label="Warna" value={tool.warna} />
          <DetailRow label="Ukuran" value={tool.ukuran} />
          <DetailRow
            label="Kondisi"
            value={
              <Badge bg={bg} text={text}>
                {tool.kondisi}
              </Badge>
            }
          />
          <DetailRow label="Stok" value={tool.stok} />
          <DetailRow label="Dipinjam" value={tool.dipinjam} />
          <DetailRow
            label="Tersedia"
            value={
              <span className={tersedia <= 0 ? "text-danger" : "text-success"}>
                {tersedia}
              </span>
            }
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

export default ToolDetailModal;

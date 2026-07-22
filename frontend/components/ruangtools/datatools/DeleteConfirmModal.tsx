"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";

// import custom types
import { ToolItemType } from "types/DataToolsTypes";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tool: ToolItemType | null;
}

const DeleteConfirmModal = ({
  show,
  onClose,
  onConfirm,
  tool,
}: DeleteConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered className="tool-delete-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="tool-delete-title-icon">
            <IconTrash size={20} />
          </span>
          Hapus Data
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="tool-delete-icon mb-3">
          <IconAlertTriangle size={32} />
        </div>
        <h5 className="mb-2">Yakin ingin menghapus data ini?</h5>
        <p className="text-secondary mb-3">
          Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="tool-delete-hero">
          <div className="fw-semibold">{tool?.namaBarang}</div>
          <div className="text-secondary small">
            Kode Barang: <span className="fw-semibold text-body">{tool?.kodeBarang}</span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          className="d-inline-flex align-items-center gap-2"
        >
          <IconTrash size={18} />
          Hapus
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;

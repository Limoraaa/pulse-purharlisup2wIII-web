"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";

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
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title as="h6">Hapus Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Yakin ingin menghapus{" "}
        <span className="fw-semibold">{tool?.namaBarang}</span> (
        {tool?.kodeBarang})? Tindakan ini tidak bisa dibatalkan.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>
          Hapus
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;

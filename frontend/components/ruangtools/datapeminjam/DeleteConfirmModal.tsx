"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";

// import custom types
import { PeminjamType } from "types/DataToolsTypes";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  peminjam: PeminjamType | null;
}

const DeleteConfirmModal = ({
  show,
  onClose,
  onConfirm,
  peminjam,
}: DeleteConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title as="h6">Hapus Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Yakin ingin menghapus{" "}
        <span className="fw-semibold">{peminjam?.nama}</span> dari data
        peminjam? Tindakan ini tidak bisa dibatalkan.
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

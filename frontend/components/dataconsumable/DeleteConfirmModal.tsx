"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";

// import custom types
import { ConsumableItemType } from "types/DataConsumableTypes";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  consumable: ConsumableItemType | null;
}

const DeleteConfirmModal = ({
  show,
  onClose,
  onConfirm,
  consumable,
}: DeleteConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title as="h6">Hapus Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Yakin ingin menghapus{" "}
        <span className="fw-semibold">{consumable?.nama}</span> (
        {consumable?.kode_barang})? Tindakan ini tidak bisa dibatalkan.
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

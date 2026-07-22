"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";

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
    <Modal show={show} onHide={onClose} centered className="consumable-delete-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="consumable-delete-title-icon">
            <IconTrash size={20} />
          </span>
          Hapus Data
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="consumable-delete-icon mb-3">
          <IconAlertTriangle size={32} />
        </div>
        <h5 className="mb-2">Yakin ingin menghapus data ini?</h5>
        <p className="text-secondary mb-3">
          Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="consumable-delete-hero">
          <div className="fw-semibold">{consumable?.nama}</div>
          <div className="text-secondary small">
            Kode Barang:{" "}
            <span className="fw-semibold text-body">{consumable?.kode_barang}</span>
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

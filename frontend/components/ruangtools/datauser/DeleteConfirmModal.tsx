"use client";
import { Modal, Button } from "react-bootstrap";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";

import { UserItemType } from "types/DataUserTypes";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserItemType | null;
}

const DeleteConfirmModal = ({ show, onClose, onConfirm, user }: DeleteConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <IconTrash size={20} />
          Hapus User
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="mb-3">
          <IconAlertTriangle size={32} className="text-danger" />
        </div>
        <h5 className="mb-2">Yakin ingin menghapus user ini?</h5>
        <p className="text-secondary mb-3">Tindakan ini tidak bisa dibatalkan.</p>
        <div className="fw-semibold">{user?.full_name}</div>
        <div className="text-secondary small">{user?.email}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm} className="d-inline-flex align-items-center gap-2">
          <IconTrash size={18} />
          Hapus
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;
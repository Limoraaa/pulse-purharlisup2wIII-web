"use client";
import { Modal, Button } from "react-bootstrap";
import { IconCircleCheck } from "@tabler/icons-react";

import { UserItemType } from "types/DataUserTypes";

interface ActivateConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserItemType | null;
}

const ActivateConfirmModal = ({ show, onClose, onConfirm, user }: ActivateConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <IconCircleCheck size={20} />
          Aktifkan User
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <IconCircleCheck size={48} className="text-success mb-3" />
        <h6 className="mb-1">Yakin ingin Aktifkan user ini?</h6>
        <p className="text-secondary mb-1">User akan bisa login kembali ke sistem.</p>
        <p className="fw-semibold mb-0">{user?.full_name}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Batal
        </Button>
        <Button variant="success" className="d-inline-flex align-items-center gap-2" onClick={onConfirm}>
          <IconCircleCheck size={18} />
          Aktifkan
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ActivateConfirmModal;
"use client";
import { Modal, Button } from "react-bootstrap";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";

export type ConfirmActionVariant = "success" | "danger";

interface ConfirmActionModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: ConfirmActionVariant;
  submitting?: boolean;
}

const ConfirmActionModal = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  variant = "success",
  submitting = false,
}: ConfirmActionModalProps) => {
  const isDanger = variant === "danger";

  return (
    <Modal show={show} onHide={submitting ? undefined : onClose} centered className="confirm-action-modal">
      <Modal.Body className="text-center py-4 px-4">
        <div
          className={`confirm-action-icon mb-3 mx-auto d-flex align-items-center justify-content-center ${
            isDanger ? "confirm-action-icon-danger" : "confirm-action-icon-success"
          }`}
        >
          {isDanger ? <IconAlertTriangle size={28} /> : <IconCircleCheck size={28} />}
        </div>
        <h5 className="mb-2">{title}</h5>
        <p className="text-secondary mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer className="justify-content-center border-top-0 pb-4">
        <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button variant={isDanger ? "danger" : "success"} onClick={onConfirm} disabled={submitting}>
          {submitting ? "Memproses..." : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmActionModal;
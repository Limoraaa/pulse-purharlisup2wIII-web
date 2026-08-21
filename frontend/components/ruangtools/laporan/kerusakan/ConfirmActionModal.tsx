"use client";
import { Modal, Button, Form, Alert } from "react-bootstrap";
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
    warningText?: string;
  showNoteInput?: boolean;
  noteValue?: string;
  onNoteChange?: (value: string) => void;
  notePlaceholder?: string;
  showSeverityInput?: boolean;
  severityValue?: "ringan" | "berat" | "";
  onSeverityChange?: (value: "ringan" | "berat") => void;
  confirmDisabled?: boolean;
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
  warningText,
  showNoteInput = false,
  noteValue = "",
  onNoteChange,
  notePlaceholder = "Catatan perbaikan (opsional)...",
  showSeverityInput = false,
  severityValue = "",
  onSeverityChange,
  confirmDisabled = false,
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
        <p className="text-secondary mb-3">{message}</p>

        {warningText && (
          <Alert variant="warning" className="text-start small mb-3">
            {warningText}
          </Alert>
        )}

                {showSeverityInput && (
          <Form.Group className="text-start mb-3">
            <Form.Label className="small fw-semibold">
              Tingkat Kerusakan <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="severity-ringan"
                name="tingkat_kerusakan"
                label="Rusak Ringan"
                checked={severityValue === "ringan"}
                onChange={() => onSeverityChange?.("ringan")}
              />
              <Form.Check
                type="radio"
                id="severity-berat"
                name="tingkat_kerusakan"
                label="Rusak Berat"
                checked={severityValue === "berat"}
                onChange={() => onSeverityChange?.("berat")}
              />
            </div>
            <Form.Text className="text-secondary">
              Rusak ringan tidak dihitung ke batas maksimal perbaikan.
            </Form.Text>
          </Form.Group>
        )}

        {showNoteInput && (
          <Form.Group className="text-start">
            <Form.Label className="small fw-semibold">Catatan Perbaikan</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder={notePlaceholder}
              value={noteValue}
              onChange={(e) => onNoteChange?.(e.target.value)}
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-content-center border-top-0 pb-4">
        <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button variant={isDanger ? "danger" : "success"} onClick={onConfirm} disabled={submitting || confirmDisabled}>
          {submitting ? "Memproses..." : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmActionModal;
"use client";
// import node module libraries
import { Modal, Button, Spinner } from "react-bootstrap";
import { IconUserOff, IconAlertTriangle } from "@tabler/icons-react";

// import custom types
import { PeminjamType } from "types/DataToolsTypes";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  peminjam: PeminjamType | null;
  submitting?: boolean;
}

const DeleteConfirmModal = ({
  show,
  onClose,
  onConfirm,
  peminjam,
  submitting = false,
}: DeleteConfirmModalProps) => {
  return (
    <Modal
      show={show}
      onHide={submitting ? undefined : onClose}
      centered
      className="peminjam-deactivate-modal"
    >
      <Modal.Header closeButton={!submitting}>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="peminjam-deactivate-title-icon">
            <IconUserOff size={20} />
          </span>
          Nonaktifkan Data
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="peminjam-deactivate-icon mb-3">
          <IconAlertTriangle size={32} />
        </div>
        <h5 className="mb-2">Nonaktifkan peminjam ini?</h5>
        <p className="text-secondary mb-3">
          Riwayat transaksi lama tetap aman, hanya tidak bisa dipilih lagi untuk
          peminjaman baru. Data bisa diaktifkan kembali nanti.
        </p>
        <div className="peminjam-deactivate-hero">
          <div className="fw-semibold">{peminjam?.nama}</div>
          <div className="text-secondary small">
            Divisi:{" "}
            <span className="fw-semibold text-body">{peminjam?.divisi}</span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button
          variant="warning"
          onClick={onConfirm}
          disabled={submitting}
          className="d-inline-flex align-items-center gap-2"
        >
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" />
              Memproses...
            </>
          ) : (
            <>
              <IconUserOff size={18} />
              Nonaktifkan
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;

"use client";
// import node module libraries
import { Modal, Button, Spinner } from "react-bootstrap";

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
    <Modal show={show} onHide={submitting ? undefined : onClose} centered size="sm">
      <Modal.Header closeButton={!submitting}>
        <Modal.Title as="h6">Nonaktifkan Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Yakin ingin nonaktifkan{" "}
        <span className="fw-semibold">{peminjam?.nama}</span> dari data
        peminjam? Riwayat transaksi lama tetap aman, cuma tidak bisa
        dipilih lagi untuk peminjaman baru.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Memproses...
            </>
          ) : (
            "Nonaktifkan"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;
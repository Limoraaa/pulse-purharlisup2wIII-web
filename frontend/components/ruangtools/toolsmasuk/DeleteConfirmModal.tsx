"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";

// import custom types
import { ToolMasukType } from "types/DataToolsTypes";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: ToolMasukType | null;
}

const DeleteConfirmModal = ({
  show,
  onClose,
  onConfirm,
  item,
}: DeleteConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered className="toolsmasuk-delete-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="toolsmasuk-delete-title-icon">
            <IconTrash size={20} />
          </span>
          Hapus Data
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="toolsmasuk-delete-icon mb-3">
          <IconAlertTriangle size={32} />
        </div>
        <h5 className="mb-2">Yakin ingin menghapus catatan ini?</h5>
        <p className="text-secondary mb-3">
          Menghapus catatan ini akan menyesuaikan kembali stok terkait. Tindakan
          ini tidak bisa dibatalkan.
        </p>
        <div className="toolsmasuk-delete-hero">
          <div className="fw-semibold">{item?.nama_barang}</div>
          <div className="text-secondary small">
            Jumlah masuk:{" "}
            <span className="fw-semibold text-body">{item?.jumlah_masuk} unit</span>
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
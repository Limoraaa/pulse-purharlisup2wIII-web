"use client";
// import node module libraries
import { Modal, Button } from "react-bootstrap";

interface KeteranganModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  keterangan: string;
}

const KeteranganModal = ({
  show,
  onClose,
  title = "Keterangan",
  keterangan,
}: KeteranganModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h6">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {keterangan ? (
          <p className="mb-0">{keterangan}</p>
        ) : (
          <p className="text-secondary mb-0">Tidak ada keterangan.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default KeteranganModal;

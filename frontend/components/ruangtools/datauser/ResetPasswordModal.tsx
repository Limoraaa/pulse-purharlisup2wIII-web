"use client";
import { useState } from "react";
import { Modal, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { IconKey, IconEye, IconEyeOff } from "@tabler/icons-react";

import { UserItemType } from "types/DataUserTypes";

interface ResetPasswordModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (passwordBaru: string, konfirmasi: string) => void;
  user: UserItemType | null;
  error?: string | null;
  submitting?: boolean;
}

const ResetPasswordModal = ({
  show,
  onClose,
  onSubmit,
  user,
  error,
  submitting = false,
}: ResetPasswordModalProps) => {
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(passwordBaru, konfirmasi);
  };

  const handleClose = () => {
    setPasswordBaru("");
    setKonfirmasi("");
    setShowPasswordBaru(false);
    setShowKonfirmasi(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <IconKey size={20} />
            Reset Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-secondary">
            Mengatur ulang password untuk <strong>{user.full_name}</strong>.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Password Baru</Form.Label>
            <InputGroup>
              <Form.Control
                required
                type={showPasswordBaru ? "text" : "password"}
                minLength={6}
                value={passwordBaru}
                disabled={submitting}
                onChange={(e) => setPasswordBaru(e.target.value)}
              />
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setShowPasswordBaru((prev) => !prev)}
                disabled={submitting}
                aria-label={showPasswordBaru ? "Sembunyikan password" : "Tampilkan password"}
                tabIndex={-1}
              >
                {showPasswordBaru ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </Button>
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Konfirmasi Password Baru</Form.Label>
            <InputGroup>
              <Form.Control
                required
                type={showKonfirmasi ? "text" : "password"}
                minLength={6}
                value={konfirmasi}
                disabled={submitting}
                onChange={(e) => setKonfirmasi(e.target.value)}
              />
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setShowKonfirmasi((prev) => !prev)}
                disabled={submitting}
                aria-label={showKonfirmasi ? "Sembunyikan password" : "Tampilkan password"}
                tabIndex={-1}
              >
                {showKonfirmasi ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </Button>
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            Simpan Password Baru
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;
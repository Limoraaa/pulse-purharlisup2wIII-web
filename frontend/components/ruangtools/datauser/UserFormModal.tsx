"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { IconUser, IconPencil, IconPlus } from "@tabler/icons-react";

import { UserFormValues, UserItemType, UserRole } from "types/DataUserTypes";

const emptyForm: UserFormValues = {
  full_name: "",
  email: "",
  role: "staff",
  divisi: "",
  no_hp: "",
};

interface UserFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  initialData?: UserItemType | null;
  isAdmin: boolean;
  error?: string | null;
}

const UserFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  isAdmin,
  error,
}: UserFormModalProps) => {
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      if (initialData) {
        setForm({
          full_name: initialData.full_name,
          email: initialData.email,
          role: initialData.role,
          divisi: initialData.divisi || "",
          no_hp: initialData.no_hp || "",
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [show, initialData]);

  const handleChange = (field: keyof UserFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            {isEditMode ? <IconPencil size={20} /> : <IconUser size={20} />}
            {isEditMode ? "Edit User" : "Tambah User Baru"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Row className="g-3">
            <Col md={6}>
              <Form.Label>
                Nama Lengkap <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>
                Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Role</Form.Label>
              {isAdmin ? (
                <Form.Select
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value as UserRole)}
                >
                  <option value="staff">Staff</option>
                  <option value="super_admin">Super Admin</option>
                </Form.Select>
              ) : (
                <Form.Control value="Staff" disabled readOnly />
              )}
              {!isAdmin && (
                <Form.Text className="text-secondary">
                  Akun yang Anda buat otomatis berperan sebagai Staff.
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <Form.Label>Divisi</Form.Label>
              <Form.Control
                value={form.divisi}
                onChange={(e) => handleChange("divisi", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>
                Nomor HP <span className="text-secondary fw-normal">(opsional)</span>
              </Form.Label>
              <Form.Control
                value={form.no_hp}
                placeholder="Contoh: 0812xxxxxxx"
                onChange={(e) => handleChange("no_hp", e.target.value)}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" className="d-inline-flex align-items-center gap-2">
            {isEditMode ? <IconPencil size={18} /> : <IconPlus size={18} />}
            {isEditMode ? "Simpan Perubahan" : "Tambah User"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
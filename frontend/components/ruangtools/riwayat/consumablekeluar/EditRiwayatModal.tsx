"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";

// import custom types
import {
  RiwayatConsumableKeluarType,
  RiwayatConsumableKeluarFormValues,
} from "types/RiwayatTypes";

interface EditRiwayatModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: RiwayatConsumableKeluarFormValues) => void;
  item: RiwayatConsumableKeluarType | null;
}

const EditRiwayatModal = ({
  show,
  onClose,
  onSubmit,
  item,
}: EditRiwayatModalProps) => {
  const [form, setForm] = useState<RiwayatConsumableKeluarFormValues>({
    jumlah: 0,
    area_kerja: "",
    keterangan: "",
  });

  useEffect(() => {
    if (show && item) {
      setForm({
        jumlah: item.jumlah,
        area_kerja: item.area_kerja,
        keterangan: item.keterangan,
      });
    }
  }, [show, item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            Edit Riwayat — {item.nomor_transaksi}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-secondary small">
            {item.nama_barang} ({item.kode_barang}) — diambil oleh{" "}
            {item.nama_peminta}
          </p>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Jumlah</Form.Label>
              <Form.Control
                type="number"
                min={1}
                required
                value={form.jumlah}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    jumlah: Number(e.target.value),
                  }))
                }
              />
            </Col>
            <Col md={12}>
              <Form.Label>Area Kerja</Form.Label>
              <Form.Control
                required
                value={form.area_kerja}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, area_kerja: e.target.value }))
                }
              />
            </Col>
            <Col md={12}>
              <Form.Label>Keterangan</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.keterangan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, keterangan: e.target.value }))
                }
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit">
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditRiwayatModal;

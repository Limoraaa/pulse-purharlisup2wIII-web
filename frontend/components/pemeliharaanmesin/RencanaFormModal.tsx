"use client";
// components/pemeliharaan/rencana/RencanaFormModal.tsx
import { useEffect, useState } from "react";
import { Modal, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap";
import {
  AksiRencana,
  MesinOption,
  RencanaFormValues,
  RencanaItem,
  StatusRencana,
} from "types/RencanaPemeliharaanTypes";
import { ACTION_KEYS, ACTION_META, MONTHS_LONG } from "./RencanaHelpers";

export interface RencanaFormDefaults {
  mesinId?: string;
  bulan?: number;
  minggu?: number;
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: RencanaFormValues) => void | Promise<void>;
  onDelete: (item: RencanaItem) => void | Promise<void>;
  initialData: RencanaItem | null;
  defaults: RencanaFormDefaults | null;
  tahun: number;
  mesinOptions: MesinOption[];
  submitting: boolean;
  error: string | null;
  canManage: boolean;
}

// Semua tahun yang diterima backend (2000-2100)
const YEAR_OPTIONS = Array.from({ length: 101 }, (_, i) => 2000 + i);

const buildEmptyForm = (
  tahun: number,
  defaults: RencanaFormDefaults | null
): RencanaFormValues => ({
  mesinId: defaults?.mesinId ?? "",
  tahun,
  bulan: defaults?.bulan ?? new Date().getMonth() + 1,
  minggu: defaults?.minggu ?? 1,
  aksi: "C",
  status: "Rencana",
  rab: 0,
  keterangan: "",
});

const RencanaFormModal = ({
  show,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  defaults,
  tahun,
  mesinOptions,
  submitting,
  error,
  canManage,
}: Props) => {
  const [form, setForm] = useState<RencanaFormValues>(buildEmptyForm(tahun, defaults));
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!initialData;
  const readOnly = !canManage;

  useEffect(() => {
    if (!show) return;
    setLocalError(null);
    setConfirmDelete(false);
    if (initialData) {
      setForm({
        mesinId: initialData.mesinId,
        tahun: initialData.tahun,
        bulan: initialData.bulan,
        minggu: initialData.minggu,
        aksi: initialData.aksi,
        status: initialData.status,
        rab: initialData.rab,
        keterangan: initialData.keterangan,
      });
    } else {
      setForm(buildEmptyForm(tahun, defaults));
    }
  }, [show, initialData, defaults, tahun]);

  const set = <K extends keyof RencanaFormValues>(key: K, value: RencanaFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mesinId) {
      setLocalError("Pilih mesin terlebih dahulu.");
      return;
    }
    onSubmit(form);
  };

  const title = readOnly ? "Detail Rencana" : isEdit ? "Edit Rencana" : "Tambah Rencana";

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h4">{title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {(localError || error) && (
            <Alert variant="danger" className="py-2">
              {localError || error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Mesin</Form.Label>
            <Form.Select
              value={form.mesinId}
              onChange={(e) => set("mesinId", e.target.value)}
              disabled={readOnly || isEdit}
            >
              <option value="">Pilih mesin...</option>
              {mesinOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.kodeMesin} - {m.namaMesin}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row className="g-3 mb-3">
            <Col xs={12} sm={5}>
              <Form.Label>Bulan</Form.Label>
              <Form.Select
                value={form.bulan}
                onChange={(e) => set("bulan", Number(e.target.value))}
                disabled={readOnly}
              >
                {MONTHS_LONG.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={3}>
              <Form.Label>Minggu ke</Form.Label>
              <Form.Select
                value={form.minggu}
                onChange={(e) => set("minggu", Number(e.target.value))}
                disabled={readOnly}
              >
                {[1, 2, 3, 4].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={4}>
              <Form.Label>Tahun</Form.Label>
              <Form.Select
                value={form.tahun}
                onChange={(e) => set("tahun", Number(e.target.value))}
                disabled={readOnly}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col xs={isEdit ? 6 : 12}>
              <Form.Label>Tindakan</Form.Label>
              <Form.Select
                value={form.aksi}
                onChange={(e) => set("aksi", e.target.value as AksiRencana)}
                disabled={readOnly}
              >
                {ACTION_KEYS.map((k) => (
                  <option key={k} value={k}>{k} - {ACTION_META[k].label}</option>
                ))}
              </Form.Select>
            </Col>
            {isEdit && (
              <Col xs={6}>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as StatusRencana)}
                  disabled={readOnly}
                >
                  <option value="Rencana">Rencana</option>
                  <option value="Selesai">Selesai</option>
                </Form.Select>
              </Col>
            )}
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>RAB (Rp)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={form.rab}
              onChange={(e) => set("rab", Number(e.target.value) || 0)}
              disabled={readOnly}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Keterangan</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.keterangan}
              onChange={(e) => set("keterangan", e.target.value)}
              disabled={readOnly}
              placeholder="Opsional"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {canManage && isEdit && initialData && (
              confirmDelete ? (
                <>
                  <span className="text-danger small">Hapus rencana ini?</span>
                  <Button variant="danger" size="sm" onClick={() => onDelete(initialData)} disabled={submitting}>
                    Ya, hapus
                  </Button>
                  <Button variant="link" size="sm" onClick={() => setConfirmDelete(false)}>
                    Batal
                  </Button>
                </>
              ) : (
                <Button variant="outline-danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={submitting}>
                  Hapus
                </Button>
              )
            )}
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
              {readOnly ? "Tutup" : "Batal"}
            </Button>
            {canManage && (
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting && <Spinner animation="border" size="sm" className="me-2" />}
                Simpan
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RencanaFormModal;
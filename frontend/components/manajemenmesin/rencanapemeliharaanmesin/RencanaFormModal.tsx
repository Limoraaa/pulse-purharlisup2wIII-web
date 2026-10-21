"use client";
// components/pemeliharaan/rencana/RencanaFormModal.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap";
import {
  AksiRencana,
  MesinOption,
  RencanaFormValues,
  RencanaItem,
} from "types/RencanaPemeliharaanTypes";
import {
  ACTION_KEYS,
  ACTION_META,
  MONTHS_LONG,
  buildKerjakanUrl,
  formatDateIndo,
} from "./RencanaHelpers";

export interface RencanaFormDefaults {
  mesinId?: string | number;
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
  canProcess: boolean;
}

// Semua tahun yang diterima backend (2000-2100)
const YEAR_OPTIONS = Array.from({ length: 101 }, (_, i) => 2000 + i);

const buildEmptyForm = (
  tahun: number,
  defaults: RencanaFormDefaults | null
): RencanaFormValues => ({
  // Bungkus defaults.mesinId dengan String() agar TypeScript tidak protes
  mesinId: defaults?.mesinId ? String(defaults.mesinId) : "",
  tahun,
  bulan: defaults?.bulan ?? new Date().getMonth() + 1,
  minggu: defaults?.minggu ?? 1,
  aksi: "C",
  rab: 0,
  keterangan: "",
  jenis_pelaksana: "Internal",
});

// Posisi Bulan & Minggu (W1-W4) dari tanggal selesai (realisasi).
// Tanggal dipotong manual (bukan new Date) supaya tidak bergeser sehari karena zona waktu.
const getRealisasiInfo = (tanggalSelesai?: string | null) => {
  if (!tanggalSelesai) return null;
  const m = String(tanggalSelesai).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const tahun = Number(m[1]);
  const bulan = MONTHS_LONG[Number(m[2]) - 1];
  const minggu = Math.min(4, Math.max(1, Math.ceil(Number(m[3]) / 7)));
  return `${bulan} ${tahun} (Minggu ke-${minggu} / W${minggu})`;
};

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
  canProcess,
}: Props) => {
  const router = useRouter();
  const [form, setForm] = useState<RencanaFormValues>(buildEmptyForm(tahun, defaults));
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // STATE UNTUK VENDOR
  const [jenisPelaksana, setJenisPelaksana] = useState<'Internal' | 'Vendor'>('Internal');

  const isEdit = !!initialData;
  // Rencana yang sudah dikerjakan dikunci: statusnya mengikuti log pemeliharaan.
  const completed = initialData?.status === "Selesai";
  const readOnly = !canManage || completed;

  useEffect(() => {
    if (!show) return;
    setLocalError(null);
    setConfirmDelete(false);
    
    if (initialData) {
      setForm({
        mesinId: initialData.mesinId ? String(initialData.mesinId) : "",
        tahun: initialData.tahun,
        bulan: initialData.bulan,
        minggu: initialData.minggu,
        aksi: initialData.aksi,
        rab: initialData.rab || 0,
        keterangan: initialData.keterangan || "",
      });
      // Set State Vendor dari data saat di-edit
      setJenisPelaksana(initialData.jenis_pelaksana || 'Internal');
    } else {
      setForm(buildEmptyForm(tahun, defaults));
      setJenisPelaksana('Internal');
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
    
    // Gabungkan form dengan jenisPelaksana
    const payload: RencanaFormValues = {
      ...form,
      jenis_pelaksana: jenisPelaksana,
    };
    
    onSubmit(payload);
  };

  // Tutup modal dulu (supaya backdrop/overlay tidak tertinggal), lalu pindah ke
  // halaman pemeliharaan mesin dengan membawa mesin + rencana yang dipilih.
  const handleKerjakan = () => {
    if (!initialData) return;
    const url = buildKerjakanUrl({
      id: initialData.id,
      mesinId: initialData.mesinId,
      aksi: initialData.aksi
    });
    onClose();
    router.push(url);
  };

  const title = readOnly ? "Detail Rencana" : isEdit ? "Edit Rencana" : "Tambah Rencana";
  const realisasiSlotText = completed ? getRealisasiInfo(initialData?.tanggalSelesai) : null;
  const tglSelesai = initialData?.tanggalSelesai;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h4">{title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {completed && initialData && (
            <Alert variant="success" className="py-2 small">
              <div className="fw-semibold mb-1">
                Status: Terealisasi (Selesai)
              </div>
              <div>
                <strong>Rencana:</strong> {MONTHS_LONG[initialData.bulan - 1]}{" "}
                {initialData.tahun} (Minggu ke-{initialData.minggu} / W{initialData.minggu})
              </div>
              <div>
                <strong>Realisasi:</strong>{" "}
                {realisasiSlotText
                  ? `${realisasiSlotText} — ${formatDateIndo(tglSelesai)}`
                  : formatDateIndo(tglSelesai) ||
                    `${MONTHS_LONG[initialData.bulan - 1]} ${initialData.tahun} (W${initialData.minggu})`}
              </div>
              <div className="mt-1 text-muted">
                Hasilnya tercatat di log pemeliharaan mesin ini, sehingga rencana tidak bisa diubah.
              </div>
            </Alert>
          )}

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
              <Form.Label>Bulan Rencana</Form.Label>
              <Form.Select
                value={form.bulan}
                onChange={(e) => set("bulan", Number(e.target.value))}
                disabled={readOnly}
              >
                {MONTHS_LONG.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
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
                  <option key={w} value={w}>
                    {w}
                  </option>
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
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col xs={12}>
              <Form.Label>Tindakan</Form.Label>
              <Form.Select
                value={form.aksi}
                onChange={(e) => set("aksi", e.target.value as AksiRencana)}
                disabled={readOnly}
              >
                {ACTION_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {ACTION_META[k]?.label || k}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="d-block">Pelaksana Pekerjaan</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="radio-internal"
                label="Internal PLN"
                name="jenis_pelaksana"
                checked={jenisPelaksana === 'Internal'}
                onChange={() => setJenisPelaksana('Internal')}
                disabled={readOnly}
              />
              <Form.Check
                type="radio"
                id="radio-vendor"
                label="Vendor (Pihak Ketiga)"
                name="jenis_pelaksana"
                checked={jenisPelaksana === 'Vendor'}
                onChange={() => setJenisPelaksana('Vendor')}
                disabled={readOnly}
              />
            </div>
          </Form.Group>

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
            {canManage && isEdit && initialData && !completed && (
              confirmDelete ? (
                <>
                  <span className="text-danger small">Hapus rencana ini?</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(initialData)}
                    disabled={submitting}
                  >
                    Ya, hapus
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Batal
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitting}
                >
                  Hapus
                </Button>
              )
            )}
            {canProcess && initialData && !completed && (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={handleKerjakan}
                disabled={submitting}
              >
                Kerjakan sekarang
              </Button>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {readOnly ? "Tutup" : "Batal"}
            </Button>
            {canManage && !completed && (
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting && (
                  <Spinner animation="border" size="sm" className="me-2" />
                )}
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
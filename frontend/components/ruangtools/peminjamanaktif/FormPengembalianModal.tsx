"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { IconRotateClockwise2, IconCheck } from "@tabler/icons-react";

import { PeminjamanAktifItemType } from "types/DataToolsTypes";

export type JenisKerusakan = "bisa_diperbaiki" | "rusak_permanen";

export interface KerusakanEntry {
  jenisKerusakan: JenisKerusakan;
  jumlah: number;
  catatan: string;
}

export interface PengembalianSubmitPayload {
  kerusakan: KerusakanEntry[];
}

interface FormPengembalianModalProps {
  show: boolean;
  onClose: () => void;
  item: PeminjamanAktifItemType | null;
  onSubmit: (payload: PengembalianSubmitPayload) => void;
  submitting?: boolean;
}

// Sinkronkan panjang array catatan dengan jumlah unit, isi baru default ""
const resizeCatatan = (arr: string[], size: number): string[] => {
  if (size === arr.length) return arr;
  if (size < arr.length) return arr.slice(0, size);
  return [...arr, ...Array(size - arr.length).fill("")];
};

const FormPengembalianModal = ({
  show,
  onClose,
  item,
  onSubmit,
  submitting = false,
}: FormPengembalianModalProps) => {
  const [jumlahRusak, setJumlahRusak] = useState(0);
  const [jumlahBisaDiperbaiki, setJumlahBisaDiperbaiki] = useState(0);
  const [jumlahRusakPermanen, setJumlahRusakPermanen] = useState(0);
  const [catatanBisaDiperbaiki, setCatatanBisaDiperbaiki] = useState<string[]>([]);
  const [catatanRusakPermanen, setCatatanRusakPermanen] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setJumlahRusak(0);
      setJumlahBisaDiperbaiki(0);
      setJumlahRusakPermanen(0);
      setCatatanBisaDiperbaiki([]);
      setCatatanRusakPermanen([]);
      setError(null);
    }
  }, [show, item]);

  if (!item) return null;

  const jumlahBaik = item.jumlah - jumlahRusak;
  const totalTerklasifikasi = jumlahBisaDiperbaiki + jumlahRusakPermanen;
  const sisaBelumDiklasifikasi = jumlahRusak - totalTerklasifikasi;

  const handleJumlahRusakChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    let num = digitsOnly === "" ? 0 : Number(digitsOnly);
    if (num > item.jumlah) num = item.jumlah;
    setJumlahRusak(num);
    setJumlahBisaDiperbaiki(0);
    setJumlahRusakPermanen(0);
    setCatatanBisaDiperbaiki([]);
    setCatatanRusakPermanen([]);
  };

  const handleBisaDiperbaikiChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    let num = digitsOnly === "" ? 0 : Number(digitsOnly);
    if (num > jumlahRusak) num = jumlahRusak;
    setJumlahBisaDiperbaiki(num);
    setCatatanBisaDiperbaiki((prev) => resizeCatatan(prev, num));
  };

  const handleRusakPermanenChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    let num = digitsOnly === "" ? 0 : Number(digitsOnly);
    if (num > jumlahRusak) num = jumlahRusak;
    setJumlahRusakPermanen(num);
    setCatatanRusakPermanen((prev) => resizeCatatan(prev, num));
  };

  const updateCatatanBisaDiperbaiki = (index: number, value: string) => {
    setCatatanBisaDiperbaiki((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const updateCatatanRusakPermanen = (index: number, value: string) => {
    setCatatanRusakPermanen((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (jumlahRusak > 0) {
      if (totalTerklasifikasi !== jumlahRusak) {
        setError(
          `Total unit yang diklasifikasikan (${totalTerklasifikasi}) harus sama dengan jumlah rusak (${jumlahRusak}).`
        );
        return;
      }
      if (catatanBisaDiperbaiki.some((c) => c.trim() === "")) {
        setError("Semua catatan untuk unit Bisa Diperbaiki wajib diisi.");
        return;
      }
      if (catatanRusakPermanen.some((c) => c.trim() === "")) {
        setError("Semua catatan untuk unit Rusak Permanen wajib diisi.");
        return;
      }
    }

    setError(null);

    // Tiap unit jadi 1 entry terpisah (jumlah: 1), supaya jadi laporan tersendiri
    const kerusakan: KerusakanEntry[] = [
      ...catatanBisaDiperbaiki.map((catatan) => ({
        jenisKerusakan: "bisa_diperbaiki" as JenisKerusakan,
        jumlah: 1,
        catatan,
      })),
      ...catatanRusakPermanen.map((catatan) => ({
        jenisKerusakan: "rusak_permanen" as JenisKerusakan,
        jumlah: 1,
        catatan,
      })),
    ];

    onSubmit({ kerusakan });
  };

  return (
    <Modal show={show} onHide={submitting ? undefined : onClose} centered className="pengembalian-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <span className="pengembalian-title-icon">
              <IconRotateClockwise2 size={20} />
            </span>
            Form Pengembalian
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="pengembalian-hero mb-4">
            <div className="text-secondary small text-uppercase mb-1">Alat</div>
            <div className="fw-semibold">
              {item.namaBarang}{" "}
              <span className="text-secondary">({item.kodeBarang})</span>
            </div>
            <div className="text-secondary small">
              Dipinjam oleh {item.namaPeminjam} &middot; {item.jumlah} unit
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Dari {item.jumlah} unit, berapa yang rusak?</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jumlahRusak === 0 ? "" : String(jumlahRusak)}
              placeholder="0"
              onChange={(e) => handleJumlahRusakChange(e.target.value)}
              disabled={submitting}
            />
            <Form.Text className="text-secondary">
              {jumlahBaik} unit kondisi baik, {jumlahRusak} unit rusak.
            </Form.Text>
          </Form.Group>

          {jumlahRusak > 0 && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>
                  Klasifikasikan {jumlahRusak} unit yang rusak <span className="text-danger">*</span>
                </Form.Label>
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Label className="small text-secondary mb-1">Bisa Diperbaiki</Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={jumlahBisaDiperbaiki === 0 ? "" : String(jumlahBisaDiperbaiki)}
                      placeholder="0"
                      onChange={(e) => handleBisaDiperbaikiChange(e.target.value)}
                      disabled={submitting}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Label className="small text-secondary mb-1">Rusak Permanen</Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={jumlahRusakPermanen === 0 ? "" : String(jumlahRusakPermanen)}
                      placeholder="0"
                      onChange={(e) => handleRusakPermanenChange(e.target.value)}
                      disabled={submitting}
                    />
                  </Col>
                </Row>
                <Form.Text className={sisaBelumDiklasifikasi === 0 ? "text-success" : "text-secondary"}>
                  {sisaBelumDiklasifikasi === 0
                    ? "Semua unit sudah diklasifikasikan."
                    : `${sisaBelumDiklasifikasi} unit belum diklasifikasikan.`}
                </Form.Text>
              </Form.Group>

              {catatanBisaDiperbaiki.length > 0 && (
                <div className="mb-3">
                  <Form.Label className="mb-2">
                    Catatan Unit Bisa Diperbaiki <span className="text-danger">*</span>
                  </Form.Label>
                  {catatanBisaDiperbaiki.map((catatan, index) => (
                    <Form.Group className="mb-2" key={`bisa-${index}`}>
                      <Form.Label className="small text-secondary mb-1">
                        Unit #{index + 1}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Jelaskan kerusakan unit ini..."
                        value={catatan}
                        onChange={(e) => updateCatatanBisaDiperbaiki(index, e.target.value)}
                        disabled={submitting}
                      />
                    </Form.Group>
                  ))}
                </div>
              )}

              {catatanRusakPermanen.length > 0 && (
                <div className="mb-3">
                  <Form.Label className="mb-2">
                    Catatan Unit Rusak Permanen <span className="text-danger">*</span>
                  </Form.Label>
                  {catatanRusakPermanen.map((catatan, index) => (
                    <Form.Group className="mb-2" key={`permanen-${index}`}>
                      <Form.Label className="small text-secondary mb-1">
                        Unit #{index + 1}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Jelaskan kerusakan permanen unit ini..."
                        value={catatan}
                        onChange={(e) => updateCatatanRusakPermanen(index, e.target.value)}
                        disabled={submitting}
                      />
                    </Form.Group>
                  ))}
                </div>
              )}
            </>
          )}

          {jumlahRusak > 0 && (
            <p className="text-secondary small mt-3 mb-0">
              {jumlahRusak} unit akan dikurangi dari stok alat ini.
              {jumlahBaik > 0 && ` ${jumlahBaik} unit lainnya kembali tersedia seperti biasa.`}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="d-inline-flex align-items-center gap-2">
            {submitting ? "Memproses..." : (<><IconCheck size={18} /> Konfirmasi Pengembalian</>)}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FormPengembalianModal;
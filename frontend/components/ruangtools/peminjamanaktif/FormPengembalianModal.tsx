"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { IconRotateClockwise2, IconCheck } from "@tabler/icons-react";

// import custom types
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

export interface PengembalianSubmitPayload {
  jumlahRusak: number;
  catatan: string;
}

interface FormPengembalianModalProps {
  show: boolean;
  onClose: () => void;
  item: PeminjamanAktifItemType | null;
  onSubmit: (payload: PengembalianSubmitPayload) => void;
  submitting?: boolean;
}

const FormPengembalianModal = ({
  show,
  onClose,
  item,
  onSubmit,
  submitting = false,
}: FormPengembalianModalProps) => {
  const [jumlahRusak, setJumlahRusak] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setJumlahRusak(0);
      setCatatan("");
      setError(null);
    }
  }, [show, item]);

  if (!item) return null;

  const jumlahBaik = item.jumlah - jumlahRusak;

  const handleJumlahRusakChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    let num = digitsOnly === "" ? 0 : Number(digitsOnly);
    if (num > item.jumlah) num = item.jumlah; // tidak boleh lebih dari total dipinjam
    setJumlahRusak(num);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (jumlahRusak > 0 && catatan.trim() === "") {
      setError("Catatan wajib diisi kalau ada unit yang rusak.");
      return;
    }

    setError(null);
    onSubmit({ jumlahRusak, catatan });
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

          {/* Hero: info alat yang dikembalikan */}
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

          <Form.Group>
            <Form.Label>
              Catatan{" "}
              {jumlahRusak > 0 ? (
                <span className="text-danger">*</span>
              ) : (
                <span className="text-secondary fw-normal"></span>
              )}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder={
                jumlahRusak > 0 ? "Jelaskan kerusakannya..." : "Catatan kerusakan"
              }
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>

          {jumlahRusak > 0 && (
            <p className="text-secondary small mt-3 mb-0">
              {jumlahRusak} unit akan dikurangi permanen dari stok alat ini.
              {jumlahBaik > 0 && ` ${jumlahBaik} unit lainnya kembali tersedia seperti biasa.`}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="d-inline-flex align-items-center gap-2"
          >
            {submitting ? (
              "Memproses..."
            ) : (
              <>
                <IconCheck size={18} />
                Konfirmasi Pengembalian
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FormPengembalianModal;
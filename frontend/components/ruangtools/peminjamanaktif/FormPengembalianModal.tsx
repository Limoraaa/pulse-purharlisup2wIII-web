"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Modal, Form, Table, Button, Alert } from "react-bootstrap";

// import custom types
import {
  TransaksiPeminjamanType,
  ToolCondition,
  PengembalianItemInput,
} from "types/DataToolsTypes";

const KONDISI_OPTIONS: ToolCondition[] = [
  "Baik",
  "Rusak Ringan",
  "Rusak Berat",
  "Rusak Permanen",
];

interface FormPengembalianModalProps {
  show: boolean;
  onClose: () => void;
  transaksi: TransaksiPeminjamanType | null;
  onSubmit: (returns: PengembalianItemInput[]) => void;
}

const FormPengembalianModal = ({
  show,
  onClose,
  transaksi,
  onSubmit,
}: FormPengembalianModalProps) => {
  const [rows, setRows] = useState<PengembalianItemInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  // isi ulang state form setiap kali modal dibuka untuk transaksi tertentu
  useEffect(() => {
    if (show && transaksi) {
      setRows(
        transaksi.items.map((item) => ({
          toolId: item.toolId,
          kodeBarang: item.kodeBarang,
          namaBarang: item.namaBarang,
          jumlah: item.jumlah,
          kondisi: "Baik",
          catatan: "",
        }))
      );
      setError(null);
    }
  }, [show, transaksi]);

  if (!transaksi) return null;

  const updateRow = (
    toolId: string,
    field: "kondisi" | "catatan",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.toolId === toolId ? { ...r, [field]: value as never } : r
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // validasi: kalau kondisi bukan "Baik", catatan wajib diisi
    const invalid = rows.find(
      (r) => r.kondisi !== "Baik" && r.catatan.trim() === ""
    );
    if (invalid) {
      setError(
        `Catatan wajib diisi untuk "${invalid.namaBarang}" karena kondisinya tidak Baik.`
      );
      return;
    }

    setError(null);
    onSubmit(rows);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Form Pengembalian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Table responsive className="align-middle">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th className="text-center">Jumlah</th>
                <th style={{ minWidth: "160px" }}>Kondisi Alat</th>
                <th style={{ minWidth: "200px" }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.toolId}>
                  <td>{row.namaBarang}</td>
                  <td className="text-center">{row.jumlah}</td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={row.kondisi}
                      onChange={(e) =>
                        updateRow(row.toolId, "kondisi", e.target.value)
                      }
                    >
                      {KONDISI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      placeholder={
                        row.kondisi !== "Baik"
                          ? "Wajib diisi..."
                          : "Opsional"
                      }
                      value={row.catatan}
                      onChange={(e) =>
                        updateRow(row.toolId, "catatan", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <p className="text-secondary small mb-0">
            Alat dengan kondisi selain <span className="fw-semibold">Baik</span>{" "}
            tidak akan menambah jumlah tersedia dan akan masuk ke riwayat
            kerusakan.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit">
            Konfirmasi Pengembalian
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FormPengembalianModal;

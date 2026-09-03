"use client";
import { useState, useMemo } from "react";
import { Card, CardBody, Table, Form, Button, Badge, Alert } from "react-bootstrap";
import { IconRotateClockwise2, IconArrowLeft } from "@tabler/icons-react";

import { PeminjamanAktifItemType } from "types/DataToolsTypes";

export type JenisKerusakan = "bisa_diperbaiki" | "rusak_permanen";

interface ChecklistState {
  [id: string]: {
    checked: boolean;
    jumlahRusak: number;
    jenisKerusakan: JenisKerusakan;
    catatan: string;
  };
}

export interface PengembalianBatchItem {
  id: string;
  toolId: string;
  namaBarang: string;
  jumlahTotal: number;
  jumlahRusak: number;
  jenisKerusakan: JenisKerusakan;
  catatan: string;
}

interface PengembalianChecklistProps {
  namaPeminjam: string;
  items: PeminjamanAktifItemType[];
  onBack: () => void;
  onSubmit: (items: PengembalianBatchItem[]) => void;
  submitting?: boolean;
}

const PengembalianChecklist = ({
  namaPeminjam,
  items,
  onBack,
  onSubmit,
  submitting = false,
}: PengembalianChecklistProps) => {
    const [state, setState] = useState<ChecklistState>(() => {
    const initial: ChecklistState = {};
    items.forEach((item) => {
      initial[item.id] = { checked: false, jumlahRusak: 0, jenisKerusakan: "bisa_diperbaiki", catatan: "" };
    });
    return initial;
  });
  const [error, setError] = useState<string | null>(null);

  const jumlahDicentang = useMemo(
    () => Object.values(state).filter((s) => s.checked).length,
    [state]
  );

  const toggleCheck = (id: string) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));
  };

  const setJumlahRusak = (id: string, jumlahRusak: number, maxJumlah: number) => {
    const clamped = Math.max(0, Math.min(jumlahRusak, maxJumlah));
    setState((prev) => ({ ...prev, [id]: { ...prev[id], jumlahRusak: clamped } }));
  };

  const setCatatan = (id: string, catatan: string) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], catatan } }));
  };

  const setJenisKerusakan = (id: string, jenisKerusakan: JenisKerusakan) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], jenisKerusakan } }));
  };

  const handleSubmit = () => {
    const dipilih = items.filter((item) => state[item.id]?.checked);

    if (dipilih.length === 0) {
      setError("Pilih minimal 1 alat untuk dikembalikan.");
      return;
    }

    const rusakTanpaCatatan = dipilih.find(
      (item) => state[item.id].jumlahRusak > 0 && state[item.id].catatan.trim() === ""
    );
    if (rusakTanpaCatatan) {
      setError(`Catatan kerusakan untuk "${rusakTanpaCatatan.namaBarang}" wajib diisi.`);
      return;
    }

    setError(null);

    const payload: PengembalianBatchItem[] = dipilih.map((item) => ({
      id: item.id,
      toolId: item.toolId,
      namaBarang: item.namaBarang,
      jumlahTotal: item.jumlah,
      jumlahRusak: state[item.id].jumlahRusak,
      jenisKerusakan: state[item.id].jenisKerusakan,
      catatan: state[item.id].catatan,
    }));

    onSubmit(payload);
  };

  return (
    <Card className="card-lg">
      <CardBody>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <IconRotateClockwise2 size={22} className="text-primary" />
            <div>
              <h5 className="mb-0">Alat yang Dipinjam</h5>
              <div className="text-secondary small">Peminjam: {namaPeminjam}</div>
            </div>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={onBack} disabled={submitting}>
            <IconArrowLeft size={16} className="me-1" />
            Scan Ulang
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {items.length === 0 ? (
          <p className="text-secondary small mb-0">
            Peminjam ini tidak sedang memiliki alat yang dipinjam.
          </p>
        ) : (
          <>
            <Table responsive className="align-middle">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Alat</th>
                  <th style={{ width: 90 }}>Jumlah</th>
                  <th style={{ width: 130 }}>Jumlah Rusak</th>
                  <th style={{ width: 170 }}>Klasifikasi</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const rowState = state[item.id];
                  return (
                    <tr key={item.id}>
                      <td>
                        <Form.Check
                          checked={rowState.checked}
                          onChange={() => toggleCheck(item.id)}
                          disabled={submitting}
                        />
                      </td>
                      <td>
                        <div className="fw-semibold">{item.namaBarang}</div>
                        <div className="text-secondary small">{item.kodeBarang}</div>
                      </td>
                      <td>{item.jumlah}</td>
                        <td>
                        <Form.Control
                          size="sm"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={rowState.jumlahRusak === 0 ? "" : String(rowState.jumlahRusak)}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                            const num = digitsOnly === "" ? 0 : Number(digitsOnly);
                            setJumlahRusak(item.id, num, item.jumlah);
                          }}
                          disabled={submitting || !rowState.checked}
                        />
                        <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                          maks. {item.jumlah}
                        </div>
                      </td>
                      <td>
                        {rowState.jumlahRusak > 0 ? (
                          <Form.Select
                            size="sm"
                            value={rowState.jenisKerusakan}
                            onChange={(e) => setJenisKerusakan(item.id, e.target.value as JenisKerusakan)}
                            disabled={submitting || !rowState.checked}
                          >
                            <option value="bisa_diperbaiki">Bisa Diperbaiki</option>
                            <option value="rusak_permanen">Rusak Permanen</option>
                          </Form.Select>
                        ) : (
                          <span className="text-secondary small">-</span>
                        )}
                      </td>
                      <td>
                        {rowState.jumlahRusak > 0 ? (
                          <Form.Control
                            size="sm"
                            placeholder="Jelaskan kerusakannya..."
                            value={rowState.catatan}
                            onChange={(e) => setCatatan(item.id, e.target.value)}
                            disabled={submitting || !rowState.checked}
                          />
                        ) : (
                          <span className="text-secondary small">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <div className="d-flex align-items-center justify-content-between mt-3">
              <Badge bg="primary-subtle" text="primary-emphasis" className="fw-semibold">
                {jumlahDicentang} alat dipilih untuk dikembalikan
              </Badge>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting || jumlahDicentang === 0}
                className="d-inline-flex align-items-center gap-2"
              >
                {submitting ? "Memproses..." : "Konfirmasi Pengembalian"}
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default PengembalianChecklist;
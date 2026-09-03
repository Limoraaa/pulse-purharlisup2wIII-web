"use client";
import { useState, useMemo } from "react";
import { Card, CardBody, Table, Form, Button, Badge, Alert, InputGroup } from "react-bootstrap";
import { IconRotateClockwise2, IconArrowLeft, IconSearch, IconX } from "@tabler/icons-react";

import { PeminjamanAktifItemType } from "types/DataToolsTypes";

export type JenisKerusakan = "bisa_diperbaiki" | "rusak_permanen";

interface ChecklistState {
  [id: string]: {
    checked: boolean;
    jumlahBisaDiperbaiki: number;
    jumlahRusakPermanen: number;
    catatanBisaDiperbaiki: string;
    catatanRusakPermanen: string;
  };
}

export interface PengembalianKerusakanEntry {
  jenisKerusakan: JenisKerusakan;
  jumlah: number;
  catatan: string;
}

export interface PengembalianBatchItem {
  id: string;
  toolId: string;
  namaBarang: string;
  jumlahTotal: number;
  kerusakan: PengembalianKerusakanEntry[];
}

interface PengembalianChecklistProps {
  namaPeminjam: string;
  items: PeminjamanAktifItemType[];
  onBack: () => void;
  onSubmit: (items: PengembalianBatchItem[]) => void;
  submitting?: boolean;
}

const emptyRow = () => ({
  checked: false,
  jumlahBisaDiperbaiki: 0,
  jumlahRusakPermanen: 0,
  catatanBisaDiperbaiki: "",
  catatanRusakPermanen: "",
});

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
      initial[item.id] = emptyRow();
    });
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.namaBarang.toLowerCase().includes(keyword) ||
        item.kodeBarang.toLowerCase().includes(keyword)
    );
  }, [items, searchTerm]);

  const jumlahDicentang = useMemo(
    () => Object.values(state).filter((s) => s.checked).length,
    [state]
  );

  const toggleCheck = (id: string) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));
  };

  const updateField = (
    id: string,
    field: keyof ChecklistState[string],
    value: number | string
  ) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSubmit = () => {
    const dipilih = items.filter((item) => state[item.id]?.checked);

    if (dipilih.length === 0) {
      setError("Pilih minimal 1 alat untuk dikembalikan.");
      return;
    }

    for (const item of dipilih) {
      const row = state[item.id];
      const totalRusak = row.jumlahBisaDiperbaiki + row.jumlahRusakPermanen;

      if (totalRusak > item.jumlah) {
        setError(
          `Total rusak untuk "${item.namaBarang}" (${totalRusak}) melebihi jumlah dipinjam (${item.jumlah}).`
        );
        return;
      }
      if (row.jumlahBisaDiperbaiki > 0 && row.catatanBisaDiperbaiki.trim() === "") {
        setError(`Catatan "Bisa Diperbaiki" untuk "${item.namaBarang}" wajib diisi.`);
        return;
      }
      if (row.jumlahRusakPermanen > 0 && row.catatanRusakPermanen.trim() === "") {
        setError(`Catatan "Rusak Permanen" untuk "${item.namaBarang}" wajib diisi.`);
        return;
      }
    }

    setError(null);

    const payload: PengembalianBatchItem[] = dipilih.map((item) => {
      const row = state[item.id];
      const kerusakan: PengembalianKerusakanEntry[] = [];

      if (row.jumlahBisaDiperbaiki > 0) {
        kerusakan.push({
          jenisKerusakan: "bisa_diperbaiki",
          jumlah: row.jumlahBisaDiperbaiki,
          catatan: row.catatanBisaDiperbaiki,
        });
      }
      if (row.jumlahRusakPermanen > 0) {
        kerusakan.push({
          jenisKerusakan: "rusak_permanen",
          jumlah: row.jumlahRusakPermanen,
          catatan: row.catatanRusakPermanen,
        });
      }

      return {
        id: item.id,
        toolId: item.toolId,
        namaBarang: item.namaBarang,
        jumlahTotal: item.jumlah,
        kerusakan,
      };
    });

    onSubmit(payload);
  };

  return (
    <Card className="card-lg">
      <CardBody>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
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

        <InputGroup className="mb-3" style={{ maxWidth: 320 }}>
          <InputGroup.Text>
            <IconSearch size={16} />
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder="Cari nama atau kode alat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button variant="link" onClick={() => setSearchTerm("")}>
              <IconX size={16} />
            </Button>
          )}
        </InputGroup>

        {error && <Alert variant="danger">{error}</Alert>}

        {items.length === 0 ? (
          <p className="text-secondary small mb-0">
            Peminjam ini tidak sedang memiliki alat yang dipinjam.
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="text-secondary small mb-0">
            Tidak ada alat yang cocok dengan pencarian.
          </p>
        ) : (
          <>
            <Table responsive className="align-middle">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Alat</th>
                  <th style={{ width: 80 }}>Jumlah</th>
                  <th style={{ width: 170 }}>Bisa Diperbaiki</th>
                  <th style={{ width: 170 }}>Rusak Permanen</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const row = state[item.id];
                  const totalRusak = row.jumlahBisaDiperbaiki + row.jumlahRusakPermanen;
                  const sisaBaik = item.jumlah - totalRusak;

                  return (
                    <tr key={item.id}>
                      <td>
                        <Form.Check
                          checked={row.checked}
                          onChange={() => toggleCheck(item.id)}
                          disabled={submitting}
                        />
                      </td>
                      <td>
                        <div className="fw-semibold">{item.namaBarang}</div>
                        <div className="text-secondary small">{item.kodeBarang}</div>
                      </td>
                      <td>
                        {item.jumlah}
                        {row.checked && (
                          <div className="text-secondary" style={{ fontSize: "0.7rem" }}>
                            {sisaBaik >= 0 ? `${sisaBaik} baik` : "melebihi jumlah!"}
                          </div>
                        )}
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={row.jumlahBisaDiperbaiki === 0 ? "" : String(row.jumlahBisaDiperbaiki)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            updateField(item.id, "jumlahBisaDiperbaiki", digits === "" ? 0 : Number(digits));
                          }}
                          disabled={submitting || !row.checked}
                          className="mb-1"
                        />
                        {row.jumlahBisaDiperbaiki > 0 && (
                          <Form.Control
                            size="sm"
                            placeholder="Catatan..."
                            value={row.catatanBisaDiperbaiki}
                            onChange={(e) => updateField(item.id, "catatanBisaDiperbaiki", e.target.value)}
                            disabled={submitting}
                          />
                        )}
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={row.jumlahRusakPermanen === 0 ? "" : String(row.jumlahRusakPermanen)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            updateField(item.id, "jumlahRusakPermanen", digits === "" ? 0 : Number(digits));
                          }}
                          disabled={submitting || !row.checked}
                          className="mb-1"
                        />
                        {row.jumlahRusakPermanen > 0 && (
                          <Form.Control
                            size="sm"
                            placeholder="Catatan..."
                            value={row.catatanRusakPermanen}
                            onChange={(e) => updateField(item.id, "catatanRusakPermanen", e.target.value)}
                            disabled={submitting}
                          />
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
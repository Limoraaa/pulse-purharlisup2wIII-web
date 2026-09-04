"use client";
import { useState, useMemo } from "react";
import { Card, CardBody, Table, Form, Button, Badge, Alert, InputGroup } from "react-bootstrap";
import { IconRotateClockwise2, IconArrowLeft, IconSearch, IconX } from "@tabler/icons-react";

import { PeminjamanAktifItemType } from "types/DataToolsTypes";

export type JenisKerusakan = "bisa_diperbaiki" | "rusak_permanen";

interface ChecklistState {
  [id: string]: {
    checked: boolean;
    jumlahDikembalikan: number;
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
  jumlahDikembalikan: number;
  kerusakan: PengembalianKerusakanEntry[];
}

interface PengembalianChecklistProps {
  namaPeminjam: string;
  items: PeminjamanAktifItemType[];
  onBack: () => void;
  onSubmit: (items: PengembalianBatchItem[]) => void;
  submitting?: boolean;
}

const emptyRow = (jumlahDipinjam: number) => ({
  checked: false,
  jumlahDikembalikan: jumlahDipinjam,
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
      initial[item.id] = emptyRow(item.jumlah);
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

      if (row.jumlahDikembalikan < 1 || row.jumlahDikembalikan > item.jumlah) {
        setError(
          `Jumlah dikembalikan untuk "${item.namaBarang}" harus antara 1 - ${item.jumlah}.`
        );
        return;
      }

      const totalRusak = row.jumlahBisaDiperbaiki + row.jumlahRusakPermanen;
      if (totalRusak > row.jumlahDikembalikan) {
        setError(
          `Total rusak untuk "${item.namaBarang}" (${totalRusak}) melebihi jumlah yang dikembalikan (${row.jumlahDikembalikan}).`
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
        jumlahDikembalikan: row.jumlahDikembalikan,
        kerusakan,
      };
    });

    onSubmit(payload);
  };

  return (
    <Card className="card-lg pengembalian-checklist">
      <CardBody className="pb-2">
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
      </CardBody>

      <div className="riwayat-toolbar border-bottom px-4 py-3">
        <div className="riwayat-toolbar-row d-flex flex-wrap align-items-center gap-2">
          <InputGroup className="riwayat-search" style={{ maxWidth: 320 }}>
            <InputGroup.Text>
              <IconSearch size={18} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Cari nama atau kode alat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cari alat"
            />
            {searchTerm && (
              <Button
                variant="link"
                className="riwayat-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Bersihkan pencarian"
              >
                <IconX size={16} />
              </Button>
            )}
          </InputGroup>
          <span className="riwayat-info text-secondary small ms-auto pe-1">
            Menampilkan{" "}
            <span className="fw-semibold text-body">{filteredItems.length}</span>{" "}
            dari {items.length} alat
          </span>
        </div>
      </div>

      <CardBody className="pt-3">
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
            <Table responsive className="align-middle mb-0 pengembalian-table" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "28.5%" }} />
                <col style={{ width: "28.5%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>Alat</th>
                  <th>Dipinjam</th>
                  <th>Dikembalikan</th>
                  <th>Bisa Diperbaiki</th>
                  <th>Rusak Permanen</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const row = state[item.id];

                  return (
                    <tr key={item.id} className={row.checked ? "table-active" : undefined}>
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
                      <td>{item.jumlah}</td>
                      <td>
                        {row.checked ? (
                          <>
                            <Form.Control
                              size="sm"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={String(row.jumlahDikembalikan)}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/[^0-9]/g, "");
                                let num = digits === "" ? 0 : Number(digits);
                                if (num > item.jumlah) num = item.jumlah;
                                updateField(item.id, "jumlahDikembalikan", num);
                              }}
                              disabled={submitting}
                            />
                            {row.jumlahDikembalikan < item.jumlah && (
                              <div className="text-warning" style={{ fontSize: "0.7rem" }}>
                                {item.jumlah - row.jumlahDikembalikan} tetap dipinjam
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {row.checked ? (
                          <>
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
                              disabled={submitting}
                              className={row.jumlahBisaDiperbaiki > 0 ? "mb-1" : ""}
                            />
                            {row.jumlahBisaDiperbaiki > 0 && (
                              <Form.Control
                                size="sm"
                                placeholder="Catatan kerusakan..."
                                value={row.catatanBisaDiperbaiki}
                                onChange={(e) => updateField(item.id, "catatanBisaDiperbaiki", e.target.value)}
                                disabled={submitting}
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {row.checked ? (
                          <>
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
                              disabled={submitting}
                              className={row.jumlahRusakPermanen > 0 ? "mb-1" : ""}
                            />
                            {row.jumlahRusakPermanen > 0 && (
                              <Form.Control
                                size="sm"
                                placeholder="Catatan kerusakan..."
                                value={row.catatanRusakPermanen}
                                onChange={(e) => updateField(item.id, "catatanRusakPermanen", e.target.value)}
                                disabled={submitting}
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
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
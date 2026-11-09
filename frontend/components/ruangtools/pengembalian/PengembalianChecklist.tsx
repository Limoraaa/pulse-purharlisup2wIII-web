"use client";
import { useState, useMemo } from "react";
import { Card, CardBody, Table, Form, Button, Badge, Alert, InputGroup } from "react-bootstrap";
import { IconRotateClockwise2, IconArrowLeft, IconSearch, IconX } from "@tabler/icons-react";


export type JenisKerusakan = "bisa_diperbaiki" | "rusak_permanen";

export interface PengembalianGroupItem {
  id: string; // dipakai toolId sebagai id grup
  toolId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number; // total gabungan dari semua transaksi pinjam alat ini
}

interface ChecklistState {
  [id: string]: {
    checked: boolean;
    jumlahDikembalikan: number;
    jumlahBisaDiperbaiki: number;
    jumlahRusakPermanen: number;
    // Satu catatan untuk setiap unit rusak (panjang array = jumlah unitnya)
    catatanBisaDiperbaiki: string[];
    catatanRusakPermanen: string[];
  };
}

type FieldCatatan = "catatanBisaDiperbaiki" | "catatanRusakPermanen";

// Sesuaikan jumlah kolom catatan dengan jumlah unit; catatan yang sudah diketik tetap disimpan
const sesuaikanCatatan = (catatan: string[], jumlah: number) =>
  Array.from({ length: jumlah }, (_, i) => catatan[i] ?? "");

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
  items: PengembalianGroupItem[];
  onBack: () => void;
  onSubmit: (items: PengembalianBatchItem[]) => void;
  submitting?: boolean;
}

const emptyRow = (jumlahDipinjam: number) => ({
  checked: false,
  jumlahDikembalikan: jumlahDipinjam,
  jumlahBisaDiperbaiki: 0,
  jumlahRusakPermanen: 0,
  catatanBisaDiperbaiki: [] as string[],
  catatanRusakPermanen: [] as string[],
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

  const handleDikembalikanChange = (id: string, jumlahDikembalikan: number) => {
    setState((prev) => {
      const row = prev[id];
      const jumlahBisaDiperbaiki = Math.min(row.jumlahBisaDiperbaiki, jumlahDikembalikan);
      const jumlahRusakPermanen = Math.min(
        row.jumlahRusakPermanen,
        jumlahDikembalikan - jumlahBisaDiperbaiki
      );
      return {
        ...prev,
        [id]: {
          ...row,
          jumlahDikembalikan,
          jumlahBisaDiperbaiki,
          jumlahRusakPermanen,
          catatanBisaDiperbaiki: sesuaikanCatatan(row.catatanBisaDiperbaiki, jumlahBisaDiperbaiki),
          catatanRusakPermanen: sesuaikanCatatan(row.catatanRusakPermanen, jumlahRusakPermanen),
        },
      };
    });
  };

  const handleJumlahRusakChange = (
    id: string,
    field: "jumlahBisaDiperbaiki" | "jumlahRusakPermanen",
    jumlah: number
  ) => {
    const fieldCatatan: FieldCatatan =
      field === "jumlahBisaDiperbaiki" ? "catatanBisaDiperbaiki" : "catatanRusakPermanen";
    setState((prev) => {
      const row = prev[id];
      return {
        ...prev,
        [id]: { ...row, [field]: jumlah, [fieldCatatan]: sesuaikanCatatan(row[fieldCatatan], jumlah) },
      };
    });
  };

  const updateCatatan = (id: string, field: FieldCatatan, index: number, value: string) => {
    setState((prev) => {
      const catatan = [...prev[id][field]];
      catatan[index] = value;
      return { ...prev, [id]: { ...prev[id], [field]: catatan } };
    });
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
      const kosongBisa = row.catatanBisaDiperbaiki.findIndex((c) => c.trim() === "");
      if (kosongBisa >= 0) {
        setError(
          `Catatan "Bisa Diperbaiki"${row.jumlahBisaDiperbaiki > 1 ? ` unit ke-${kosongBisa + 1}` : ""} untuk "${item.namaBarang}" wajib diisi.`
        );
        return;
      }
      const kosongPermanen = row.catatanRusakPermanen.findIndex((c) => c.trim() === "");
      if (kosongPermanen >= 0) {
        setError(
          `Catatan "Rusak Permanen"${row.jumlahRusakPermanen > 1 ? ` unit ke-${kosongPermanen + 1}` : ""} untuk "${item.namaBarang}" wajib diisi.`
        );
        return;
      }
    }

    setError(null);

    const payload: PengembalianBatchItem[] = dipilih.map((item) => {
      const row = state[item.id];
      // Satu entri per unit rusak agar setiap unit tercatat dengan catatannya sendiri
      const kerusakan: PengembalianKerusakanEntry[] = [
        ...row.catatanBisaDiperbaiki.map((catatan) => ({
          jenisKerusakan: "bisa_diperbaiki" as const,
          jumlah: 1,
          catatan: catatan.trim(),
        })),
        ...row.catatanRusakPermanen.map((catatan) => ({
          jenisKerusakan: "rusak_permanen" as const,
          jumlah: 1,
          catatan: catatan.trim(),
        })),
      ];

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

  // Satu kolom catatan per unit rusak; label "Unit n" muncul bila lebih dari satu unit
  const renderCatatan = (id: string, field: FieldCatatan, catatan: string[]) =>
    catatan.length > 0 && (
      <div className="d-flex flex-column gap-1 mt-1">
        {catatan.map((nilai, i) => (
          <InputGroup size="sm" key={i}>
            {catatan.length > 1 && (
              <InputGroup.Text className="text-secondary" style={{ minWidth: 56 }}>
                Unit {i + 1}
              </InputGroup.Text>
            )}
            <Form.Control
              placeholder="Catatan kerusakan..."
              aria-label={`Catatan kerusakan unit ${i + 1}`}
              value={nilai}
              onChange={(e) => updateCatatan(id, field, i, e.target.value)}
              disabled={submitting}
            />
          </InputGroup>
        ))}
      </div>
    );

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
            {/* align-top: semua isian sejajar di baris atas, catatan kerusakan tumbuh ke bawah */}
            <Table responsive className="align-top mb-0 pengembalian-table" style={{ tableLayout: "fixed", minWidth: 820 }}>
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "28.5%" }} />
                <col style={{ width: "28.5%" }} />
              </colgroup>
              <thead>
                <tr className="align-middle text-nowrap">
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
                      <td className="pengembalian-sejajar">
                        <Form.Check
                          checked={row.checked}
                          onChange={() => toggleCheck(item.id)}
                          disabled={submitting}
                        />
                      </td>
                      <td className="pengembalian-sejajar">
                        <div className="fw-semibold">{item.namaBarang}</div>
                        <div className="text-secondary small">{item.kodeBarang}</div>
                      </td>
                      <td className="pengembalian-sejajar">{item.jumlah}</td>
                      <td>
                        {row.checked ? (
                          <>
                            <Form.Select
                              size="sm"
                              value={row.jumlahDikembalikan}
                              onChange={(e) => handleDikembalikanChange(item.id, Number(e.target.value))}
                              disabled={submitting}
                            >
                              {Array.from({ length: item.jumlah }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </Form.Select>
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
                            <Form.Select
                              size="sm"
                              value={row.jumlahBisaDiperbaiki}
                              onChange={(e) =>
                                handleJumlahRusakChange(item.id, "jumlahBisaDiperbaiki", Number(e.target.value))
                              }
                              disabled={submitting}
                            >
                              {Array.from(
                                { length: row.jumlahDikembalikan - row.jumlahRusakPermanen + 1 },
                                (_, i) => i
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </Form.Select>
                            {renderCatatan(item.id, "catatanBisaDiperbaiki", row.catatanBisaDiperbaiki)}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {row.checked ? (
                          <>
                            <Form.Select
                              size="sm"
                              value={row.jumlahRusakPermanen}
                              onChange={(e) =>
                                handleJumlahRusakChange(item.id, "jumlahRusakPermanen", Number(e.target.value))
                              }
                              disabled={submitting}
                            >
                              {Array.from(
                                { length: row.jumlahDikembalikan - row.jumlahBisaDiperbaiki + 1 },
                                (_, i) => i
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </Form.Select>
                            {renderCatatan(item.id, "catatanRusakPermanen", row.catatanRusakPermanen)}
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
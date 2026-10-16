'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Spinner, Button, Alert } from 'react-bootstrap';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import api from '/lib/api';
import LaporanAnggaranFormModal, {
  PekerjaanItem,
  DisburseItem,
  StatusPekerjaan,
  MONTHS_LONG,
} from './LaporanAnggaranFormModal';

// ---------- Helper (khusus halaman ini) ----------
const STATUS_LABEL: Record<StatusPekerjaan, string> = {
  belum_dikerjakan: 'Belum dikerjakan',
  sedang_dikerjakan: 'Sedang dikerjakan',
  sudah_dikerjakan: 'Sudah dikerjakan',
};

const STATUS_COLOR: Record<StatusPekerjaan, string> = {
  belum_dikerjakan: '#C00000',
  sedang_dikerjakan: '#D97706',
  sudah_dikerjakan: '#1E7B4F',
};

const STATUS_VALID: StatusPekerjaan[] = ['belum_dikerjakan', 'sedang_dikerjakan', 'sudah_dikerjakan'];

const formatRupiah = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

// Postgres numeric bisa terkirim sebagai string, jadi dinormalkan ke number
const normPekerjaan = (r: any): PekerjaanItem => ({
  id: Number(r.id),
  tahun: Number(r.tahun),
  bulan: Number(r.bulan),
  nama_pekerjaan: r.nama_pekerjaan ?? '',
  rincian: r.rincian ?? null,
  biaya: Number(r.biaya) || 0,
  biaya_aktual: r.biaya_aktual === null || r.biaya_aktual === undefined ? null : Number(r.biaya_aktual),
  status: STATUS_VALID.includes(r.status) ? (r.status as StatusPekerjaan) : 'belum_dikerjakan',
  nama_vendor: r.nama_vendor ?? null,
  no_po: r.no_po ?? null,
  keterangan: r.keterangan ?? null,
});

const normDisburse = (r: any): DisburseItem => ({
  id: Number(r.id),
  tahun: Number(r.tahun),
  bulan: Number(r.bulan),
  uraian: r.uraian ?? '',
  nominal: Number(r.nominal) || 0,
});

// Satu baris rincian = satu butir pekerjaan (awalan "-" dibuang agar tidak dobel)
const rincianLines = (rincian: string | null): string[] =>
  (rincian ?? '')
    .split('\n')
    .map((l) => l.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean);

// Gaya tabel mengikuti format laporan Excel
const BORDER = '1.5px solid #000';
const cell: React.CSSProperties = { border: BORDER, padding: '6px 8px', verticalAlign: 'middle', fontSize: '12px' };
const blank: React.CSSProperties = { border: 'none', backgroundColor: '#fff', padding: '0 0 0 8px' };
const head = (bg: string): React.CSSProperties => ({ ...cell, backgroundColor: bg, fontWeight: 700, textAlign: 'center' });

const COLOR_DISBURSE = '#ED7D31';
const COLOR_DIBAYAR = '#92D050';
const COLOR_RENCANA = '#00B0F0';
const COLOR_SISA = '#BFBFBF';

const StatusChip = ({ status }: { status: StatusPekerjaan }) => (
  <span
    className="d-inline-block fw-bold text-white rounded-pill px-3 py-1"
    style={{ backgroundColor: STATUS_COLOR[status], fontSize: '11px' }}
  >
    {STATUS_LABEL[status]}
  </span>
);

const sum = <T,>(list: T[], pick: (x: T) => number) => list.reduce((acc, x) => acc + pick(x), 0);

export default function LaporanAnggaranManager() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = semua bulan
  const [disburse, setDisburse] = useState<DisburseItem[]>([]);
  const [pekerjaan, setPekerjaan] = useState<PekerjaanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<{
    show: boolean;
    jenis: 'pekerjaan' | 'disburse';
    item: PekerjaanItem | DisburseItem | null;
    bulan: number;
  }>({ show: false, jenis: 'pekerjaan', item: null, bulan: now.getMonth() + 1 });

  const openModal = (jenis: 'pekerjaan' | 'disburse', item: PekerjaanItem | DisburseItem | null, bulan: number) =>
    setModal({ show: true, jenis, item, bulan });

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) years.push(y);
    return years;
  }, [currentYear]);

  // ---------- Data (semua lewat endpoint /laporan-anggaran milik halaman ini) ----------
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api(`/laporan-anggaran?tahun=${selectedYear}`, { method: 'GET' });
      const body = res?.data ?? res ?? {};
      setDisburse((Array.isArray(body.disburse) ? body.disburse : []).map(normDisburse));
      setPekerjaan((Array.isArray(body.pekerjaan) ? body.pekerjaan : []).map(normPekerjaan));
    } catch (e: any) {
      console.error('Gagal memuat laporan anggaran', e);
      setError(e?.message || 'Laporan anggaran gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const saveData = async (payload: any, id?: number) => {
    const base = `/laporan-anggaran/${modal.jenis}`;
    if (id) {
      await api(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api(base, { method: 'POST', body: JSON.stringify(payload) });
    }
    setModal((m) => ({ ...m, show: false }));
    await fetchData();
  };

  const deleteData = async (id: number) => {
    await api(`/laporan-anggaran/${modal.jenis}/${id}`, { method: 'DELETE' });
    setModal((m) => ({ ...m, show: false }));
    await fetchData();
  };

  // ---------- Turunan ----------
  const defaultBulan = selectedMonth || now.getMonth() + 1;

  const months = useMemo(() => {
    const set = new Set<number>();
    disburse.forEach((d) => set.add(d.bulan));
    pekerjaan.forEach((p) => set.add(p.bulan));
    return Array.from(set)
      .filter((m) => selectedMonth === 0 || m === selectedMonth)
      .sort((a, b) => a - b);
  }, [disburse, pekerjaan, selectedMonth]);

  const openAddPekerjaan = (bulan: number) => openModal('pekerjaan', null, bulan);
  const openAddDisburse = (bulan: number) => openModal('disburse', null, bulan);

  const renderMonth = (bulan: number) => {
    const namaBulan = MONTHS_LONG[bulan - 1];
    const dis = disburse.filter((d) => d.bulan === bulan);
    const pek = pekerjaan.filter((p) => p.bulan === bulan);
    const dibayar = pek.filter((p) => (p.biaya_aktual ?? 0) > 0);

    const totalDisburse = sum(dis, (d) => d.nominal);
    const totalDibayar = sum(dibayar, (p) => p.biaya_aktual ?? 0);
    const sisa = totalDisburse - totalDibayar;

    return (
      <div key={bulan} className="bg-white shadow-sm rounded-3 mb-4 p-3">
        <div className="text-center fw-bold fs-4 py-2 mb-3" style={{ backgroundColor: '#00FF00', border: '2px solid #000' }}>
          {namaBulan.toUpperCase()}
        </div>

        <div className="table-responsive">
          <table className="table mb-0" style={{ tableLayout: 'fixed', minWidth: 900, borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <tbody>
              {/* ===== Disburse ===== */}
              <tr>
                <td colSpan={2} style={head(COLOR_DISBURSE)}>
                  Disburse bulan {namaBulan} {selectedYear}
                </td>
                <td colSpan={5} style={blank}>
                  <Button size="sm" variant="outline-primary" onClick={() => openAddDisburse(bulan)}>
                    <IconPlus size={14} className="me-1" />
                    Tambah disburse
                  </Button>
                </td>
              </tr>
              {dis.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center text-muted" style={cell}>
                    Belum ada disburse
                  </td>
                  <td colSpan={5} style={blank} />
                </tr>
              ) : (
                dis.map((d) => (
                  <tr key={d.id}>
                    <td style={cell}>{d.uraian}</td>
                    <td className="text-end" style={cell}>
                      {formatRupiah(d.nominal)}
                    </td>
                    <td colSpan={4} style={blank} />
                    <td className="text-center" style={cell}>
                      <Button
                        variant="light"
                        size="sm"
                        className="border"
                        onClick={() => openModal('disburse', d, bulan)}
                      >
                        <IconEdit size={14} className="me-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              <tr>
                <td className="text-center" style={head(COLOR_DISBURSE)}>
                  TOTAL
                </td>
                <td className="text-end" style={head(COLOR_DISBURSE)}>
                  {formatRupiah(totalDisburse)}
                </td>
                <td colSpan={5} style={blank} />
              </tr>

              <tr>
                <td colSpan={7} style={{ ...blank, height: 16 }} />
              </tr>

              {/* ===== Pekerjaan yang dibayarkan (otomatis dari biaya dibayarkan) ===== */}
              <tr>
                <td style={head(COLOR_DIBAYAR)}>
                  Pekerjaan yang dibayarkan bulan {namaBulan} {selectedYear}
                </td>
                <td style={head(COLOR_DIBAYAR)}>Dibayar (Rp)</td>
                <td style={head(COLOR_DIBAYAR)}>Status</td>
                <td style={head(COLOR_DIBAYAR)}>Vendor Pelaksana</td>
                <td style={head(COLOR_DIBAYAR)}>No.PO</td>
                <td style={head(COLOR_DIBAYAR)}>Keterangan</td>
                <td style={blank} />
              </tr>
              {dibayar.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={cell}>
                    Belum ada pekerjaan yang dibayar. Isi &quot;Biaya dibayarkan&quot; pada rencana pekerjaan.
                  </td>
                  <td style={blank} />
                </tr>
              ) : (
                dibayar.map((p) => (
                  <tr key={p.id}>
                    <td style={cell}>{p.nama_pekerjaan}</td>
                    <td className="text-end" style={cell}>
                      {formatRupiah(p.biaya_aktual)}
                    </td>
                    <td className="text-center" style={cell}>
                      <StatusChip status={p.status} />
                    </td>
                    <td className="text-center" style={cell}>
                      {p.nama_vendor || '-'}
                    </td>
                    <td className="text-center" style={cell}>
                      {p.no_po || '-'}
                    </td>
                    <td className="text-center" style={cell}>
                      {p.keterangan || '-'}
                    </td>
                    <td style={blank} />
                  </tr>
                ))
              )}
              <tr>
                <td className="text-center" style={head(COLOR_DIBAYAR)}>
                  TOTAL
                </td>
                <td className="text-end" style={head(COLOR_DIBAYAR)}>
                  {formatRupiah(totalDibayar)}
                </td>
                <td colSpan={5} style={blank} />
              </tr>

              <tr>
                <td colSpan={7} style={{ ...blank, padding: '14px 0 10px 0' }}>
                  <Button size="sm" variant="outline-primary" onClick={() => openAddPekerjaan(bulan)}>
                    <IconPlus size={14} className="me-1" />
                    Tambah rencana pekerjaan
                  </Button>
                </td>
              </tr>

              {/* ===== Rencana pekerjaan ===== */}
              <tr>
                <td style={head(COLOR_RENCANA)}>Rencana Pekerjaan</td>
                <td style={head(COLOR_RENCANA)}>Biaya (Rp)</td>
                <td style={head(COLOR_RENCANA)}>Status</td>
                <td style={head(COLOR_RENCANA)}>Vendor Pelaksana</td>
                <td style={head(COLOR_RENCANA)}>No.PO</td>
                <td style={head(COLOR_RENCANA)}>Keterangan</td>
                <td style={head(COLOR_RENCANA)}>Aksi</td>
              </tr>
              {pek.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted" style={cell}>
                    Belum ada rencana pekerjaan di bulan ini.
                  </td>
                </tr>
              ) : (
                pek.map((p) => (
                  <tr key={p.id}>
                    <td style={cell}>
                      <div className="fw-bold text-dark">{p.nama_pekerjaan}</div>
                      {rincianLines(p.rincian).map((line, i) => (
                        <div key={i} className="text-muted">
                          - {line}
                        </div>
                      ))}
                    </td>
                    <td className="text-end" style={cell}>
                      {formatRupiah(p.biaya)}
                    </td>
                    <td className="text-center" style={cell}>
                      <StatusChip status={p.status} />
                    </td>
                    <td className="text-center" style={cell}>
                      {p.nama_vendor || '-'}
                    </td>
                    <td className="text-center" style={cell}>
                      {p.no_po || '-'}
                    </td>
                    <td className="text-center" style={cell}>
                      {p.keterangan || '-'}
                    </td>
                    <td className="text-center" style={cell}>
                      <Button
                        variant="light"
                        size="sm"
                        className="border"
                        onClick={() => openModal('pekerjaan', p, bulan)}
                      >
                        <IconEdit size={14} className="me-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}

              <tr>
                <td colSpan={7} style={{ ...blank, height: 16 }} />
              </tr>

              {/* ===== Sisa PRK ===== */}
              <tr>
                <td style={{ ...head(COLOR_SISA), textAlign: 'left' }}>Sisa PRK Pemeliharaan</td>
                <td className="text-end" style={{ ...head(COLOR_SISA), color: sisa < 0 ? '#C00000' : '#000' }}>
                  {formatRupiah(sisa)}
                </td>
                <td colSpan={5} style={blank} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Laporan Serapan Anggaran PRK</h3>
          <p className="text-muted mb-0 small">Catat disburse, rencana pekerjaan, dan pembayaran vendor per bulan.</p>
        </div>

        <div className="d-flex flex-wrap align-items-end gap-2">
          <div>
            <Form.Label htmlFor="la-bulan" className="small fw-semibold mb-1">
              Bulan
            </Form.Label>
            <Form.Select
              id="la-bulan"
              style={{ width: '160px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              <option value={0}>Semua bulan</option>
              {MONTHS_LONG.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Form.Select>
          </div>
          <div>
            <Form.Label htmlFor="la-tahun" className="small fw-semibold mb-1">
              Tahun
            </Form.Label>
            <Form.Select id="la-tahun" style={{ width: '120px' }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Form.Select>
          </div>
          <Button variant="outline-primary" onClick={() => openAddDisburse(defaultBulan)}>
            <IconPlus size={16} className="me-1" />
            Tambah disburse
          </Button>
          <Button variant="primary" onClick={() => openAddPekerjaan(defaultBulan)}>
            <IconPlus size={16} className="me-1" />
            Tambah rencana pekerjaan
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center" dismissible onClose={() => setError('')}>
          <span>{error}</span>
          <Button size="sm" variant="outline-danger" onClick={fetchData}>
            Muat ulang
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : months.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm">
          <div className="text-muted">
            <p className="fw-semibold mb-1">
              Belum ada data {selectedMonth ? `di ${MONTHS_LONG[selectedMonth - 1]} ` : 'di tahun '}
              {selectedYear}
            </p>
            <p className="small mb-3">Mulai dengan menambahkan disburse atau rencana pekerjaan.</p>
            <div className="d-flex justify-content-center gap-2">
              <Button size="sm" variant="outline-primary" onClick={() => openAddDisburse(defaultBulan)}>
                Tambah disburse
              </Button>
              <Button size="sm" variant="primary" onClick={() => openAddPekerjaan(defaultBulan)}>
                Tambah rencana pekerjaan
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        months.map(renderMonth)
      )}

      <LaporanAnggaranFormModal
        show={modal.show}
        onHide={() => setModal((m) => ({ ...m, show: false }))}
        tahun={selectedYear}
        jenis={modal.jenis}
        defaultBulan={modal.bulan}
        editItem={modal.item}
        onSave={saveData}
        onDelete={deleteData}
      />
    </div>
  );
}
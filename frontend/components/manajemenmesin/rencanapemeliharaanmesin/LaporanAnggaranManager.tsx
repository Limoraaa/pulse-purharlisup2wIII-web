'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Spinner, Button, Alert, Dropdown, Table, Badge } from 'react-bootstrap';
import { IconEdit, IconPlus, IconDownload, IconWallet, IconTool, IconClipboardList } from '@tabler/icons-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import api from '/lib/api';
import { usePermission } from 'hooks/usePermissions';
import LaporanAnggaranFormModal, {
  PekerjaanItem,
  DisburseItem,
  StatusPekerjaan,
  MONTHS_LONG,
} from './LaporanAnggaranFormModal';

export interface LocalPekerjaanItem extends PekerjaanItem {
  jenis_anggaran: 'disburse' | 'penugasan';
}

const STATUS_LABEL: Record<StatusPekerjaan, string> = {
  belum_dikerjakan: 'Belum dikerjakan',
  sedang_dikerjakan: 'Sedang dikerjakan',
  sudah_dikerjakan: 'Sudah dikerjakan',
};

const STATUS_VARIANT: Record<StatusPekerjaan, string> = {
  belum_dikerjakan: 'danger',
  sedang_dikerjakan: 'warning',
  sudah_dikerjakan: 'success',
};

const STATUS_VALID: StatusPekerjaan[] = ['belum_dikerjakan', 'sedang_dikerjakan', 'sudah_dikerjakan'];

const formatRupiah = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

const normPekerjaan = (r: any): LocalPekerjaanItem => ({
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
  jenis_anggaran: r.jenis_anggaran === 'penugasan' ? 'penugasan' : 'disburse',
});

const normDisburse = (r: any): DisburseItem => ({
  id: Number(r.id),
  tahun: Number(r.tahun),
  bulan: Number(r.bulan),
  uraian: r.uraian ?? '',
  nominal: Number(r.nominal) || 0,
});

const rincianLines = (rincian: string | null): string[] =>
  (rincian ?? '')
    .split('\n')
    .map((l) => l.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean);

const sum = <T,>(list: T[], pick: (x: T) => number) => list.reduce((acc, x) => acc + pick(x), 0);

export default function LaporanAnggaranManager() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const canManage = usePermission('manage_pemeliharaan_mesin');

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [disburse, setDisburse] = useState<DisburseItem[]>([]);
  const [pekerjaan, setPekerjaan] = useState<LocalPekerjaanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<{
    show: boolean;
    jenis: 'pekerjaan' | 'disburse';
    item: LocalPekerjaanItem | DisburseItem | null;
    bulan: number;
    jenisAnggaran: 'disburse' | 'penugasan';
  }>({ show: false, jenis: 'pekerjaan', item: null, bulan: now.getMonth() + 1, jenisAnggaran: 'disburse' });

  const openModal = (
    jenis: 'pekerjaan' | 'disburse',
    item: any,
    bulan: number,
    jenisAnggaran: 'disburse' | 'penugasan' = 'disburse'
  ) => setModal({ show: true, jenis, item, bulan, jenisAnggaran });

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) years.push(y);
    return years;
  }, [currentYear]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api(`/laporan-anggaran?tahun=${selectedYear}`, { method: 'GET' });
      const body = res?.data ?? res ?? {};
      setDisburse((Array.isArray(body.disburse) ? body.disburse : []).map(normDisburse));
      setPekerjaan((Array.isArray(body.pekerjaan) ? body.pekerjaan : []).map(normPekerjaan));
    } catch (e: any) {
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

  const defaultBulan = selectedMonth || now.getMonth() + 1;

  const months = useMemo(() => {
    const set = new Set<number>();
    disburse.forEach((d) => set.add(d.bulan));
    pekerjaan.forEach((p) => set.add(p.bulan));
    return Array.from(set)
      .filter((m) => selectedMonth === 0 || m === selectedMonth)
      .sort((a, b) => a - b);
  }, [disburse, pekerjaan, selectedMonth]);

  const openAddPekerjaan = (bulan: number) => openModal('pekerjaan', null, bulan, 'disburse');
  const openAddPenugasan = (bulan: number) => openModal('pekerjaan', null, bulan, 'penugasan');
  const openAddDisburse = (bulan: number) => openModal('disburse', null, bulan);

  // ================= EXPORT LOGIC =================
  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    const title = selectedMonth === 0
      ? `Laporan Anggaran PRK - Tahun ${selectedYear}`
      : `Laporan Anggaran PRK - ${MONTHS_LONG[selectedMonth - 1]} ${selectedYear}`;
    doc.text(title, 14, 15);

    let finalY = 25;

    months.forEach((bulan) => {
      const namaBulan = MONTHS_LONG[bulan - 1];
      const dis = disburse.filter((d) => d.bulan === bulan);
      const pekAll = pekerjaan.filter((p) => p.bulan === bulan);
      const pekDisburse = pekAll.filter((p) => p.jenis_anggaran !== 'penugasan');
      const pekPenugasan = pekAll.filter((p) => p.jenis_anggaran === 'penugasan');

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Bulan: ${namaBulan.toUpperCase()}`, 14, finalY);
      finalY += 5;

      autoTable(doc, {
        startY: finalY,
        head: [[`Disburse bulan ${namaBulan} ${selectedYear}`, 'Nominal']],
        body: dis.map((d) => [d.uraian, formatRupiah(d.nominal)]),
        theme: 'grid',
        headStyles: { fillColor: [253, 126, 20] },
        foot: [['TOTAL', formatRupiah(sum(dis, (d) => d.nominal))]],
        footStyles: { fillColor: [253, 126, 20], textColor: 255, fontStyle: 'bold' },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;

      autoTable(doc, {
        startY: finalY,
        head: [[`Pekerjaan Disburse bulan ${namaBulan} ${selectedYear}`, 'Biaya (Rp)', 'Status', 'Vendor Pelaksana', 'No.PO', 'Keterangan']],
        body: pekDisburse.map((p) => [p.nama_pekerjaan, formatRupiah(p.biaya_aktual || p.biaya), STATUS_LABEL[p.status], p.nama_vendor || '-', p.no_po || '-', p.keterangan || '-']),
        theme: 'grid',
        headStyles: { fillColor: [25, 135, 84] },
        foot: [['TOTAL DISBURSE', formatRupiah(sum(pekDisburse, (p) => p.biaya_aktual || p.biaya)), '', '', '', '']],
        footStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: 'bold' },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;

      if (pekPenugasan.length > 0) {
        autoTable(doc, {
          startY: finalY,
          head: [[`Pekerjaan Penugasan bulan ${namaBulan} ${selectedYear}`, 'Biaya (Rp)', 'Status', 'Vendor Pelaksana', 'No.PO', 'Keterangan']],
          body: pekPenugasan.map((p) => [p.nama_pekerjaan, formatRupiah(p.biaya), STATUS_LABEL[p.status], p.nama_vendor || '-', p.no_po || '-', p.keterangan || '-']),
          theme: 'grid',
          headStyles: { fillColor: [13, 202, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (finalY > 170 && bulan !== months[months.length - 1]) {
        doc.addPage();
        finalY = 20;
      }
    });

    doc.save(`Laporan_Anggaran_${selectedYear}${selectedMonth !== 0 ? `_${MONTHS_LONG[selectedMonth - 1]}` : ''}.pdf`);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Anggaran ${selectedYear}`);

    const headStyle = (color: string) => ({
      font: { bold: true, color: { argb: 'FF000000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: color } },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    });

    const borderStyle = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    months.forEach((bulan) => {
      const namaBulan = MONTHS_LONG[bulan - 1];
      const dis = disburse.filter((d) => d.bulan === bulan);
      const pekAll = pekerjaan.filter((p) => p.bulan === bulan);
      const pekDisburse = pekAll.filter((p) => p.jenis_anggaran !== 'penugasan');
      const pekPenugasan = pekAll.filter((p) => p.jenis_anggaran === 'penugasan');

      sheet.addRow([`BULAN ${namaBulan.toUpperCase()}`]).font = { bold: true, size: 14 };
      sheet.addRow([]);

      const disRow = sheet.addRow([`Disburse bulan ${namaBulan} ${selectedYear}`, 'Nominal']);
      disRow.eachCell((c) => { c.style = headStyle('FFFFE066') as any; }); // Soft Orange/Yellow
      dis.forEach((d) => {
        const r = sheet.addRow([d.uraian, d.nominal]);
        r.eachCell((c) => { c.border = borderStyle as any; });
      });
      const totalDisRow = sheet.addRow(['TOTAL', sum(dis, (d) => d.nominal)]);
      totalDisRow.eachCell((c) => { c.style = headStyle('FFFFE066') as any; });
      sheet.addRow([]);

      const dibayarRow = sheet.addRow([`Pekerjaan Disburse bulan ${namaBulan} ${selectedYear}`, 'Biaya (Rp)', 'Status', 'Vendor Pelaksana', 'No.PO', 'Keterangan']);
      dibayarRow.eachCell((c) => { c.style = headStyle('FFB2F2BB') as any; }); // Soft Green
      pekDisburse.forEach((p) => {
        const r = sheet.addRow([p.nama_pekerjaan, p.biaya_aktual || p.biaya, STATUS_LABEL[p.status], p.nama_vendor || '-', p.no_po || '-', p.keterangan || '-']);
        r.eachCell((c) => { c.border = borderStyle as any; });
      });
      const totalDibayarRow = sheet.addRow(['TOTAL', sum(pekDisburse, (p) => p.biaya_aktual || p.biaya), '', '', '', '']);
      totalDibayarRow.eachCell((c) => { c.style = headStyle('FFB2F2BB') as any; });
      sheet.addRow([]);

      const rencRow = sheet.addRow([`Pekerjaan Penugasan bulan ${namaBulan} ${selectedYear}`, 'Biaya (Rp)', 'Status', 'Vendor Pelaksana', 'No.PO', 'Keterangan']);
      rencRow.eachCell((c) => { c.style = headStyle('FF99E9F2') as any; }); // Soft Cyan
      pekPenugasan.forEach((p) => {
        const r = sheet.addRow([p.nama_pekerjaan, p.biaya, STATUS_LABEL[p.status], p.nama_vendor || '-', p.no_po || '-', p.keterangan || '-']);
        r.eachCell((c) => { c.border = borderStyle as any; });
      });
      sheet.addRow([]);
      sheet.addRow([]);
    });

    sheet.columns.forEach((col) => { col.width = 25; });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Laporan_Anggaran_${selectedYear}${selectedMonth !== 0 ? `_${MONTHS_LONG[selectedMonth - 1]}` : ''}.xlsx`);
  };

  // ================= UI RENDER =================
  const renderMonth = (bulan: number) => {
    const namaBulan = MONTHS_LONG[bulan - 1];
    const dis = disburse.filter((d) => d.bulan === bulan);
    const pekAll = pekerjaan.filter((p) => p.bulan === bulan);
    
    const pekDisburse = pekAll.filter((p) => p.jenis_anggaran !== 'penugasan');
    const pekPenugasan = pekAll.filter((p) => p.jenis_anggaran === 'penugasan');

    const totalDisburse = sum(dis, (d) => d.nominal);
    const totalPekDisburse = sum(pekDisburse, (p) => p.biaya_aktual || p.biaya);
    const sisa = totalDisburse - totalPekDisburse;

    return (
      <Card key={bulan} className="mb-5 shadow-sm border-0">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-2 px-3 px-md-4">
          <h4 className="fw-bold text-dark mb-0">
            Bulan {namaBulan} {selectedYear}
          </h4>
        </Card.Header>

        <Card.Body className="p-3 p-md-4">
          
          {/* SECTION 1: DISBURSE (WARNING / ORANYE SOFT) */}
          <div className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
                <IconWallet size={20} /> Anggaran Disburse
              </h5>
              {canManage && (
                <Button size="sm" variant="outline-warning" onClick={() => openAddDisburse(bulan)} className="fw-semibold px-3">
                  <IconPlus size={16} className="me-1" /> Tambah Disburse
                </Button>
              )}
            </div>
            
            <Table bordered hover responsive className="align-middle mb-0">
              <thead className="table-warning">
                <tr>
                  <th className="py-2 px-3 w-75">Uraian Disburse</th>
                  <th className="py-2 px-3 text-end">Nominal (Rp)</th>
                  <th className="py-2 px-3 text-center" style={{ width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dis.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-3 fst-italic">Belum ada data disburse.</td>
                  </tr>
                ) : (
                  dis.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3">{d.uraian}</td>
                      <td className="text-end px-3 fw-medium">{formatRupiah(d.nominal)}</td>
                      <td className="text-center px-3">
                        {canManage ? (
                          <Button variant="light" size="sm" className="border shadow-sm text-secondary" onClick={() => openModal('disburse', d, bulan)}>
                            <IconEdit size={14} />
                          </Button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td className="fw-bold px-3 text-end">TOTAL DISBURSE</td>
                  <td className="fw-bold px-3 text-end text-dark">{formatRupiah(totalDisburse)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </Table>
          </div>

          {/* SECTION 2: PEKERJAAN DISBURSE (SUCCESS / HIJAU SOFT) */}
          <div className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-success mb-0 d-flex align-items-center gap-2">
                <IconTool size={20} /> Pekerjaan Disburse
              </h5>
              {canManage && (
                <Button size="sm" variant="outline-success" onClick={() => openAddPekerjaan(bulan)} className="fw-semibold px-3">
                  <IconPlus size={16} className="me-1" /> Tambah Pekerjaan
                </Button>
              )}
            </div>
            
            <Table bordered hover responsive className="align-middle mb-0">
              <thead className="table-success">
                <tr>
                  <th className="py-2 px-3">Nama Pekerjaan</th>
                  <th className="py-2 px-3 text-end">Biaya (Rp)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3">Vendor Pelaksana</th>
                  <th className="py-2 px-3">No. PO</th>
                  <th className="py-2 px-3">Keterangan</th>
                  <th className="py-2 px-3 text-center" style={{ width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pekDisburse.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-3 fst-italic">Belum ada pekerjaan disburse di bulan ini.</td>
                  </tr>
                ) : (
                  pekDisburse.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3">
                        <div className="fw-bold text-dark">{p.nama_pekerjaan}</div>
                        {rincianLines(p.rincian).map((line, i) => (
                          <div key={i} className="text-secondary small ms-2">- {line}</div>
                        ))}
                      </td>
                      <td className="text-end px-3 fw-medium">
                        {formatRupiah(p.biaya_aktual || p.biaya)}
                        {p.biaya_aktual == null && <div className="small text-muted fst-italic">(Estimasi)</div>}
                      </td>
                      <td className="text-center px-3">
                        <Badge bg={STATUS_VARIANT[p.status]} className="px-2 py-1 fw-normal" style={{ fontSize: '12px' }}>
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </td>
                      <td className="px-3">{p.nama_vendor || '-'}</td>
                      <td className="px-3">{p.no_po || '-'}</td>
                      <td className="px-3">{p.keterangan || '-'}</td>
                      <td className="text-center px-3">
                        {canManage ? (
                          <Button variant="light" size="sm" className="border shadow-sm text-secondary" onClick={() => openModal('pekerjaan', p, bulan, 'disburse')}>
                            <IconEdit size={14} />
                          </Button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td className="fw-bold px-3 text-end">TOTAL PEKERJAAN DISBURSE</td>
                  <td className="fw-bold px-3 text-end text-dark">{formatRupiah(totalPekDisburse)}</td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </Table>
          </div>

          {/* SISA PRK CARD */}
          <Alert variant={sisa < 0 ? 'danger' : 'secondary'} className="d-flex justify-content-between align-items-center mb-5 shadow-sm border-0 py-3">
            <div className="fw-bold fs-5">Sisa PRK Pemeliharaan</div>
            <div className="fw-bolder fs-4">{formatRupiah(sisa)}</div>
          </Alert>

          {/* SECTION 3: PEKERJAAN PENUGASAN (INFO / BIRU SOFT) */}
          <div className="mb-2 mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
                <IconClipboardList size={20} /> Pekerjaan Penugasan <Badge bg="secondary" className="ms-2 fw-normal" style={{ fontSize: '11px' }}>Pencatatan</Badge>
              </h5>
              {canManage && (
                <Button size="sm" variant="outline-info" onClick={() => openAddPenugasan(bulan)} className="fw-semibold px-3">
                  <IconPlus size={16} className="me-1" /> Tambah Penugasan
                </Button>
              )}
            </div>
            
            <Table bordered hover responsive className="align-middle mb-0">
              <thead className="table-info">
                <tr>
                  <th className="py-2 px-3">Nama Pekerjaan</th>
                  <th className="py-2 px-3 text-end">Biaya (Rp)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3">Vendor Pelaksana</th>
                  <th className="py-2 px-3">No. PO</th>
                  <th className="py-2 px-3">Keterangan</th>
                  <th className="py-2 px-3 text-center" style={{ width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pekPenugasan.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-3 fst-italic">Belum ada pekerjaan penugasan di bulan ini.</td>
                  </tr>
                ) : (
                  pekPenugasan.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3">
                        <div className="fw-bold text-dark">{p.nama_pekerjaan}</div>
                        {rincianLines(p.rincian).map((line, i) => (
                          <div key={i} className="text-secondary small ms-2">- {line}</div>
                        ))}
                      </td>
                      <td className="text-end px-3 fw-medium">
                        {formatRupiah(p.biaya_aktual || p.biaya)}
                      </td>
                      <td className="text-center px-3">
                        <Badge bg={STATUS_VARIANT[p.status]} className="px-2 py-1 fw-normal" style={{ fontSize: '12px' }}>
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </td>
                      <td className="px-3">{p.nama_vendor || '-'}</td>
                      <td className="px-3">{p.no_po || '-'}</td>
                      <td className="px-3">{p.keterangan || '-'}</td>
                      <td className="text-center px-3">
                        {canManage ? (
                          <Button variant="light" size="sm" className="border shadow-sm text-secondary" onClick={() => openModal('pekerjaan', p, bulan, 'penugasan')}>
                            <IconEdit size={14} />
                          </Button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3">
        <div>
          <h1 className="mb-2 h2">Laporan Serapan Anggaran PRK</h1>
          <p className="text-secondary mb-0">Catat disburse, rencana pekerjaan, dan pembayaran vendor per bulan.</p>
        </div>

        <div className="d-flex flex-wrap align-items-end gap-2">
          <div>
            <Form.Label htmlFor="la-bulan" className="small fw-semibold mb-1">Bulan</Form.Label>
            <Form.Select id="la-bulan" style={{ width: '160px' }} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              <option value={0}>Semua bulan</option>
              {MONTHS_LONG.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </Form.Select>
          </div>
          <div>
            <Form.Label htmlFor="la-tahun" className="small fw-semibold mb-1">Tahun</Form.Label>
            <Form.Select id="la-tahun" style={{ width: '120px' }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Form.Select>
          </div>
          
          <Dropdown className="ms-2">
            <Dropdown.Toggle variant="danger" className="d-flex align-items-center gap-1 shadow-sm">
              <IconDownload size={16} /> PDF
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleExportPDF} disabled={months.length === 0}>Export Laporan PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown>
            <Dropdown.Toggle variant="success" className="d-flex align-items-center gap-1 shadow-sm">
              <IconDownload size={16} /> Excel
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleExportExcel} disabled={months.length === 0}>Export Laporan Excel</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center shadow-sm" dismissible onClose={() => setError('')}>
          <span>{error}</span>
          <Button size="sm" variant="outline-danger" onClick={fetchData}>Muat ulang</Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : months.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm rounded-4">
          <div className="text-muted py-5">
            <h4 className="fw-semibold mb-2">
              Belum ada data {selectedMonth ? `di ${MONTHS_LONG[selectedMonth - 1]} ` : 'di tahun '}
              {selectedYear}
            </h4>
            {canManage && (
              <>
                <p className="mb-4">Mulai kelola anggaran dengan menambahkan disburse atau rencana pekerjaan pertama Anda.</p>
                <div className="d-flex justify-content-center gap-3">
                  <Button variant="outline-warning" onClick={() => openAddDisburse(defaultBulan)} className="px-4 py-2 fw-semibold">
                    <IconPlus size={18} className="me-2" /> Tambah Disburse
                  </Button>
                  <Button variant="outline-success" onClick={() => openAddPekerjaan(defaultBulan)} className="px-4 py-2 fw-semibold">
                    <IconPlus size={18} className="me-2" /> Tambah Pekerjaan
                  </Button>
                </div>
              </>
            )}
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
        defaultJenisAnggaran={modal.jenisAnggaran}
        editItem={modal.item}
        onSave={saveData}
        onDelete={deleteData}
      />
    </div>
  );
}
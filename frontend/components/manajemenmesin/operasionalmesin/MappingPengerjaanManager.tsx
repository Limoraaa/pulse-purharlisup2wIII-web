'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Form, Spinner, Button, Modal, Alert } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import type { DayCellContentArg } from '@fullcalendar/core';
import idLocale from '@fullcalendar/core/locales/id';
import Link from 'next/link';
import api from '/lib/api';
import { usePermission } from 'hooks/usePermissions';

const PLN_BLUE = '#00529C';
const PLN_YELLOW = '#FFC20E';

type StatusKey = 'berjalan' | 'akan' | 'selesai';

// Warna kalender mengikuti status pekerjaan (dihitung dari tanggal hari ini)
const STATUS: Record<StatusKey, { label: string; bg: string; fg: string; soft: string; softFg: string }> = {
  berjalan: { label: 'Sedang berjalan', bg: PLN_BLUE, fg: '#ffffff', soft: '#e6f0fa', softFg: '#00427d' },
  akan: { label: 'Akan datang', bg: PLN_YELLOW, fg: '#3d2e00', soft: '#fff6d9', softFg: '#7a5a00' },
  selesai: { label: 'Selesai', bg: '#dde3ea', fg: '#4a5565', soft: '#eef1f5', softFg: '#4a5565' },
};

// Palet warna per pekerjaan (teks sudah dipilih agar kontras)
const PALETTE = [
  { bg: PLN_BLUE, fg: '#ffffff' },
  { bg: '#0B7F6F', fg: '#ffffff' },
  { bg: '#D9480F', fg: '#ffffff' },
  { bg: '#7048E8', fg: '#ffffff' },
  { bg: '#C2255C', fg: '#ffffff' },
  { bg: PLN_YELLOW, fg: '#3d2e00' },
  { bg: '#2B8A3E', fg: '#ffffff' },
  { bg: '#1971C2', fg: '#ffffff' },
  { bg: '#862E9C', fg: '#ffffff' },
  { bg: '#495057', fg: '#ffffff' },
];

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Variabel warna bawaan FullCalendar (bukan CSS tambahan)
const calVars = {
  '--fc-border-color': '#edf0f4',
  '--fc-today-bg-color': 'rgba(0,82,156,0.06)',
  '--fc-highlight-color': 'rgba(0,82,156,0.14)',
  '--fc-page-bg-color': '#ffffff',
} as React.CSSProperties;

interface Mesin {
  id: number;
  nama_mesin: string;
}

interface Job {
  id: string;
  nama: string;
  mulai: string; // YYYY-MM-DD
  selesai: string; // YYYY-MM-DD, hari terakhir bekerja (inklusif)
  keterangan: string;
}

// Realisasi dari menu Catatan Aktivitas Mesin (hanya ditampilkan, tidak diubah di sini)
interface Aktivitas {
  id: string;
  tanggal: string; // YYYY-MM-DD
  operator: string;
  uraian: string;
  mulai: string; // HH:MM
  selesai: string; // HH:MM
  jumlah: number;
  pemeriksa: string;
}

interface AktivitasApi {
  id: number | string;
  tanggal?: string;
  operator_pelaksana?: string;
  uraian_pekerjaan?: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  jumlah?: number | string;
  pemeriksa?: string;
}

const AKTIVITAS_WARNA = { soft: '#e6f6ec', fg: '#1e7b3c' };

// ---------- Helper tanggal (string YYYY-MM-DD, bebas masalah zona waktu) ----------
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toDateStr = (v: any): string => (v ? String(v).slice(0, 10) : '');

const addDays = (dateStr: string, n: number): string => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const durasiHari = (mulai: string, selesai: string): number => {
  if (!mulai || !selesai) return 0;
  return Math.round((Date.parse(`${selesai}T00:00:00Z`) - Date.parse(`${mulai}T00:00:00Z`)) / 86400000) + 1;
};

const fmt = (s: string, opt: Intl.DateTimeFormatOptions) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('id-ID', { timeZone: 'UTC', ...opt });

const fmtRange = (mulai: string, selesai: string): string => {
  if (mulai === selesai) return fmt(mulai, { day: 'numeric', month: 'short' });
  const sameMonth = mulai.slice(0, 7) === selesai.slice(0, 7);
  return sameMonth
    ? `${fmt(mulai, { day: 'numeric' })}–${fmt(selesai, { day: 'numeric', month: 'short' })}`
    : `${fmt(mulai, { day: 'numeric', month: 'short' })} – ${fmt(selesai, { day: 'numeric', month: 'short' })}`;
};

const statusOf = (mulai: string, selesai: string, today: string): StatusKey => {
  if (selesai && selesai < today) return 'selesai';
  if (mulai && mulai > today) return 'akan';
  return 'berjalan';
};

export default function MappingPengerjaanManager() {
  const calendarRef = useRef<FullCalendar>(null);
  const canManage = usePermission('manage_operasional_mesin');

  const [daftarMesin, setDaftarMesin] = useState<Mesin[]>([]);
  const [selectedMesinId, setSelectedMesinId] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>([]);
  // Tanggal yang diklik -> popup Detail Tanggal (jadwal + log aktivitas)
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);

  // Bulan yang sedang tampil di kalender
  const [month, setMonth] = useState({ title: '', start: '', end: '', year: new Date().getFullYear(), m: new Date().getMonth() });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form (tanggal selesai = HARI TERAKHIR bekerja / inklusif)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const today = ymd(new Date());
  const durasi = useMemo(() => durasiHari(tanggalMulai, tanggalSelesai), [tanggalMulai, tanggalSelesai]);
  const formStatus = statusOf(tanggalMulai, tanggalSelesai, today);

  // ---------- Data ----------
  const fetchMesin = async () => {
    try {
      const res: any = await api('/mesin-produksi', { method: 'GET' });
      const rawData = res?.data ?? res ?? [];
      // Mesin nonaktif tidak dijadwalkan lagi
      const list = (Array.isArray(rawData) ? rawData : []).filter((m: any) => m.status !== 'Tidak Aktif');
      setDaftarMesin(list);
      if (list.length > 0) setSelectedMesinId(list[0].id.toString());
    } catch (error) {
      console.error('Gagal memuat data mesin', error);
      setFetchError('Daftar mesin gagal dimuat. Periksa koneksi lalu coba lagi.');
    }
  };

  const fetchJobs = async (mesinId: string) => {
    if (!mesinId) return;
    setLoading(true);
    setFetchError('');
    try {
      const res: any = await api(`/mapping-pengerjaan?mesin_id=${mesinId}`, { method: 'GET' });
      const rawData = res?.data ?? res ?? [];
      const list: Job[] = (Array.isArray(rawData) ? rawData : []).map((item: any) => {
        const mulai = toDateStr(item.tanggal_mulai ?? item.tanggalMulai);
        return {
          id: String(item.id),
          nama: item.nama_pekerjaan ?? item.namaPekerjaan ?? '(Tanpa nama)',
          mulai,
          selesai: toDateStr(item.tanggal_selesai ?? item.tanggalSelesai) || mulai,
          keterangan: item.keterangan || '',
        };
      });
      setJobs(list);
    } catch (error: any) {
      console.error('Gagal memuat data mapping pengerjaan', error);
      setFetchError(error?.message || 'Jadwal gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  // Log aktivitas mesin yang sama, dihubungkan ke kalender berdasarkan tanggal
  const fetchAktivitas = async (mesinId: string) => {
    if (!mesinId) return;
    try {
      const res = await api<{ data?: AktivitasApi[] } | AktivitasApi[]>(`/log-aktivitas/mesin/${mesinId}`, { method: 'GET' });
      const rawData = Array.isArray(res) ? res : res?.data ?? [];
      const list: Aktivitas[] = rawData.map((item) => ({
        id: String(item.id),
        tanggal: toDateStr(item.tanggal),
        operator: item.operator_pelaksana ?? '-',
        uraian: item.uraian_pekerjaan ?? '',
        mulai: String(item.waktu_mulai ?? '').slice(0, 5),
        selesai: String(item.waktu_selesai ?? '').slice(0, 5),
        jumlah: Number(item.jumlah) || 0,
        pemeriksa: item.pemeriksa ?? '-',
      }));
      setAktivitas(list);
    } catch (error) {
      console.error('Gagal memuat log aktivitas', error);
      setAktivitas([]);
      setFetchError(error instanceof Error ? error.message : 'Log aktivitas gagal dimuat.');
    }
  };

  useEffect(() => {
    fetchMesin();
  }, []);

  useEffect(() => {
    if (selectedMesinId) {
      fetchJobs(selectedMesinId);
      fetchAktivitas(selectedMesinId);
    }
  }, [selectedMesinId]);

  // ---------- Turunan data ----------
  const agenda = useMemo(
    () =>
      jobs
        .filter((j) => month.start && j.mulai < month.end && j.selesai >= month.start)
        .sort((a, b) => a.mulai.localeCompare(b.mulai) || a.selesai.localeCompare(b.selesai)),
    [jobs, month]
  );

  const counts = useMemo(() => {
    const c: Record<StatusKey, number> = { berjalan: 0, akan: 0, selesai: 0 };
    agenda.forEach((j) => (c[statusOf(j.mulai, j.selesai, today)] += 1));
    return c;
  }, [agenda, today]);

  // Pekerjaan yang terlihat di bulan ini dapat warna berurutan agar pasti berbeda
  const colorMap = useMemo(() => {
    const map: Record<string, number> = {};
    let i = 0;
    agenda.forEach((j) => {
      map[j.id] = i++ % PALETTE.length;
    });
    jobs.forEach((j) => {
      if (!(j.id in map)) map[j.id] = i++ % PALETTE.length;
    });
    return map;
  }, [agenda, jobs]);

  const events = useMemo(
    () =>
      jobs.map((j) => {
        const st = statusOf(j.mulai, j.selesai, today);
        const warna = PALETTE[colorMap[j.id] ?? 0];
        return {
          id: j.id,
          title: j.nama,
          start: j.mulai,
          end: addDays(j.selesai, 1), // FullCalendar: end eksklusif, jadi +1 hari
          allDay: true,
          backgroundColor: warna.bg,
          borderColor: warna.bg,
          textColor: warna.fg,
          classNames: st === 'selesai' ? ['opacity-75'] : [],
          extendedProps: { keterangan: j.keterangan, mulai: j.mulai, selesai: j.selesai, status: st, fg: warna.fg },
        };
      }),
    [jobs, today, colorMap]
  );

  const aktivitasByDate = useMemo(() => {
    const map: Record<string, Aktivitas[]> = {};
    aktivitas.forEach((a) => {
      if (!a.tanggal) return;
      (map[a.tanggal] ??= []).push(a);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.mulai.localeCompare(b.mulai)));
    return map;
  }, [aktivitas]);

  const aktivitasBulanIni = useMemo(
    () => aktivitas.filter((a) => month.start && a.tanggal >= month.start && a.tanggal < month.end).length,
    [aktivitas, month]
  );

  const detailJobs = useMemo(
    () => (detailDate ? jobs.filter((j) => j.mulai <= detailDate && j.selesai >= detailDate) : []),
    [jobs, detailDate]
  );
  const detailAktivitas = detailDate ? aktivitasByDate[detailDate] ?? [] : [];

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const ys = new Set<number>([month.year]);
    for (let y = now - 3; y <= now + 3; y++) ys.add(y);
    jobs.forEach((j) => {
      ys.add(Number(j.mulai.slice(0, 4)));
      ys.add(Number(j.selesai.slice(0, 4)));
    });
    return Array.from(ys).filter(Boolean).sort((a, b) => a - b);
  }, [jobs, month.year]);

  const handleDatesSet = useCallback((arg: any) => {
    const next = {
      title: arg.view.title as string,
      start: ymd(arg.view.currentStart),
      end: ymd(arg.view.currentEnd),
      year: arg.view.currentStart.getFullYear() as number,
      m: arg.view.currentStart.getMonth() as number,
    };
    setMonth((prev) => (prev.start === next.start && prev.title === next.title ? prev : next));
  }, []);

  // ---------- Modal ----------
  const openModal = (mode: 'create' | 'edit', data: Partial<Job> & { mulai: string; selesai: string }) => {
    setModalMode(mode);
    setSelectedId(data.id ?? null);
    setNamaPekerjaan(data.nama ?? '');
    setTanggalMulai(data.mulai);
    setTanggalSelesai(data.selesai);
    setKeterangan(data.keterangan ?? '');
    setFormError('');
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setConfirmDelete(false);
    calendarRef.current?.getApi().unselect(); // hilangkan blok seleksi di kalender
  };

  const handleDateSelect = (info: any) => {
    if (!selectedMesinId) return;
    openModal('create', {
      mulai: toDateStr(info.startStr),
      selesai: addDays(toDateStr(info.endStr), -1), // end eksklusif -> inklusif
    });
  };

  // Klik satu tanggal -> Detail Tanggal (drag beberapa tanggal tetap untuk menambah jadwal)
  const handleDateClick = (info: DateClickArg) => {
    if (!selectedMesinId) return;
    setDetailDate(toDateStr(info.dateStr));
  };

  const tambahDariDetail = () => {
    const tgl = detailDate as string;
    setDetailDate(null);
    openModal('create', { mulai: tgl, selesai: tgl });
  };

  const bukaJadwalDariDetail = (j: Job) => {
    setDetailDate(null);
    openModal('edit', j);
  };

  const handleEventClick = (info: any) => {
    const ev = info.event;
    openModal('edit', {
      id: ev.id,
      nama: ev.title,
      mulai: ev.extendedProps.mulai,
      selesai: ev.extendedProps.selesai,
      keterangan: ev.extendedProps.keterangan,
    });
  };

  // Geser atau tarik bar di kalender -> simpan otomatis
  const handleEventChange = async (info: any) => {
    const ev = info.event;
    const mulai = toDateStr(ev.startStr);
    const selesai = ev.endStr ? addDays(toDateStr(ev.endStr), -1) : mulai;
    try {
      await api(`/mapping-pengerjaan/${ev.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nama_pekerjaan: ev.title,
          tanggal_mulai: mulai,
          tanggal_selesai: selesai,
          keterangan: ev.extendedProps.keterangan || null,
        }),
      });
      fetchJobs(selectedMesinId);
    } catch (error: any) {
      console.error('Gagal memperbarui jadwal', error);
      setFetchError(error?.message || 'Jadwal gagal diperbarui.');
      info.revert();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tanggalSelesai < tanggalMulai) {
      setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        mesin_id: selectedMesinId,
        nama_pekerjaan: namaPekerjaan,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        keterangan: keterangan || null,
      };
      if (modalMode === 'create') {
        await api('/mapping-pengerjaan', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await api(`/mapping-pengerjaan/${selectedId}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      closeModal();
      fetchJobs(selectedMesinId);
    } catch (error: any) {
      console.error('Gagal menyimpan data pengerjaan', error);
      setFormError(error?.message || 'Jadwal gagal disimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api(`/mapping-pengerjaan/${selectedId}`, { method: 'DELETE' });
      closeModal();
      fetchJobs(selectedMesinId);
    } catch (error: any) {
      console.error('Gagal menghapus data', error);
      setFormError(error?.message || 'Jadwal gagal dihapus. Coba lagi.');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  const cal = () => calendarRef.current?.getApi();
  const goTo = (year: number, m: number) => cal()?.gotoDate(`${year}-${String(m + 1).padStart(2, '0')}-01`);
  const namaMesinTerpilih = daftarMesin.find((m) => String(m.id) === selectedMesinId)?.nama_mesin;

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Mapping Pengerjaan Mesin</h3>
          <p className="text-muted mb-0 small">
            {canManage
              ? 'Klik tanggal untuk melihat jadwal & log aktivitas. Blok beberapa tanggal untuk menambah jadwal; geser atau tarik tepi jadwal untuk mengubahnya.'
              : 'Klik tanggal untuk melihat jadwal & log aktivitas, atau klik jadwal untuk melihat detailnya.'}
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-end gap-2">
          <div>
            <Form.Label htmlFor="mp-mesin" className="small fw-semibold mb-1">
              Mesin
            </Form.Label>
            <Form.Select
              id="mp-mesin"
              style={{ minWidth: 240 }}
              value={selectedMesinId}
              onChange={(e) => setSelectedMesinId(e.target.value)}
            >
              {daftarMesin.map((mesin) => (
                <option key={mesin.id} value={mesin.id}>
                  {mesin.nama_mesin}
                </option>
              ))}
            </Form.Select>
          </div>
          {canManage && (
            <Button
              variant="primary"
              disabled={!selectedMesinId}
              onClick={() => openModal('create', { mulai: today, selesai: today })}
            >
              + Tambah jadwal
            </Button>
          )}
        </div>
      </div>

      {fetchError && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center" dismissible onClose={() => setFetchError('')}>
          <span>{fetchError}</span>
          {selectedMesinId && (
            <Button size="sm" variant="outline-danger" onClick={() => fetchJobs(selectedMesinId)}>
              Muat ulang
            </Button>
          )}
        </Alert>
      )}

      <div className="row g-4">
        {/* Kalender */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 position-relative">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <Button variant="outline-secondary" size="sm" aria-label="Bulan sebelumnya" onClick={() => cal()?.prev()}>
                  ‹
                </Button>
                <Form.Select
                  size="sm"
                  aria-label="Pilih bulan"
                  style={{ width: 'auto' }}
                  value={month.m}
                  onChange={(e) => goTo(month.year, Number(e.target.value))}
                >
                  {BULAN.map((nama, idx) => (
                    <option key={nama} value={idx}>
                      {nama}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select
                  size="sm"
                  aria-label="Pilih tahun"
                  style={{ width: 'auto' }}
                  value={month.year}
                  onChange={(e) => goTo(Number(e.target.value), month.m)}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
                <Button variant="outline-secondary" size="sm" aria-label="Bulan berikutnya" onClick={() => cal()?.next()}>
                  ›
                </Button>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => cal()?.today()}>
                Hari ini
              </Button>
            </div>

            {/* Ringkasan status jadwal di bulan yang tampil */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {(Object.keys(STATUS) as StatusKey[]).map((k) => (
                <span key={k} className="badge rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold" style={{ background: STATUS[k].soft, color: STATUS[k].softFg }}>
                  {STATUS[k].label}
                  <strong className="ms-1">{counts[k]}</strong>
                </span>
              ))}
              <span className="badge rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold" style={{ background: AKTIVITAS_WARNA.soft, color: AKTIVITAS_WARNA.fg }}>
                ✓ Log aktivitas
                <strong className="ms-1">{aktivitasBulanIni}</strong>
              </span>
            </div>

            {loading && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 rounded-4" style={{ zIndex: 5 }}>
                <Spinner animation="border" variant="primary" />
              </div>
            )}

            <div style={calVars}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={idLocale}
                headerToolbar={false}
                datesSet={handleDatesSet}
                selectable={canManage}
                selectMinDistance={5}
                editable={canManage}
                dateClick={handleDateClick}
                eventResizableFromStart
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventChange}
                eventResize={handleEventChange}
                events={events}
                dayMaxEvents={3}
                dayHeaderClassNames={['small', 'text-muted']}
                eventClassNames={['rounded-1', 'border-0', 'mx-1', 'mt-1']}
                moreLinkClassNames={['small', 'fw-semibold']}
                height="auto"
                dayCellContent={(arg: DayCellContentArg) => {
                  const n = aktivitasByDate[ymd(arg.date)]?.length ?? 0;
                  return (
                    <span className="d-inline-flex align-items-center gap-1">
                      {n > 0 && (
                        <span
                          className="badge rounded-pill fw-semibold"
                          style={{ background: AKTIVITAS_WARNA.soft, color: AKTIVITAS_WARNA.fg, fontSize: '0.68rem' }}
                          title={`${n} log aktivitas`}
                        >
                          ✓ {n}
                        </span>
                      )}
                      {arg.dayNumberText}
                    </span>
                  );
                }}
                eventContent={(arg: any) => (
                  <div
                    className="px-2 text-truncate"
                    style={{ color: arg.event.extendedProps.fg, fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.6 }}
                    title={`${arg.event.title}${arg.event.extendedProps.keterangan ? ' - ' + arg.event.extendedProps.keterangan : ''}`}
                  >
                    {arg.event.extendedProps.status === 'selesai' ? '✓ ' : ''}
                    {arg.event.title}
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Agenda bulan ini */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
            <h6 className="fw-bold mb-1">Agenda {month.title}</h6>
            <p className="text-muted small mb-3">{namaMesinTerpilih ?? 'Belum ada mesin dipilih'}</p>

            {agenda.length === 0 ? (
              <div className="border rounded-3 p-4 text-center bg-light">
                <p className="fw-semibold mb-1">Belum ada jadwal di bulan ini</p>
                {canManage && (
                  <>
                    <p className="text-muted small mb-3">Blok tanggal di kalender, atau tambahkan langsung dari tombol di bawah.</p>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      disabled={!selectedMesinId}
                      onClick={() => openModal('create', { mulai: today, selesai: today })}
                    >
                      Tambah jadwal
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {agenda.map((j) => {
                  const st = statusOf(j.mulai, j.selesai, today);
                  return (
                    <div
                      key={j.id}
                      role="button"
                      tabIndex={0}
                      className="bg-white text-start w-100 border rounded-3 p-3"
                      style={{ borderLeft: `5px solid ${PALETTE[colorMap[j.id] ?? 0].bg}`, cursor: 'pointer' }}
                      onClick={() => openModal('edit', j)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openModal('edit', j);
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <span className="fw-semibold text-dark">{j.nama}</span>
                        <span className="badge rounded-pill" style={{ background: STATUS[st].soft, color: STATUS[st].softFg }}>
                          {STATUS[st].label}
                        </span>
                      </div>
                      <div className="text-muted small mt-1">
                        {fmtRange(j.mulai, j.selesai)} ({durasiHari(j.mulai, j.selesai)} hari)
                      </div>
                      {j.keterangan && <div className="small mt-1 text-muted text-truncate">{j.keterangan}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Tanggal: jadwal (rencana) + log aktivitas (realisasi) pada tanggal yang diklik */}
      <Modal show={!!detailDate} onHide={() => setDetailDate(null)} centered size="lg" contentClassName="border-0 rounded-4">
        <Modal.Header closeButton className="border-0 pb-0">
          <div>
            <Modal.Title className="fw-bold fs-5">
              Detail {detailDate ? fmt(detailDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </Modal.Title>
            <div className="text-muted small">{namaMesinTerpilih ?? ''}</div>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="text-uppercase text-muted fw-bold small mb-2" style={{ letterSpacing: '0.5px', fontSize: '0.72rem' }}>
            Jadwal pada tanggal ini ({detailJobs.length})
          </div>
          {detailJobs.length === 0 ? (
            <div className="border rounded-3 p-3 text-muted small bg-light mb-4">Tidak ada jadwal pengerjaan pada tanggal ini.</div>
          ) : (
            <div className="d-flex flex-column gap-2 mb-4">
              {detailJobs.map((j) => {
                const st = statusOf(j.mulai, j.selesai, today);
                return (
                  <div
                    key={j.id}
                    role="button"
                    tabIndex={0}
                    className="border rounded-3 p-3 bg-white"
                    style={{ borderLeft: `5px solid ${PALETTE[colorMap[j.id] ?? 0].bg}`, cursor: 'pointer' }}
                    onClick={() => bukaJadwalDariDetail(j)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        bukaJadwalDariDetail(j);
                      }
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <span className="fw-semibold text-dark">{j.nama}</span>
                      <span className="badge rounded-pill" style={{ background: STATUS[st].soft, color: STATUS[st].softFg }}>
                        {STATUS[st].label}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      {fmtRange(j.mulai, j.selesai)} ({durasiHari(j.mulai, j.selesai)} hari)
                      {j.keterangan ? ` · ${j.keterangan}` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-uppercase text-muted fw-bold small mb-2" style={{ letterSpacing: '0.5px', fontSize: '0.72rem' }}>
            Log aktivitas ({detailAktivitas.length})
          </div>
          {detailAktivitas.length === 0 ? (
            <div className="border rounded-3 p-3 text-muted small bg-light">Belum ada log aktivitas yang dicatat pada tanggal ini.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {detailAktivitas.map((a) => (
                <div key={a.id} className="border rounded-3 p-3" style={{ borderLeft: `5px solid ${AKTIVITAS_WARNA.fg}` }}>
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <span className="fw-semibold text-dark">
                      {a.mulai}–{a.selesai} · {a.operator}
                    </span>
                    <span className="badge rounded-pill" style={{ background: AKTIVITAS_WARNA.soft, color: AKTIVITAS_WARNA.fg }}>
                      Jumlah {a.jumlah}
                    </span>
                  </div>
                  <div className="small mt-1">{a.uraian}</div>
                  <div className="text-muted small mt-1">Pemeriksa: {a.pemeriksa}</div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-between">
          <Link href={`/operasional/data-mesin?mesin=${selectedMesinId}`} className="btn btn-outline-secondary">
            Lihat di Catatan Aktivitas
          </Link>
          <div className="d-flex gap-2">
            <Button variant="light" type="button" onClick={() => setDetailDate(null)}>
              Tutup
            </Button>
            {canManage && (
              <Button variant="primary" type="button" onClick={tambahDariDetail}>
                + Tambah jadwal di tanggal ini
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal tambah / kelola */}
      <Modal show={isModalOpen} onHide={closeModal} centered contentClassName="border-0 rounded-4">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <div>
              <Modal.Title className="fw-bold fs-5">
                {modalMode === 'create' ? 'Tambah jadwal pengerjaan' : canManage ? 'Kelola jadwal pengerjaan' : 'Detail jadwal pengerjaan'}
              </Modal.Title>
              {modalMode === 'edit' && (
                <span className="badge rounded-pill mt-2" style={{ background: STATUS[formStatus].soft, color: STATUS[formStatus].softFg }}>
                  {STATUS[formStatus].label}
                </span>
              )}
            </div>
          </Modal.Header>
          <Modal.Body>
            {/* User "Lihat saja" hanya bisa melihat detail, semua input dikunci */}
            <fieldset disabled={!canManage}>
            {formError && (
              <Alert variant="danger" className="py-2 small">
                {formError}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Nama pekerjaan</Form.Label>
              <Form.Control
                type="text"
                required
                autoFocus
                value={namaPekerjaan}
                onChange={(e) => setNamaPekerjaan(e.target.value)}
                placeholder="Contoh: Perbaikan & overhaul mesin"
              />
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Label className="fw-semibold small">Tanggal mulai</Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={tanggalMulai}
                  onChange={(e) => {
                    setTanggalMulai(e.target.value);
                    if (tanggalSelesai && e.target.value > tanggalSelesai) setTanggalSelesai(e.target.value);
                  }}
                />
              </div>
              <div className="col-6">
                <Form.Label className="fw-semibold small">Tanggal selesai</Form.Label>
                <Form.Control type="date" required min={tanggalMulai} value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
              </div>
            </div>
            <div className="bg-light rounded-3 px-3 py-2 small mb-3">
              {durasi > 0 ? (
                <>
                  <strong>{durasi} hari kerja</strong>
                  <span className="text-muted"> · {fmtRange(tanggalMulai, tanggalSelesai)}. Tanggal selesai dihitung sebagai hari terakhir pengerjaan.</span>
                </>
              ) : (
                <span className="text-muted">Tanggal selesai dihitung sebagai hari terakhir pengerjaan.</span>
              )}
            </div>

            <Form.Group>
              <Form.Label className="fw-semibold small">Keterangan</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Detail, instruksi, atau catatan pengerjaan"
              />
            </Form.Group>
            </fieldset>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 justify-content-between">
            {modalMode === 'edit' && canManage ? (
              confirmDelete ? (
                <div className="d-flex align-items-center gap-2">
                  <Button variant="danger" size="sm" type="button" onClick={handleDelete} disabled={saving}>
                    Ya, hapus jadwal
                  </Button>
                  <Button variant="link" size="sm" type="button" className="text-muted" onClick={() => setConfirmDelete(false)}>
                    Tidak jadi
                  </Button>
                </div>
              ) : (
                <Button variant="outline-danger" type="button" onClick={() => setConfirmDelete(true)} disabled={saving}>
                  Hapus
                </Button>
              )
            ) : (
              <div />
            )}
            <div className="d-flex gap-2">
              <Button variant="light" type="button" onClick={closeModal} disabled={saving}>
                {canManage ? 'Batal' : 'Tutup'}
              </Button>
              {canManage && (
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan jadwal'}
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
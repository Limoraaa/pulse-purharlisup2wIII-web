"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Row, Col, Card, CardBody, Spinner, Alert, Badge, Button, ProgressBar } from "react-bootstrap";
import {
  IconTool,
  IconServer,
  IconAlertTriangle,
  IconPlus,
  IconClipboardCheck,
  IconCalendarEvent,
  IconCalendarDue,
  IconTrendingUp,
  IconBellRinging,
  IconMoodSmile,
  IconAdjustmentsAlt,
  IconCertificate,
  IconReportMoney,
  IconActivity,
  IconCalendarTime,
  IconDatabase,
} from "@tabler/icons-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

import Flex from "components/common/Flex";
import StatCard from "components/dashboard/StatCard";
import api from "lib/api";
import { usePermission } from "hooks/usePermissions";
import { fetchRencana } from "services/rencanaPemeliharaanService";
import {
  ACTION_META,
  PEMELIHARAAN_MESIN_PATH,
  formatJadwal,
  getStatusTampil,
} from "components/manajemenmesin/rencanapemeliharaanmesin/RencanaHelpers";
import {
  StatusPekerjaan,
  MONTHS_LONG,
} from "components/manajemenmesin/rencanapemeliharaanmesin/LaporanAnggaranFormModal";

// Sesuaikan kedua route ini dengan route halaman di aplikasimu
const RENCANA_PATH = "/pemeliharaan/rencana";
const LAPORAN_ANGGARAN_PATH = "/pemeliharaan/laporan-anggaran";
const DATA_MESIN_PATH = "/data-mesin";
const AKTIVITAS_MESIN_PATH = "/operasional/data-mesin";
const PLOTTING_JADWAL_PATH = "/operasional/mapping-pengerjaan";

// ---------- Tipe respons /pemeliharaan/dashboard-stats ----------
interface AktivitasItem {
  id: string | number;
  // Gabungan log pemeliharaan (Pemeliharaan) & log aktivitas harian (Operasional)
  jenis?: "pemeliharaan" | "aktivitas";
  nama_mesin: string;
  deskripsi: string;
  tanggal: string | null;
  status?: string;
  sesuai_rencana?: boolean;
}

interface KalibrasiReminder {
  id: number;
  mesin_id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  jatuh_tempo: string;
  status: "terlewat" | "mendekat";
}

interface TrenItem {
  tanggal: string;
  pemeliharaan: number;
  aktivitas: number;
  total: number;
}

interface DashboardStats {
  total_mesin: number;
  mesin_perbaikan: number;
  pemeliharaan_rutin: number; 
  total_log_aktivitas?: number;
  aktivitas_terbaru: AktivitasItem[];
  tren?: TrenItem[];
  kalibrasi_mendekat?: KalibrasiReminder[]; 
}

// ---------- Laporan anggaran (endpoint /laporan-anggaran) ----------
interface AnggaranPekerjaan {
  id: number;
  bulan: number;
  nama_pekerjaan: string;
  biaya: number;
  biaya_aktual: number | null;
  status: StatusPekerjaan;
  nama_vendor: string | null;
}

interface AnggaranData {
  totalDisburse: number;
  pekerjaan: AnggaranPekerjaan[];
}

const STATUS_PEKERJAAN: StatusPekerjaan[] = ["belum_dikerjakan", "sedang_dikerjakan", "sudah_dikerjakan"];

const STATUS_META: Record<StatusPekerjaan, { label: string; color: string }> = {
  belum_dikerjakan: { label: "Belum dikerjakan", color: "#C00000" },
  sedang_dikerjakan: { label: "Sedang dikerjakan", color: "#D97706" },
  sudah_dikerjakan: { label: "Sudah dikerjakan", color: "#1E7B4F" },
};

const formatRupiah = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

const formatWaktu = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTanggalSaja = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ---------- Komponen kecil ----------
const LinkIf = ({ href, children }: { href: string | null; children: React.ReactNode }) =>
  href ? (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      {children}
    </Link>
  ) : (
    <div style={{ display: "block" }}>{children}</div>
  );

interface ShortcutProps {
  href: string;
  enabled: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: "primary" | "success" | "warning" | "info" | "danger";
}

const Shortcut = ({ href, enabled, icon, title, desc, tone }: ShortcutProps) => {
  const body = (
    <div
      className="p-3 border rounded-3 bg-light d-flex align-items-center gap-3 hover-bg-light transition"
      style={enabled ? undefined : { opacity: 0.6 }}
    >
      <div className={`p-2 text-white rounded-2 ${enabled ? `bg-${tone}` : "bg-secondary"}`}>{icon}</div>
      <div>
        <h6 className="mb-0 text-dark fw-semibold">{title}</h6>
        <small className="text-secondary">{enabled ? desc : "Tidak ada akses"}</small>
      </div>
    </div>
  );
  return (
    <div className="mb-3">
      {enabled ? (
        <Link href={href} style={{ textDecoration: "none" }} className="d-block">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
};

const StatusPill = ({ status }: { status: StatusPekerjaan }) => (
  <span
    className="d-inline-block fw-bold text-white rounded-pill px-2 py-1"
    style={{ backgroundColor: STATUS_META[status].color, fontSize: "0.7rem" }}
  >
    {STATUS_META[status].label}
  </span>
);

const DashboardPemeliharaanManager = () => {
  const canViewMesin = usePermission("view_pemeliharaan_mesin");
  const canProcess = usePermission("process_pemeliharaan_mesin");
  const canViewOperasional = usePermission("view_operasional_mesin");
  const canViewDataMesin = usePermission("view_data_mesin");

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hari, setHari] = useState(30);
  const [tren, setTren] = useState<TrenItem[]>([]);

  const chartData = useMemo(
    () =>
      tren.map((t) => ({
        tanggal: new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        pemeliharaan: t.pemeliharaan ?? t.total,
        aktivitas: t.aktivitas ?? 0,
      })),
    [tren]
  );

  // 1. Fetch Data Statistik Utama (Mesin, Tren, Kalibrasi)
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api<any>(`/pemeliharaan/dashboard-stats?hari=${hari}`, { method: "GET" });

        if (response && response.success) {
          setSummary(response.data);
          setTren(response.data.tren || []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat data dashboard pemeliharaan";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [hari]);

  // 2. Fetch Data Rencana Pemeliharaan Langsung ke Service Rencana
  const { data: rencanaList } = useSWR(
    `/rencana-pemeliharaan?tahun=${currentYear}`,
    () => fetchRencana(currentYear)
  );

  // 2b. Fetch Laporan Anggaran (disburse + pekerjaan) tahun berjalan
  const { data: anggaran, error: anggaranError } = useSWR<AnggaranData>(
    `/laporan-anggaran?tahun=${currentYear}`,
    async () => {
      const res: any = await api(`/laporan-anggaran?tahun=${currentYear}`, { method: "GET" });
      const body = res?.data ?? res ?? {};
      const disburse: any[] = Array.isArray(body.disburse) ? body.disburse : [];
      const pekerjaan: any[] = Array.isArray(body.pekerjaan) ? body.pekerjaan : [];
      return {
        totalDisburse: disburse.reduce((acc, d) => acc + (Number(d.nominal) || 0), 0),
        pekerjaan: pekerjaan.map((r) => ({
          id: Number(r.id),
          bulan: Number(r.bulan),
          nama_pekerjaan: r.nama_pekerjaan ?? "",
          biaya: Number(r.biaya) || 0,
          biaya_aktual: r.biaya_aktual === null || r.biaya_aktual === undefined ? null : Number(r.biaya_aktual),
          status: STATUS_PEKERJAAN.includes(r.status) ? (r.status as StatusPekerjaan) : "belum_dikerjakan",
          nama_vendor: r.nama_vendor ?? null,
        })),
      };
    }
  );

  // 3. Olah Data Rencana untuk Kalkulasi Statistik
  const statsRencana = useMemo(() => {
    if (!rencanaList) return { bulanIniTotal: 0, bulanIniSelesai: 0, terlewatTotal: 0 };
    
    const bulanIni = rencanaList.filter((r) => r.bulan === currentMonth);
    return {
      bulanIniTotal: bulanIni.length,
      bulanIniSelesai: bulanIni.filter((r) => r.status === "Selesai").length,
      terlewatTotal: rencanaList.filter((r) => getStatusTampil(r, today) === "Terlewat").length,
    };
  }, [rencanaList, currentMonth, today]);

  // 3b. Olah Data Anggaran: serapan + pemetaan status pengerjaan
  const statsAnggaran = useMemo(() => {
    const pekerjaan = anggaran?.pekerjaan ?? [];
    const totalDisburse = anggaran?.totalDisburse ?? 0;
    const totalDibayar = pekerjaan.reduce((acc, p) => acc + ((p.biaya_aktual ?? 0) > 0 ? (p.biaya_aktual ?? 0) : 0), 0);
    const sisa = totalDisburse - totalDibayar;
    const persen = totalDisburse > 0 ? Math.min(100, Math.round((totalDibayar / totalDisburse) * 100)) : 0;

    const perStatus = STATUS_PEKERJAAN.map((s) => {
      const list = pekerjaan.filter((p) => p.status === s);
      return { status: s, jumlah: list.length, biaya: list.reduce((acc, p) => acc + p.biaya, 0) };
    });

    return { totalDisburse, totalDibayar, sisa, persen, perStatus, totalPekerjaan: pekerjaan.length };
  }, [anggaran]);

  // 4. Filter Rencana yang Perlu Masuk Reminder (Terlewat atau Bulan Ini)
  const reminderRencana = useMemo(() => {
    if (!rencanaList) return [];
    return rencanaList.filter((r) => {
      const status = getStatusTampil(r, today);
      if (status === "Selesai") return false; 
      if (status === "Terlewat") return true; 
      if (status === "Terjadwal" && r.bulan <= currentMonth) return true; 
      
      return false;
    });
  }, [rencanaList, today, currentMonth]);

  // 4b. Pekerjaan anggaran yang belum selesai dan jadwalnya sudah masuk bulan ini atau sebelumnya
  const reminderAnggaran = useMemo(
    () =>
      (anggaran?.pekerjaan ?? [])
        .filter((p) => p.status !== "sudah_dikerjakan" && p.bulan <= currentMonth)
        .sort((a, b) => a.bulan - b.bulan),
    [anggaran, currentMonth]
  );

  const PageHeader = (
    <Row>
      <Col>
        <Flex justifyContent="between" alignItems="center" className="page-header mb-4 w-100" breakpoint="md">
          <div>
            <h1 className="mb-2 h2">Dashboard Manajemen Mesin Produksi</h1>
            <p className="text-secondary mb-0">
              Ringkasan jadwal, log aktivitas, kalibrasi, anggaran, dan kondisi mesin produksi.
            </p>
          </div>
          {(canViewOperasional || canViewMesin) && (
            <div className="mt-3 mt-md-0 d-flex flex-wrap gap-2">
              {canViewOperasional && (
                <Link href={AKTIVITAS_MESIN_PATH}>
                  <Button variant="outline-primary" className="d-flex align-items-center gap-2">
                    <IconPlus size={18} /> Catat Log Aktivitas
                  </Button>
                </Link>
              )}
              {canViewMesin && (
                <Link href={PEMELIHARAAN_MESIN_PATH}>
                  <Button variant="primary" className="d-flex align-items-center gap-2">
                    <IconPlus size={18} /> Catat Log Pemeliharaan
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Flex>
      </Col>
    </Row>
  );

  if (loading) {
    return (
      <>
        {PageHeader}
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" className="me-2" />
          Memuat dashboard pemeliharaan...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {PageHeader}
        <Alert variant="danger">{error}</Alert>
      </>
    );
  }

  const aktivitas = summary?.aktivitas_terbaru ?? [];
  const kalibrasi = summary?.kalibrasi_mendekat ?? [];
  
  const mesinHref = canViewDataMesin ? DATA_MESIN_PATH : canViewMesin ? PEMELIHARAAN_MESIN_PATH : null;
  const rencanaHref = canViewMesin ? RENCANA_PATH : null;
  const anggaranHref = canViewMesin ? LAPORAN_ANGGARAN_PATH : null;

  const noReminders = reminderRencana.length === 0 && kalibrasi.length === 0 && reminderAnggaran.length === 0;

  return (
    <>
      {PageHeader}

      {/* Baris 1: Ringkasan utama */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={6} xl={3}>
          <LinkIf href={mesinHref}>
            <StatCard
              icon={<IconServer size={26} />}
              title="Total Mesin Terdaftar"
              value={summary?.total_mesin ?? 0}
              variant="primary"
            />
          </LinkIf>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <LinkIf href={mesinHref}>
            <StatCard
              icon={<IconAlertTriangle size={26} />}
              title="Mesin Maintenance / Rusak"
              value={summary?.mesin_perbaikan ?? 0}
              variant="danger"
            />
          </LinkIf>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <LinkIf href={rencanaHref}>
            <StatCard
              icon={<IconCalendarEvent size={26} />}
              title={`Rencana Bulan Ini (${statsRencana.bulanIniSelesai} selesai)`}
              value={statsRencana.bulanIniTotal}
              variant="success"
            />
          </LinkIf>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <LinkIf href={rencanaHref}>
            <StatCard
              icon={<IconCalendarDue size={26} />}
              title="Rencana Terlewat"
              value={statsRencana.terlewatTotal}
              variant="danger"
            />
          </LinkIf>
        </Col>
      </Row>

      {/* Baris 1b: Serapan anggaran PRK + pemetaan status pengerjaan */}
      <Row className="g-3 mb-4">
        <Col lg={5}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <IconReportMoney size={22} className="text-primary" /> Serapan Anggaran PRK {currentYear}
                </h5>
                {anggaranHref && (
                  <Link href={anggaranHref} className="small text-decoration-none">
                    Lihat laporan
                  </Link>
                )}
              </div>

              {anggaranError ? (
                <p className="text-danger small mb-0">Data laporan anggaran gagal dimuat.</p>
              ) : !anggaran ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between small text-secondary mb-1">
                    <span>Dibayarkan dari disburse</span>
                    <span className="fw-semibold text-dark">{statsAnggaran.persen}%</span>
                  </div>
                  <ProgressBar now={statsAnggaran.persen} variant="success" style={{ height: 10 }} className="mb-3" />

                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-secondary small">Total disburse</span>
                    <span className="fw-semibold">{formatRupiah(statsAnggaran.totalDisburse)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-secondary small">Total dibayarkan</span>
                    <span className="fw-semibold">{formatRupiah(statsAnggaran.totalDibayar)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2">
                    <span className="text-secondary small">Sisa PRK pemeliharaan</span>
                    <span className="fw-bold" style={{ color: statsAnggaran.sisa < 0 ? "#C00000" : "#000" }}>
                      {formatRupiah(statsAnggaran.sisa)}
                    </span>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Status Pengerjaan Rencana Pekerjaan</h5>
                <span className="text-secondary small">{statsAnggaran.totalPekerjaan} pekerjaan</span>
              </div>

              {anggaranError ? (
                <p className="text-danger small mb-0">Data laporan anggaran gagal dimuat.</p>
              ) : !anggaran ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : statsAnggaran.totalPekerjaan === 0 ? (
                <p className="text-secondary small mb-0">Belum ada rencana pekerjaan di tahun {currentYear}.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {statsAnggaran.perStatus.map((s) => {
                    const lebar = Math.round((s.jumlah / statsAnggaran.totalPekerjaan) * 100);
                    return (
                      <div key={s.status}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="d-inline-block rounded-circle"
                              style={{ width: 10, height: 10, backgroundColor: STATUS_META[s.status].color }}
                            />
                            <span className="fw-semibold small">{STATUS_META[s.status].label}</span>
                          </div>
                          <span className="small text-secondary">
                            {s.jumlah} pekerjaan &middot; {formatRupiah(s.biaya)}
                          </span>
                        </div>
                        <div className="rounded-pill bg-light" style={{ height: 8, overflow: "hidden" }}>
                          <div
                            style={{ width: `${lebar}%`, height: "100%", backgroundColor: STATUS_META[s.status].color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 2: Tren aktivitas + WIDGET REMINDER */}
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <IconTrendingUp className="text-primary" size={20} />
                  <h5 className="mb-0">Tren Log Pemeliharaan & Aktivitas</h5>
                </div>
                <div className="d-flex gap-1">
                  {[7, 30, 90].map((h) => (
                    <Button
                      key={h}
                      size="sm"
                      variant={hari === h ? "primary" : "outline-secondary"}
                      className="py-1 px-2"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => setHari(h)}
                    >
                      {h} hari
                    </Button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006492" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#006492" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAktivitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tanggal" fontSize={12} stroke="#a0a0a0" minTickGap={24} />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#a0a0a0" />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="pemeliharaan"
                    name="Log pemeliharaan"
                    stroke="#006492"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="aktivitas"
                    name="Log aktivitas"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAktivitas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </Col>

        {/* WIDGET REMINDER PEMELIHARAAN & KALIBRASI */}
        <Col lg={5}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody className="d-flex flex-column">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <IconBellRinging size={22} className="text-warning" /> Reminder &amp; Jatuh Tempo
              </h5>

              {noReminders ? (
                <div className="text-center py-5 mt-auto mb-auto">
                  <IconMoodSmile size={48} className="text-success opacity-50 mb-2" />
                  <p className="text-secondary small mb-0">
                    Semua jadwal aman. Tidak ada pemeliharaan, kalibrasi, atau pekerjaan anggaran yang tertunda atau mendekati batas waktu.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  
                  {/* List Kalibrasi Mendekat / Overdue */}
                  {kalibrasi.map((k) => (
                    <div
                      key={`kal-${k.id}`}
                      className={`d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-2 ${k.status === 'terlewat' ? 'border-danger bg-danger-subtle' : 'border-warning bg-warning-subtle'}`}
                    >
                      <div className="d-flex align-items-center gap-2 min-w-0" style={{ flex: "1 1 200px" }}>
                        <span className="d-inline-flex align-items-center justify-content-center rounded bg-white border flex-shrink-0" style={{ width: 28, height: 28 }}>
                          <IconAdjustmentsAlt size={16} className={k.status === 'terlewat' ? 'text-danger' : 'text-warning'} />
                        </span>
                        <div className="min-w-0">
                          <div className="fw-semibold text-break" title={k.nama_mesin}>
                            [Kalibrasi] {k.kode_mesin}
                          </div>
                          <div className="text-secondary small">Jatuh Tempo: {formatTanggalSaja(k.jatuh_tempo)}</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {k.status === "terlewat" ? (
                           <Badge bg="danger" pill>Terlewat</Badge>
                        ) : (
                           <Badge bg="warning" text="dark" pill>Mendekat</Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* List Pekerjaan Anggaran yang belum selesai */}
                  {reminderAnggaran.map((p) => {
                    const isTerlewat = p.bulan < currentMonth;
                    return (
                      <div
                        key={`ang-${p.id}`}
                        className={`d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-2 ${isTerlewat ? 'border-danger bg-danger-subtle' : ''}`}
                      >
                        <div className="d-flex align-items-center gap-2 min-w-0" style={{ flex: "1 1 200px" }}>
                          <span className="d-inline-flex align-items-center justify-content-center rounded bg-white border flex-shrink-0" style={{ width: 28, height: 28 }}>
                            <IconReportMoney size={16} style={{ color: STATUS_META[p.status].color }} />
                          </span>
                          <div className="min-w-0">
                            <div className="fw-semibold text-break" title={p.nama_pekerjaan}>
                              [Anggaran] {p.nama_pekerjaan}
                            </div>
                            <div className="text-secondary small">
                              {MONTHS_LONG[p.bulan - 1]} {currentYear} &middot; {p.nama_vendor || "Vendor belum diisi"}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          {isTerlewat && <Badge bg="danger" pill>Terlewat</Badge>}
                          <StatusPill status={p.status} />
                        </div>
                      </div>
                    );
                  })}

                  {/* List Pemeliharaan Rutin (Rencana) */}
                  {reminderRencana.map((r) => {
                    const meta = ACTION_META[r.aksi];
                    const statusTampil = getStatusTampil(r, today);
                    const isTerlewat = statusTampil === "Terlewat";

                    // PERBAIKAN LOGIKA WARNA DI SINI
                    const iconBg = isTerlewat ? "#dc3545" : "#fff"; // Merah jika terlewat, putih jika terjadwal
                    const iconText = isTerlewat ? "#fff" : (meta?.color || "#000"); // Teks putih jika merah, teks warna-warni jika putih
                    const iconBorder = isTerlewat ? "#dc3545" : (meta?.color || "#ccc");

                    return (
                      <div
                        key={`ren-${r.id}`}
                        className={`d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-2 ${isTerlewat ? 'border-danger bg-danger-subtle' : ''}`}
                      >
                        <div className="d-flex align-items-center gap-2 min-w-0" style={{ flex: "1 1 200px" }}>
                          <span
                            className="d-inline-flex align-items-center justify-content-center rounded fw-bold flex-shrink-0"
                            style={{ 
                              width: 28, 
                              height: 28, 
                              fontSize: 13, 
                              backgroundColor: iconBg, 
                              color: iconText,
                              border: `1px solid ${iconBorder}`
                            }}
                            title={meta?.label}
                          >
                            {r.aksi}
                          </span>
                          <div className="min-w-0">
                            <div className="fw-semibold text-break" title={r.namaMesin}>
                              {r.kodeMesin}
                            </div>
                            <div className="text-secondary small">{formatJadwal(r)}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          {isTerlewat && <Badge bg="danger" pill>Terlewat</Badge>}
                          {canProcess && (
                            <Link
                              href={`${PEMELIHARAAN_MESIN_PATH}?mesin=${r.mesinId}&rencana=${r.id}`}
                              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                            >
                              <IconClipboardCheck size={14} /> Kerjakan
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 3: Aktivitas terbaru + akses cepat */}
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Log Aktivitas & Pemeliharaan Terbaru</h5>
                <span className="text-secondary small">
                  {summary?.pemeliharaan_rutin ?? 0} log pemeliharaan &middot; {summary?.total_log_aktivitas ?? 0} log aktivitas
                </span>
              </div>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada log mesin yang tercatat.</p>
              ) : (
                <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0 dash-list">
                    {aktivitas.map((item) => (
                      <li key={item.id} className="px-3 py-3 rounded border-bottom bg-white hover-bg-light transition">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                          <div className="min-w-0">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-semibold text-dark fs-6">{item.nama_mesin}</span>
                              <Badge
                                bg={item.jenis === "aktivitas" ? "warning-subtle" : "primary-subtle"}
                                text={item.jenis === "aktivitas" ? "warning-emphasis" : "primary-emphasis"}
                                style={{ fontSize: "0.65rem" }}
                              >
                                {item.jenis === "aktivitas" ? "Aktivitas" : "Pemeliharaan"}
                              </Badge>
                            </div>
                            <div className="small text-secondary mt-1">{item.deskripsi}</div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                              {item.tanggal ? formatWaktu(item.tanggal) : "-"}
                            </div>
                          </div>
                          {item.jenis !== "aktivitas" && (
                          <Badge
                            bg={item.status === "rusak" ? "danger" : item.status === "perlu_perhatian" ? "warning" : "success"}
                            text={item.status === "perlu_perhatian" ? "dark" : undefined}
                            className="flex-shrink-0 px-2 py-1 text-uppercase"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {item.status === "rusak"
                              ? "Rusak"
                              : item.status === "perlu_perhatian"
                              ? "Perlu perhatian"
                              : item.status === "baik"
                              ? "Baik"
                              : "Selesai / Tercatat"}
                          </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <h5 className="mb-3">Akses Modul Manajemen Mesin</h5>

              <Shortcut
                href={DATA_MESIN_PATH}
                enabled={canViewDataMesin}
                icon={<IconDatabase size={20} />}
                title="Data Mesin"
                desc="Tambah, edit, dan nonaktifkan mesin"
                tone="primary"
              />

              <Shortcut
                href={AKTIVITAS_MESIN_PATH}
                enabled={canViewOperasional}
                icon={<IconActivity size={20} />}
                title="Catatan Aktivitas Mesin"
                desc="Log aktivitas operasional harian"
                tone="warning"
              />

              <Shortcut
                href={PLOTTING_JADWAL_PATH}
                enabled={canViewOperasional}
                icon={<IconCalendarTime size={20} />}
                title="Plotting Jadwal Operasional"
                desc="Kalender jadwal pengerjaan per mesin"
                tone="info"
              />

              <Shortcut
                href={PEMELIHARAAN_MESIN_PATH}
                enabled={canViewMesin}
                icon={<IconTool size={20} />}
                title="Catatan Pemeliharaan Mesin"
                desc="Log pemeliharaan, IK, dan checklist visual"
                tone="primary"
              />

              <Shortcut
                href={RENCANA_PATH}
                enabled={canViewMesin}
                icon={<IconCalendarEvent size={20} />}
                title="Rencana Pemeliharaan"
                desc="Jadwal mingguan pemeliharaan mesin"
                tone="warning"
              />

              <Shortcut
                href="/pemeliharaan/kalibrasi"
                enabled={canViewMesin}
                icon={<IconCertificate size={20} />}
                title="Sertifikasi & Kalibrasi"
                desc="Riwayat kelayakan dan jadwal kalibrasi"
                tone="info"
              />

              <Shortcut
                href={LAPORAN_ANGGARAN_PATH}
                enabled={canViewMesin}
                icon={<IconReportMoney size={20} />}
                title="Laporan Anggaran PRK"
                desc="Disburse, rencana pekerjaan, dan pembayaran vendor"
                tone="success"
              />

            </CardBody>
          </Card>
        </Col>
      </Row>
      <div className="mb-5"></div>
    </>
  );
};

export default DashboardPemeliharaanManager;
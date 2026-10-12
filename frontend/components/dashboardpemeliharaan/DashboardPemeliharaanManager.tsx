"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Row, Col, Card, CardBody, Spinner, Alert, Badge, Button } from "react-bootstrap";
import {
  IconTool,
  IconServer,
  IconAlertTriangle,
  IconPlus,
  IconClipboardCheck,
  IconCalendarEvent,
  IconCalendarDue,
  IconTrendingUp,
  IconActivity,
} from "@tabler/icons-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import Flex from "components/common/Flex";

import StatCard from "components/dashboard/StatCard";
import api from "lib/api";
import { usePermission } from "hooks/usePermissions";
import { AksiRencana } from "types/RencanaPemeliharaanTypes";
import {
  ACTION_META,
  PEMELIHARAAN_MESIN_PATH,
  RENCANA_PATH,
  formatJadwal,
} from "components/pemeliharaanmesin/RencanaHelpers";

// ---------- Tipe respons /pemeliharaan/dashboard-stats ----------
interface AktivitasItem {
  id: number;
  nama_mesin: string;
  deskripsi: string;
  tanggal: string | null;
  status?: string;
  sesuai_rencana?: boolean;
}

interface RencanaPerBulan {
  bulan: number;
  selesai: number;
  terlewat: number;
  menunggu: number;
}

interface RencanaPerluItem {
  id: number | string;
  mesin_id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  aksi: AksiRencana;
  tahun: number;
  bulan: number;
  minggu: number;
  terlewat: boolean;
}

interface RencanaRingkasan {
  tahun: number;
  total: number;
  selesai: number;
  bulan_ini_total: number;
  bulan_ini_selesai: number;
  terlewat_total: number;
  per_bulan: RencanaPerBulan[];
  perlu_dikerjakan: RencanaPerluItem[];
  perlu_dikerjakan_total: number;
}

interface TrenItem {
  tanggal: string;
  total: number;
}

interface DashboardStats {
  total_mesin: number;
  mesin_perbaikan: number;
  pemeliharaan_rutin: number; // total kegiatan pemeliharaan yang tercatat
  aktivitas_terbaru: AktivitasItem[];
  tren?: TrenItem[];
  rencana?: RencanaRingkasan;
}

const formatWaktu = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
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
  tone: "primary" | "success" | "warning";
}

const Shortcut = ({ href, enabled, icon, title, desc, tone }: ShortcutProps) => {
  const body = (
    <div
      className="p-3 border rounded-3 bg-light d-flex align-items-center gap-3"
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

const DashboardPemeliharaanManager = () => {
  const canViewMesin = usePermission("view_pemeliharaan_mesin");
  const canProcess = usePermission("process_pemeliharaan_mesin");

  const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hari, setHari] = useState(30);
  const [tren, setTren] = useState<TrenItem[]>([]);

  const chartData = useMemo(
    () =>
      tren.map((t) => ({
        tanggal: new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        total: t.total,
      })),
    [tren]
  );

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

  const PageHeader = (
    <Row>
      <Col>
        <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
          <div>
            <h1 className="mb-2 h2">Dashboard Pemeliharaan</h1>
            <p className="text-secondary mb-0">
              Ringkasan jadwal, pelaksanaan, dan kondisi mesin produksi.
            </p>
          </div>
          {canViewMesin && (
            <div className="mt-3 mt-md-0">
              <Link href={PEMELIHARAAN_MESIN_PATH}>
                <Button variant="primary" className="d-flex align-items-center gap-2">
                  <IconPlus size={18} /> Catat Log Pemeliharaan
                </Button>
              </Link>
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
  const rencana = summary?.rencana;
  const mesinHref = canViewMesin ? PEMELIHARAAN_MESIN_PATH : null;
  const rencanaHref = canViewMesin ? RENCANA_PATH : null;

  return (
    <>
      {PageHeader}

      {/* Baris 1: Ringkasan utama */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={6} xl={3}>
          <LinkIf href={mesinHref}>
            <StatCard
              icon={<IconServer size={26} />}
              title="Total Mesin Terdaftar"
              value={summary?.total_mesin ?? 0}
              variant="primary"
            />
          </LinkIf>
        </Col>
        <Col xs={12} md={6} xl={3}>
          <LinkIf href={mesinHref}>
            <StatCard
              icon={<IconAlertTriangle size={26} />}
              title="Mesin Dalam Perbaikan"
              value={summary?.mesin_perbaikan ?? 0}
              variant="danger"
            />
          </LinkIf>
        </Col>
        <Col xs={12} md={6} xl={3}>
          <LinkIf href={rencanaHref}>
            <StatCard
              icon={<IconCalendarEvent size={26} />}
              title={`Rencana Bulan Ini (${rencana?.bulan_ini_selesai ?? 0} selesai)`}
              value={rencana?.bulan_ini_total ?? 0}
              variant="success"
            />
          </LinkIf>
        </Col>
        <Col xs={12} md={6} xl={3}>
          <LinkIf href={rencanaHref}>
            <StatCard
              icon={<IconCalendarDue size={26} />}
              title="Rencana Terlewat"
              value={rencana?.terlewat_total ?? 0}
              variant="danger"
            />
          </LinkIf>
        </Col>
      </Row>

      {/* Baris 2: Tren aktivitas + daftar yang perlu dikerjakan */}
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <IconTrendingUp className="text-primary" size={20} />
                  <h5 className="mb-0">Tren Aktivitas Pemeliharaan</h5>
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
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tanggal" fontSize={12} stroke="#a0a0a0" minTickGap={24} />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#a0a0a0" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Jumlah log"
                    stroke="#006492"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <h5 className="mb-3">Perlu Dikerjakan</h5>

              {!rencana || rencana.perlu_dikerjakan.length === 0 ? (
                <p className="text-secondary small mb-0">
                  Tidak ada rencana yang tertunda. Semua jadwal sampai bulan ini sudah dikerjakan.
                </p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {rencana.perlu_dikerjakan.map((r) => {
                    const meta = ACTION_META[r.aksi];
                    return (
                      <div
                        key={r.id}
                        className="d-flex justify-content-between align-items-center gap-2 border rounded p-2"
                      >
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          <span
                            className="d-inline-flex align-items-center justify-content-center rounded fw-bold flex-shrink-0"
                            style={{ width: 28, height: 28, fontSize: 13, background: meta.color, color: meta.textColor }}
                            title={meta.label}
                          >
                            {r.aksi}
                          </span>
                          <div className="text-truncate">
                            <div className="fw-semibold text-truncate" title={r.nama_mesin}>
                              {r.kode_mesin}
                            </div>
                            <div className="text-secondary small">{formatJadwal(r)}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          {r.terlewat && <Badge bg="danger" pill>Terlewat</Badge>}
                          {canProcess && (
                            <Link
                              href={`${PEMELIHARAAN_MESIN_PATH}?mesin=${r.mesin_id}&rencana=${r.id}`}
                              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                            >
                              <IconClipboardCheck size={14} /> Kerjakan
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {rencana.perlu_dikerjakan_total > rencana.perlu_dikerjakan.length && (
                    <Link href={RENCANA_PATH} className="small">
                      Lihat semua di Rencana Pemeliharaan
                    </Link>
                  )}
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
                <h5 className="mb-0">Aktivitas Pemeliharaan Terbaru</h5>
                <span className="text-secondary small">
                  {summary?.pemeliharaan_rutin ?? 0} kegiatan tercatat
                </span>
              </div>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada aktivitas pemeliharaan tercatat.</p>
              ) : (
                <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0 dash-list">
                    {aktivitas.map((item) => (
                      <li key={item.id} className="px-3 py-3 rounded border-bottom bg-white hover-bg-light transition">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div>
                            <div className="fw-semibold text-dark fs-6">{item.nama_mesin}</div>
                            <div className="small text-secondary mt-1">{item.deskripsi}</div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                              {item.tanggal ? formatWaktu(item.tanggal) : "-"}
                            </div>
                          </div>
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
              <h5 className="mb-3">Akses Modul Cepat</h5>
              <Shortcut
                href={PEMELIHARAAN_MESIN_PATH}
                enabled={canViewMesin}
                icon={<IconTool size={20} />}
                title="Kelola Data Mesin"
                desc="Tambah & lihat spesifikasi unit"
                tone="primary"
              />
              <Shortcut
                href={RENCANA_PATH}
                enabled={canViewMesin}
                icon={<IconCalendarEvent size={20} />}
                title="Rencana Pemeliharaan"
                desc="Jadwal mingguan per mesin"
                tone="warning"
              />
              <Shortcut
                href="/pemeliharaan/motor-konversi"
                enabled={canViewMesin}
                icon={<IconActivity size={20} />}
                title="Pemeliharaan Motor Konversi"
                desc="Monitoring unit konversi khusus"
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
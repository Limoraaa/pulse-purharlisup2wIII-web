"use client";
import { useEffect, useState } from "react";
// Menggunakan Link bawaan Next.js yang aman dari hydration crash
import Link from "next/link"; 
import { Row, Col, Card, CardBody, Spinner, Alert, Badge } from "react-bootstrap";
import {
  IconTool,
  IconPackage,
  IconUsers,
  IconClockHour4,
  IconAlertTriangle,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  DashboardSummary,
  StokMenipisItem,
  TelatKembaliItem,
  AlatTerpopulerItem,
  ConsumableTerpopulerItem,
  KerusakanSummary,
  AktivitasItem,
  TrenPeminjamanItem,
} from "types/DashboardTypes";

import {
  getDashboardSummary,
  getStokMenipis,
  getTelatKembali,
  getAlatTerpopuler,
  getConsumableTerpopuler,
  getKerusakanSummary,
  getAktivitasTerbaru,
  getTrenPeminjaman,
} from "services/dashboardService";

// import custom components
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import StatCard from "components/dashboard/StatCard";

const formatWaktu = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const jenisLabel: Record<AktivitasItem["jenis"], { label: string; color: string }> = {
  peminjaman: { label: "Peminjaman", color: "primary" },
  pengembalian: { label: "Pengembalian", color: "success" },
  consumable_keluar: { label: "Ambil Bahan", color: "info" },
  kerusakan: { label: "Kerusakan", color: "danger" },
};

const DashboardManager = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stokMenipis, setStokMenipis] = useState<StokMenipisItem[]>([]);
  const [telatKembali, setTelatKembali] = useState<TelatKembaliItem[]>([]);
  const [alatTerpopuler, setAlatTerpopuler] = useState<AlatTerpopulerItem[]>([]);
  const [consumableTerpopuler, setConsumableTerpopuler] = useState<ConsumableTerpopulerItem[]>([]);
  const [kerusakan, setKerusakan] = useState<KerusakanSummary | null>(null);
  const [aktivitas, setAktivitas] = useState<AktivitasItem[]>([]);
  const [tren, setTren] = useState<TrenPeminjamanItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          summaryData,
          stokData,
          telatData,
          alatData,
          consumableData,
          kerusakanData,
          aktivitasData,
          trenData,
        ] = await Promise.all([
          getDashboardSummary(),
          getStokMenipis(),
          getTelatKembali(),
          getAlatTerpopuler(),
          getConsumableTerpopuler(),
          getKerusakanSummary(),
          getAktivitasTerbaru(),
          getTrenPeminjaman(),
        ]);

        setSummary(summaryData);
        setStokMenipis(stokData);
        setTelatKembali(telatData);
        setAlatTerpopuler(alatData);
        setConsumableTerpopuler(consumableData);
        setKerusakan(kerusakanData);
        setAktivitas(aktivitasData);
        setTren(trenData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat data dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const PageHeader = (
    <Row>
      <Col>
        <Flex
          justifyContent="between"
          alignItems="center"
          className="mb-4 w-100"
          breakpoint="md"
        >
          <div>
            <h1 className="mb-2 h2">Dashboard</h1>
            <p className="text-secondary mb-0">
              Ringkasan aktivitas dan kondisi inventaris Ruang Tools.
            </p>
            <DasherBreadcrumb />
          </div>
        </Flex>
      </Col>
    </Row>
  );

  if (loading) {
    return (
      <>
        {PageHeader}
        <div className="text-center py-6">
          <Spinner animation="border" size="sm" className="me-2" />
          Memuat dashboard...
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

  return (
    <>
      {PageHeader}

      {/* Baris 1: Ringkasan Utama dengan komponen Link menggunakan URL yang tepat */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={6} xl={3}>
          <Link 
            href="/inventaris/data-tools" 
            style={{ textDecoration: "none", color: "inherit", display: "block" }} 
            title="Menuju halaman Data Tools"
          >
            <StatCard
              icon={<IconTool size={26} />}
              title="Total Tools"
              value={summary?.total_tools ?? 0}
              variant="primary"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link 
            href="/inventaris/data-consumable" 
            style={{ textDecoration: "none", color: "inherit", display: "block" }} 
            title="Menuju halaman Data Consumable"
          >
            <StatCard
              icon={<IconPackage size={26} />}
              title="Total Consumable"
              value={summary?.total_consumables ?? 0}
              variant="info"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link 
            href="/inventaris/data-peminjam" 
            style={{ textDecoration: "none", color: "inherit", display: "block" }} 
            title="Menuju halaman Data Peminjam"
          >
            <StatCard
              icon={<IconUsers size={26} />}
              title="Total Peminta"
              value={summary?.total_peminta ?? 0}
              variant="success"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link 
            href="/transaksi/peminjaman-aktif" 
            style={{ textDecoration: "none", color: "inherit", display: "block" }} 
            title="Menuju halaman Peminjaman Aktif"
          >
            <StatCard
              icon={<IconClockHour4 size={26} />}
              title="Sedang Dipinjam"
              value={summary?.sedang_dipinjam ?? 0}
              variant="warning"
            />
          </Link>
        </Col>
      </Row>

      {/* Baris 2: Perlu Perhatian */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconAlertTriangle className="text-danger" size={20} />
                <h5 className="mb-0">Stok Consumable Menipis</h5>
              </div>
              {stokMenipis.length === 0 ? (
                <p className="text-secondary small mb-0">Semua stok aman.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {stokMenipis.map((item) => (
                    <li
                      key={item.id}
                      className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom"
                    >
                      <div>
                        <div className="fw-semibold text-dark">
                          {item.nama} <span className="text-secondary fw-normal">({item.kode_barang})</span>
                        </div>
                      </div>
                      <Badge bg={item.stok_awal === 0 ? "danger" : "warning"}>
                        {item.stok_awal} unit
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconClockHour4 className="text-warning" size={20} />
                <h5 className="mb-0">Belum Dikembalikan &gt; 30 Hari</h5>
              </div>
              {telatKembali.length === 0 ? (
                <p className="text-secondary small mb-0">Tidak ada yang terlambat.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {telatKembali.map((item) => (
                    <li key={item.id} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom">
                      <span>
                        {item.nama_barang} — {item.nama_peminjam}
                      </span>
                      <Badge bg="danger">{item.hari_terlambat} hari</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 3: Grafik & Aktivitas */}
      <Row className="g-3 mb-4">
        <Col md={7}>
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconTrendingUp className="text-primary" size={20} />
                <h5 className="mb-0">Tren Peminjaman (30 Hari Terakhir)</h5>
              </div>
              {tren.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tren}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="tanggal"
                      tickFormatter={(val) =>
                        new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                      }
                      fontSize={12}
                    />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip
                      labelFormatter={(val) =>
                        new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#006492"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#006492" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="card-lg h-100">
            <CardBody>
              <h5 className="mb-3">Aktivitas Terbaru</h5>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada aktivitas.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list" style={{ maxHeight: 260, overflowY: "auto" }}>
                  {aktivitas.map((item, idx) => (
                    <li key={idx} className="px-2 py-2 rounded border-bottom">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <span className="small">{item.deskripsi}</span>
                        <Badge bg={jenisLabel[item.jenis].color} className="flex-shrink-0">
                          {jenisLabel[item.jenis].label}
                        </Badge>
                      </div>
                      <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                        {formatWaktu(item.waktu)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 4: Insight Tambahan */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="card-lg h-100">
            <CardBody>
              <h6 className="mb-3">Alat Paling Sering Dipinjam</h6>
              {alatTerpopuler.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {alatTerpopuler.map((item, idx) => (
                    <li key={idx} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom">
                      <div>
                        <div className="fw-semibold text-dark">
                          {item.nama_barang} <span className="text-secondary fw-normal">({item.kode_barang || '-'})</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {item.merk || '-'} {item.ukuran ? ` • ${item.ukuran}` : ''}
                        </div>
                      </div>
                      <Badge bg="primary" className="rounded-pill px-2">{item.total_transaksi}x</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-lg h-100">
            <CardBody>
              <h6 className="mb-3">Consumable Paling Laku</h6>
              {consumableTerpopuler.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {consumableTerpopuler.map((item, idx) => (
                    <li key={idx} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom">
                      <div>
                        <div className="fw-semibold text-dark">
                          {item.nama || item.nama_barang} <span className="text-secondary fw-normal">({item.kode_barang || '-'})</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {item.merk || '-'} {item.ukuran ? ` • ${item.ukuran}` : ''}
                        </div>
                      </div>
                      <Badge bg="info" className="rounded-pill px-2">{item.total_diambil} unit</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-lg h-100">
            <CardBody>
              <h6 className="mb-3">Status Kerusakan Alat</h6>
               <Row>
                <Col xs={6} className="border-end">
                  <div className="mb-3">
                    <div className="text-secondary small">Rusak Bulan Ini</div>
                    <div className="h3 mb-0 text-danger">{kerusakan?.bulan_ini ?? 0} unit</div>
                  </div>
                  <div>
                    <div className="text-secondary small">Total Rusak</div>
                    <div className="h5 mb-0">{kerusakan?.total_semua ?? 0} unit</div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="mb-3">
                    <div className="text-secondary small">Sedang Diperbaiki</div>
                    <div className="h3 mb-0 text-warning">{kerusakan?.sedang_diperbaiki ?? 0} unit</div>
                  </div>
                  <div>
                    <div className="text-secondary small">Sudah Diperbaiki</div>
                    <div className="h5 mb-0 text-success">{kerusakan?.sudah_diperbaiki ?? 0} unit</div>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardManager;
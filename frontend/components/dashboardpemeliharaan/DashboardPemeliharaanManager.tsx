"use client";
import { useEffect, useState } from "react";
import Link from "next/link"; 
import { Row, Col, Card, CardBody, Spinner, Alert, Badge, Button } from "react-bootstrap";
import {
  IconTool,
  IconServer,
  IconAlertTriangle,
  IconChecklist,
  IconActivity,
  IconPlus,
  IconTrendingUp,
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
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import StatCard from "components/dashboard/StatCard";
import api from "/lib/api";

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

const DashboardPemeliharaanManager = () => {
  const [summary, setSummary] = useState<any>(null);
  const [aktivitas, setAktivitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data dummy untuk grafik tren agar tidak kosong (bisa diganti data API nantinya)
  const dummyChartData = [
    { tanggal: "01 Sep", total: 2 },
    { tanggal: "03 Sep", total: 5 },
    { tanggal: "05 Sep", total: 3 },
    { tanggal: "07 Sep", total: 8 },
    { tanggal: "09 Sep", total: 4 },
  ];

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api<any>("/pemeliharaan/dashboard-stats", { method: "GET" });
        
        if (response && response.success) {
          setSummary(response.data);
          setAktivitas(response.data.aktivitas_terbaru || []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat data dashboard pemeliharaan";
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
            <h1 className="mb-2 h2">Dashboard Pemeliharaan</h1>
            <p className="text-secondary mb-0">
              Ringkasan aktivitas, kondisi mesin, dan pemeliharaan alat produksi.
            </p>
            <DasherBreadcrumb />
          </div>
          <div className="mt-3 mt-md-0">
            <Link href="/pemeliharaan/data-mesin">
              <Button variant="primary" className="d-flex align-items-center gap-2">
                <IconPlus size={18} /> Catat Log Pemeliharaan
              </Button>
            </Link>
          </div>
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

  return (
    <>
      {PageHeader}

      {/* Baris 1: Ringkasan Utama Pemeliharaan */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4} xl={4}>
          <Link href="/pemeliharaan/data-mesin" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconServer size={26} />}
              title="Total Mesin Terdaftar"
              value={summary?.total_mesin ?? 0}
              variant="primary"
            />
          </Link>
        </Col>
        <Col xs={12} md={4} xl={4}>
          <Link href="/pemeliharaan/data-mesin" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconAlertTriangle size={26} />}
              title="Mesin Dalam Perbaikan"
              value={summary?.mesin_perbaikan ?? 0}
              variant="danger"
            />
          </Link>
        </Col>
        <Col xs={12} md={4} xl={4}>
          <Link href="/pemeliharaan/data-mesin" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconChecklist size={26} />}
              title="Total Pemeliharaan Rutin"
              value={summary?.pemeliharaan_rutin ?? 0}
              variant="success"
            />
          </Link>
        </Col>
      </Row>

      {/* Baris 2: Grafik Tren & Shortcut Modul (Membuat layout lebih padat dan berisi) */}
      <Row className="g-3 mb-4">
        {/* Kolom Kiri: Grafik Tren Aktivitas */}
        <Col lg={7}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconTrendingUp className="text-primary" size={20} />
                <h5 className="mb-0">Tren Aktivitas Pemeliharaan</h5>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dummyChartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006492" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#006492" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tanggal" fontSize={12} stroke="#a0a0a0" />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#a0a0a0" />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#006492" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </Col>

        {/* Kolom Kanan: Shortcut Akses Cepat Modul */}
        <Col lg={5}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody className="d-flex flex-column justify-content-between">
              <h5 className="mb-3">Akses Modul Cepat</h5>
              <div className="space-y-3">
                <Link 
                  href="/pemeliharaan/data-mesin" 
                  style={{ textDecoration: "none" }} 
                  className="d-block mb-3"
                >
                  <div className="p-3 border rounded-3 bg-light hover-bg-white transition d-flex align-items-center gap-3">
                    <div className="p-2 bg-primary text-white rounded-2">
                      <IconTool size={20} />
                    </div>
                    <div>
                      <h6 className="mb-0 text-dark fw-semibold">Kelola Data Mesin</h6>
                      <small className="text-secondary">Tambah & lihat spesifikasi unit</small>
                    </div>
                  </div>
                </Link>

                <Link 
                  href="/pemeliharaan/motor-konversi" 
                  style={{ textDecoration: "none" }} 
                  className="d-block"
                >
                  <div className="p-3 border rounded-3 bg-light hover-bg-white transition d-flex align-items-center gap-3">
                    <div className="p-2 bg-success text-white rounded-2">
                      <IconActivity size={20} />
                    </div>
                    <div>
                      <h6 className="mb-0 text-dark fw-semibold">Pemeliharaan Motor Konversi</h6>
                      <small className="text-secondary">Monitoring unit konversi khusus</small>
                    </div>
                  </div>
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 3: Aktivitas Pemeliharaan Terbaru */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="card-lg h-100 shadow-sm border-0">
            <CardBody>
              <h5 className="mb-3">Aktivitas Pemeliharaan Terbaru</h5>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada aktivitas pemeliharaan tercatat.</p>
              ) : (
                <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0 dash-list">
                    {aktivitas.map((item, idx) => (
                      <li key={idx} className="px-3 py-3 rounded border-bottom bg-white hover-bg-light transition">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div>
                            <div className="fw-semibold text-dark fs-6">{item.nama_mesin}</div>
                            <div className="small text-secondary mt-1">{item.deskripsi}</div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                              {item.tanggal ? formatWaktu(item.tanggal) : "-"}
                            </div>
                          </div>
                          <Badge bg="success" className="flex-shrink-0 px-2 py-1 text-uppercase" style={{ fontSize: "0.7rem" }}>
                            {item.status || "Selesai / Tercatat"}
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
      </Row>
      <div className="mb-5"></div>
    </>
  );
};

export default DashboardPemeliharaanManager;
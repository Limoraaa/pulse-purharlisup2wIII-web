"use client";
import { useEffect, useState } from "react";
import Link from "next/link"; 
import { Row, Col, Card, CardBody, Spinner, Alert, Badge } from "react-bootstrap";
import {
  IconTool,
  IconServer,
  IconAlertTriangle,
  IconChecklist,
  IconActivity,
} from "@tabler/icons-react";

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
              title="Total Mesin"
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
              title="Pemeliharaan Rutin"
              value={summary?.pemeliharaan_rutin ?? 0}
              variant="success"
            />
          </Link>
        </Col>
      </Row>

      {/* Baris 2: Shortcut / Akses Cepat Modul */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Link 
            href="/pemeliharaan/data-mesin" 
            style={{ textDecoration: "none", color: "inherit" }} 
            className="d-block h-100"
          >
            <Card className="card-lg h-100 border-primary border-opacity-25 shadow-sm hover-shadow transition" style={{ cursor: "pointer" }}>
              <CardBody className="d-flex align-items-center gap-3">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                  <IconTool size={28} />
                </div>
                <div>
                  <h5 className="mb-1">Kelola Data Mesin</h5>
                  <p className="text-secondary small mb-0">Tambah, ubah, atau lihat spesifikasi mesin produksi.</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        </Col>

        <Col md={6}>
          <Link 
            href="/pemeliharaan/motor-konversi" 
            style={{ textDecoration: "none", color: "inherit" }} 
            className="d-block h-100"
          >
            <Card className="card-lg h-100 border-success border-opacity-25 shadow-sm hover-shadow transition" style={{ cursor: "pointer" }}>
              <CardBody className="d-flex align-items-center gap-3">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                  <IconActivity size={28} />
                </div>
                <div>
                  <h5 className="mb-1">Pemeliharaan Motor Konversi</h5>
                  <p className="text-secondary small mb-0">Monitoring khusus pemeliharaan unit motor konversi.</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        </Col>
      </Row>

      {/* Baris 3: Aktivitas Pemeliharaan Terbaru */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="card-lg h-100">
            <CardBody>
              <h5 className="mb-3">Aktivitas Pemeliharaan Terbaru</h5>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada aktivitas pemeliharaan tercatat.</p>
              ) : (
                <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0 dash-list">
                    {aktivitas.map((item, idx) => (
                      <li key={idx} className="px-2 py-3 rounded border-bottom">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div>
                            <div className="fw-semibold text-dark">{item.nama_mesin}</div>
                            <div className="small text-secondary mt-1">{item.deskripsi}</div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                              {item.tanggal ? formatWaktu(item.tanggal) : "-"}
                            </div>
                          </div>
                          <Badge bg="primary" className="flex-shrink-0 px-2 py-1">
                            {item.status || "Tercatat"}
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
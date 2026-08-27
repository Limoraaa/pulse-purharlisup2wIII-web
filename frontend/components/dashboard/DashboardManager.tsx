"use client";
import { useEffect, useState } from "react";
import Link from "next/link"; 
import { Row, Col, Card, CardBody, Spinner, Alert, Badge, Button } from "react-bootstrap";
import {
  IconTool,
  IconPackage,
  IconUsers,
  IconClockHour4,
  IconAlertTriangle,
  IconTrendingUp,
  IconShoppingCart,
  IconClipboardList,
  IconTools, // Mengganti IconWrench dengan IconTools yang valid di Tabler Icons
  IconCalendarEvent,
  IconEngine,
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
  getTrenConsumable, 
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
  const [trenConsumable, setTrenConsumable] = useState<TrenPeminjamanItem[]>([]);

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
          trenConsData,
        ] = await Promise.all([
          getDashboardSummary(),
          getStokMenipis(),
          getTelatKembali(),
          getAlatTerpopuler(),
          getConsumableTerpopuler(),
          getKerusakanSummary(),
          getAktivitasTerbaru(),
          getTrenPeminjaman(),
          getTrenConsumable(),
        ]);

        setSummary(summaryData);
        setStokMenipis(stokData);
        setTelatKembali(telatData);
        setAlatTerpopuler(alatData);
        setConsumableTerpopuler(consumableData);
        setKerusakan(kerusakanData);
        setAktivitas(aktivitasData);
        setTren(trenData);
        setTrenConsumable(trenConsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat data dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Logika Cek Akhir Bulan untuk Widget Pengingat Pemeliharaan
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const isEndMonth = currentDay >= lastDayOfMonth - 5; // Menyala 5 hari menjelang akhir bulan

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
              Ringkasan aktivitas, inventaris Ruang Tools, serta manajemen pemeliharaan mekanikal.
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

  const orderToolsStatus = (summary as any)?.order_tools_status || {};
  const orderConsumableStatus = (summary as any)?.order_consumable_status || {};

  return (
    <>
      {PageHeader}

      {/* Widget Pengingat Pemeliharaan Akhir Bulan */}
      {isEndMonth && (
        <Alert variant="warning" className="mb-4 shadow-sm border-warning border-opacity-50">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <IconCalendarEvent size={24} className="text-warning flex-shrink-0" />
              <div>
                <strong className="d-block">Pengingat Pemeliharaan Akhir Bulan!</strong>
                <span className="small text-muted">
                  Sudah mendekati penghujung bulan. Pastikan jadwal servis berkala untuk Mesin Produksi dan Motor Konversi segera diperbarui.
                </span>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link href="/mekanikal/pemeliharaan-mesin">
                <Button variant="outline-warning" size="sm">Cek Mesin</Button>
              </Link>
              <Link href="/mekanikal/pemeliharaan-motor-konversi">
                <Button variant="warning" size="sm" className="text-dark">Cek Motor Konversi</Button>
              </Link>
            </div>
          </div>
        </Alert>
      )}

      {/* Baris 1: Ringkasan Utama */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-tools" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconTool size={26} />}
              title="Total Tools"
              value={summary?.total_tools ?? 0}
              variant="primary"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-consumable" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconPackage size={26} />}
              title="Total Consumable"
              value={summary?.total_consumables ?? 0}
              variant="info"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-peminjam" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconUsers size={26} />}
              title="Total Peminta"
              value={summary?.total_peminta ?? 0}
              variant="success"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/transaksi/peminjaman-aktif" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconClockHour4 size={26} />}
              title="Sedang Dipinjam"
              value={summary?.sedang_dipinjam ?? 0}
              variant="warning"
            />
          </Link>
        </Col>
      </Row>

      {/* ========================================== */}
      {/* BARIS: REKAPITULASI PEMELIHARAAN (SKRIPSI) */}
      {/* ========================================== */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="card-lg h-100 border-start border-4 border-primary shadow-sm">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <IconTools className="text-primary" size={22} />
                  <h5 className="mb-0">Pemeliharaan Mesin Produksi</h5>
                </div>
                <Link href="/mekanikal/pemeliharaan-mesin" className="small text-decoration-none">Kelola &rarr;</Link>
              </div>
              <Row className="text-center g-2 pt-2">
                <Col xs={4} className="border-end">
                  <div className="text-secondary small">Total Mesin</div>
                  <div className="h4 mb-0 fw-bold">8 <span className="small text-muted">Unit</span></div>
                </Col>
                <Col xs={4} className="border-end">
                  <div className="text-secondary small">Kondisi Sehat</div>
                  <div className="h4 mb-0 fw-bold text-success">7</div>
                </Col>
                <Col xs={4}>
                  <div className="text-secondary small">Dalam Perbaikan</div>
                  <div className="h4 mb-0 fw-bold text-warning">1</div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="card-lg h-100 border-start border-4 border-info shadow-sm">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <IconEngine className="text-info" size={22} />
                  <h5 className="mb-0">Pemeliharaan Motor Konversi</h5>
                </div>
                <Link href="/mekanikal/pemeliharaan-motor-konversi" className="small text-decoration-none">Kelola &rarr;</Link>
              </div>
              <Row className="text-center g-2 pt-2">
                <Col xs={4} className="border-end">
                  <div className="text-secondary small">Total Armada</div>
                  <div className="h4 mb-0 fw-bold">5 <span className="small text-muted">Unit</span></div>
                </Col>
                <Col xs={4} className="border-end">
                  <div className="text-secondary small">Siap Operasi</div>
                  <div className="h4 mb-0 fw-bold text-success">5</div>
                </Col>
                <Col xs={4}>
                  <div className="text-secondary small">Servis Berkala</div>
                  <div className="h4 mb-0 fw-bold text-primary">0</div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 2: Alert (Stok Menipis & Telat) */}
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
                        <div className="fw-semibold">
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

      {/* Baris 3: Grafik Tren (Dua Kolom Bersandingan) */}
      <Row className="g-3 mb-4">
        {/* Kolom Kiri: Tren Tools */}
        <Col lg={6}>
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconTrendingUp className="text-primary" size={20} />
                <h5 className="mb-0">Tren Peminjaman Tools (30 Hari Terakhir)</h5>
              </div>
              {tren.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tren}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" opacity={0.3} />
                    <XAxis
                      dataKey="tanggal"
                      tickFormatter={(val) =>
                        new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                      }
                      fontSize={12}
                      stroke="#a0a0a0"
                    />
                    <YAxis allowDecimals={false} fontSize={12} stroke="#a0a0a0" />
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

        {/* Kolom Kanan: Tren Consumable Keluar */}
        <Col lg={6}>
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconTrendingUp className="text-info" size={20} />
                <h5 className="mb-0">Tren Consumable Keluar (30 Hari Terakhir)</h5>
              </div>
              {trenConsumable.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trenConsumable}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" opacity={0.3} />
                    <XAxis
                      dataKey="tanggal"
                      tickFormatter={(val) =>
                        new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                      }
                      fontSize={12}
                      stroke="#a0a0a0"
                    />
                    <YAxis allowDecimals={false} fontSize={12} stroke="#a0a0a0" />
                    <Tooltip
                      labelFormatter={(val) =>
                        new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#17a2b8" 
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#17a2b8" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 4: Alat Paling Sering, Consumable Laku, Status Kerusakan */}
      <Row className="g-3 mb-4">
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
                        <div className="fw-semibold">
                          {item.nama_barang} <span className="text-secondary fw-normal">({item.kode_barang || '-'})</span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
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
                        <div className="fw-semibold">
                          {item.nama || item.nama_barang} <span className="text-secondary fw-normal">({item.kode_barang || '-'})</span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
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
               <Row className="mb-3 pb-3 border-bottom text-center">
                <Col xs={6} className="border-end">
                  <div className="text-secondary small mb-1">Rusak Bulan Ini</div>
                  <div className="h3 mb-0">{kerusakan?.bulan_ini ?? 0} <span className="fs-6 fw-normal text-secondary">unit</span></div>
                </Col>
                <Col xs={6}>
                  <div className="text-secondary small mb-1">Total Rusak (Semua)</div>
                  <div className="h3 mb-0">{kerusakan?.total_semua ?? 0} <span className="fs-6 fw-normal text-secondary">unit</span></div>
                </Col>
              </Row>
              <Row className="text-center mt-2">
                <Col xs={4}>
                  <div className="text-secondary small mb-1">Diperbaiki</div>
                  <div className="h4 mb-0 text-warning">{kerusakan?.sedang_diperbaiki ?? 0}</div>
                </Col>
                <Col xs={4} className="border-start border-end">
                  <div className="text-secondary small mb-1">Selesai</div>
                  <div className="h4 mb-0 text-success">{kerusakan?.sudah_diperbaiki ?? 0}</div>
                </Col>
                <Col xs={4}>
                  <div className="text-secondary small mb-1">Permanen</div>
                  <div className="h4 mb-0 text-danger">{kerusakan?.rusak_permanen ?? 0}</div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 5: Aktivitas Terbaru */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="card-lg h-100">
            <CardBody>
              <h5 className="mb-3">Aktivitas Terbaru</h5>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada aktivitas.</p>
              ) : (
                <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0 dash-list">
                    {aktivitas.map((item, idx) => (
                      <li key={idx} className="px-2 py-3 rounded border-bottom">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div>
                            <div className="small fw-semibold">{item.deskripsi}</div>
                            <div className="text-secondary mt-1" style={{ fontSize: "0.75rem" }}>
                              {formatWaktu(item.waktu)}
                            </div>
                          </div>
                          <Badge bg={jenisLabel[item.jenis].color} className="flex-shrink-0 px-2 py-1">
                            {jenisLabel[item.jenis].label}
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

      {/* Baris 6: Rincian Order */}
      <Row className="g-3">
        <Col md={6}>
          <Link 
            href="/order/order-tools" 
            style={{ textDecoration: "none", color: "inherit" }} 
            className="d-block h-100"
            title="Ke Halaman Order Tools"
          >
            <Card className="card-lg h-100 border-primary border-opacity-25 shadow-sm" style={{ cursor: "pointer" }}>
              <CardBody>
                <h6 className="mb-4 d-flex align-items-center gap-2">
                  <IconShoppingCart size={20} className="text-primary"/> 
                  Rincian Status Order Tools
                </h6>
                <Row className="text-center">
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Belum Dibeli</div>
                    <div className="h4 mb-0 text-secondary">{orderToolsStatus.belum_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">On Progres</div>
                    <div className="h4 mb-0 text-primary">{orderToolsStatus.on_progres ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Sudah Dibeli</div>
                    <div className="h4 mb-0 text-success">{orderToolsStatus.sudah_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Ditolak</div>
                    <div className="h4 mb-0 text-danger">{orderToolsStatus.ditolak ?? 0}</div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Link>
        </Col>
        
        <Col md={6}>
          <Link 
            href="/order/order-consumable" 
            style={{ textDecoration: "none", color: "inherit" }} 
            className="d-block h-100"
            title="Ke Halaman Order Consumable"
          >
            <Card className="card-lg h-100 border-danger border-opacity-25 shadow-sm" style={{ cursor: "pointer" }}>
              <CardBody>
                <h6 className="mb-4 d-flex align-items-center gap-2">
                  <IconClipboardList size={20} className="text-danger"/> 
                  Rincian Status Order Consumable
                </h6>
                <Row className="text-center">
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Belum Dibeli</div>
                    <div className="h4 mb-0 text-secondary">{orderConsumableStatus.belum_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">On Progres</div>
                    <div className="h4 mb-0 text-primary">{orderConsumableStatus.on_progres ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Sudah Dibeli</div>
                    <div className="h4 mb-0 text-success">{orderConsumableStatus.sudah_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Ditolak</div>
                    <div className="h4 mb-0 text-danger">{orderConsumableStatus.ditolak ?? 0}</div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Link>
        </Col>
      </Row>
      <div className="mb-5"></div>
    </>
  );
};

export default DashboardManager;
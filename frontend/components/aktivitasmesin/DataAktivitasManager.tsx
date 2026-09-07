"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
  Table,
} from "react-bootstrap";
import {
  IconSearch,
  IconX,
  IconBox,
  IconMoodEmpty,
  IconActivity,
  IconArrowLeft,
  IconCircleCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";

interface MesinItemType {
  id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  lokasi_ruang: string;
  status: 'Aktif' | 'Maintenance' | 'Rusak';
}

interface LogAktivitasType {
  id: number;
  operator_pelaksana: string;
  uraian_pekerjaan: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  jumlah: number;
  pemeriksa: string;
}

const EXPORT_COLUMNS_MESIN: ExportColumn[] = [
  { header: "Kode Mesin", key: "kode_mesin" },
  { header: "Nama Mesin", key: "nama_mesin" },
  { header: "Lokasi / Ruang", key: "lokasi_ruang" },
  { header: "Status", key: "status" },
];

const EXPORT_COLUMNS_LOG: ExportColumn[] = [
  { header: "Operator Pelaksana", key: "operator_pelaksana" },
  { header: "Uraian Pekerjaan", key: "uraian_pekerjaan" },
  { header: "Tanggal", key: "tanggal" },
  { header: "Mulai", key: "waktu_mulai" },
  { header: "Selesai", key: "waktu_selesai" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Pemeriksa", key: "pemeriksa" },
];

const DataAktivitasManager = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mesinIdParam = searchParams.get("id");

  const [viewMode, setViewMode] = useState<"list" | "detail">(mesinIdParam ? "detail" : "list");
  const [selectedMesin, setSelectedMesin] = useState<MesinItemType | null>(null);

  const [mesinList, setMesinList] = useState<MesinItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State Log Aktivitas
  const [logsAktivitas, setLogsAktivitas] = useState<LogAktivitasType[]>([]);
  const [loadingAktivitas, setLoadingAktivitas] = useState(false);
  const [operator, setOperator] = useState("");
  const [uraianAkt, setUraianAkt] = useState("");
  const [tglAkt, setTglAkt] = useState(new Date().toISOString().split("T")[0]);
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("16:00");
  const [jumlahAkt, setJumlahAkt] = useState<number>(1);
  const [pemeriksaAkt, setPemeriksaAkt] = useState("");

  const loadMesinAndLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: MesinItemType[] } | MesinItemType[]>("/mesin-produksi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res) ? res : res.data || [];
      setMesinList(data);

      if (mesinIdParam) {
        const found = data.find((m) => String(m.id) === String(mesinIdParam));
        if (found) {
          setSelectedMesin(found);
          setViewMode("detail");
          setLoadingAktivitas(true);
          const resAkt = await api<{ data: LogAktivitasType[] } | LogAktivitasType[]>(`/log-aktivitas/mesin/${found.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setLogsAktivitas(Array.isArray(resAkt) ? resAkt : resAkt.data || []);
          setLoadingAktivitas(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data aktivitas mesin");
    } finally {
      setLoading(false);
    }
  }, [mesinIdParam]);

  useEffect(() => {
    loadMesinAndLogs();
  }, [loadMesinAndLogs]);

  const handleOpenDetail = async (mesin: MesinItemType) => {
    setSelectedMesin(mesin);
    setViewMode("detail");
    setLoadingAktivitas(true);
    try {
      const token = localStorage.getItem("token");
      const resAkt = await api<{ data: LogAktivitasType[] } | LogAktivitasType[]>(`/log-aktivitas/mesin/${mesin.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogsAktivitas(Array.isArray(resAkt) ? resAkt : resAkt.data || []);
    } catch (err) {
      console.error("Gagal memuat log aktivitas", err);
    } finally {
      setLoadingAktivitas(false);
    }
  };

  const handleBack = () => {
    // Kembalikan user ke halaman utama Data Pemeliharaan Mesin
    router.push("/pemeliharaan/data-mesin");
  };

  const filteredMesin = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return mesinList;

    return mesinList.filter((item) => {
      return (
        (item.kode_mesin || "").toLowerCase().includes(keyword) ||
        (item.nama_mesin || "").toLowerCase().includes(keyword) ||
        (item.lokasi_ruang || "").toLowerCase().includes(keyword) ||
        (item.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [mesinList, searchTerm]);

  const handleExportPDF = () =>
    exportToPDF(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-aktivitas", "Monitoring Aktivitas Mesin");
  const handleExportExcel = () =>
    exportToExcel(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-aktivitas");

  const handleExportLogPDF = () =>
    exportToPDF(logsAktivitas as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `log-aktivitas-${selectedMesin?.kode_mesin}`, `Log Aktivitas - ${selectedMesin?.nama_mesin}`);
  const handleExportLogExcel = () =>
    exportToExcel(logsAktivitas as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `log-aktivitas-${selectedMesin?.kode_mesin}`);

  const handleAddAktivitasLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMesin) return;

    try {
      const token = localStorage.getItem("token");

      await api("/log-aktivitas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mesin_produksi_id: selectedMesin.id,
          operator_pelaksana: operator,
          uraian_pekerjaan: uraianAkt,
          tanggal: tglAkt,
          waktu_mulai: jamMulai,
          waktu_selesai: jamSelesai,
          jumlah: jumlahAkt,
          pemeriksa: pemeriksaAkt,
        }),
      });

      setOperator("");
      setUraianAkt("");
      setJumlahAkt(1);
      setPemeriksaAkt("");
      setSuccessMessage("Log aktivitas berhasil dicatat!");
      handleOpenDetail(selectedMesin);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan log aktivitas");
    }
  };

  const columns = useMemo(
    () => [
      { header: "No", cell: (info: any) => info.row.index + 1 },
      { accessorKey: "kode_mesin", header: "Kode Mesin" },
      { accessorKey: "nama_mesin", header: "Nama Mesin" },
      { accessorKey: "lokasi_ruang", header: "Lokasi / Ruang" },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info: any) => {
          const val = info.getValue();
          const badgeClass =
            val === "Aktif"
              ? "bg-success text-white px-2 py-1 rounded small"
              : val === "Maintenance"
              ? "bg-warning text-dark px-2 py-1 rounded small"
              : "bg-danger text-white px-2 py-1 rounded small";
          return <span className={badgeClass}>{val}</span>;
        },
      },
      {
        id: "aksi",
        header: "Aksi Log",
        cell: (info: any) => {
          const mesin = info.row.original;
          return (
            <Button
              variant="outline-success"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={() => handleOpenDetail(mesin)}
            >
              <IconActivity size={14} /> Buka Aktivitas
            </Button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="dataaktivitas-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {viewMode === "list" ? (
        <>
          <Row>
            <Col>
              <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
                <div>
                  <h1 className="mb-2 h2">Monitoring Aktivitas Mesin</h1>
                  <p className="text-secondary mb-0">Mengelola catatan operasional harian operator mesin produksi.</p>
                </div>
              </Flex>
            </Col>
          </Row>

          <Card className="card-lg mb-6">
            <div className="datatools-toolbar border-bottom p-3">
              <Row className="g-2 align-items-center">
                <Col lg={5} md={5}>
                  <InputGroup className="datatools-search">
                    <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Cari kode, nama mesin, atau lokasi ruang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                        <IconX size={16} />
                      </Button>
                    )}
                  </InputGroup>
                </Col>
                <Col lg={3} md={3} className="text-muted small">
                  Menampilkan <span className="fw-semibold text-body">{filteredMesin.length}</span> dari {mesinList.length} data mesin
                </Col>
                <Col lg={4} md={4} className="d-flex justify-content-md-end gap-2">
                  <Button variant="outline-danger" size="sm" onClick={handleExportPDF}>Export PDF</Button>
                  <Button variant="outline-success" size="sm" onClick={handleExportExcel}>Export Excel</Button>
                </Col>
              </Row>
            </div>

            <CardBody>
              {loading ? (
                <div className="text-center py-6">
                  <Spinner animation="border" size="sm" className="me-2" /> Memuat data mesin...
                </div>
              ) : mesinList.length === 0 ? (
                <div className="datatools-empty text-center py-6">
                  <div className="datatools-empty-icon mb-3"><IconBox size={32} /></div>
                  <h5 className="mb-1">Belum ada data mesin produksi</h5>
                  <p className="text-secondary mb-4">Tambahkan data mesin melalui menu pemeliharaan terlebih dahulu.</p>
                </div>
              ) : filteredMesin.length === 0 ? (
                <div className="datatools-empty text-center py-6">
                  <div className="datatools-empty-icon mb-3"><IconMoodEmpty size={32} /></div>
                  <h5 className="mb-1">Tidak ada hasil</h5>
                  <p className="text-secondary mb-4">Tidak ditemukan mesin yang cocok dengan pencarian.</p>
                  <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm("")}>
                    <IconX size={18} /> Reset Pencarian
                  </Button>
                </div>
              ) : (
                <TanstackTable data={filteredMesin} columns={columns} pagination isSortable />
              )}
            </CardBody>
          </Card>
        </>
      ) : (
        <div>
          {/* Header & Breadcrumb Interaktif */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="mb-2 h2">{selectedMesin?.nama_mesin}</h1>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 small text-secondary">
                      <li className="breadcrumb-item">Home</li>
                      <li className="breadcrumb-item">Pemeliharaan</li>
                      <li 
                        className="breadcrumb-item text-primary fw-semibold" 
                        style={{ cursor: "pointer" }}
                        onClick={handleBack}
                      >
                        Aktivitas Mesin
                      </li>
                      <li className="breadcrumb-item active text-dark fw-semibold">
                        {selectedMesin?.kode_mesin} - {selectedMesin?.nama_mesin}
                      </li>
                    </ol>
                  </nav>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-danger" size="sm" onClick={handleExportLogPDF}>Export PDF</Button>
                  <Button variant="outline-success" size="sm" onClick={handleExportLogExcel}>Export Excel</Button>
                  <Button variant="outline-secondary" size="sm" onClick={handleBack} className="d-flex align-items-center gap-1">
                    <IconArrowLeft size={16} /> Kembali
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Info Singkat Mesin */}
          <Card className="mb-4 border-primary">
            <CardBody>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-bold tracking-wider">MONITORING OPERASIONAL MESIN PRODUKSI</span>
                <span className="badge bg-success">{selectedMesin?.status}</span>
              </div>
              <Row>
                <Col md={6}>
                  <table className="w-100 text-sm">
                    <tbody>
                      <tr>
                        <td className="fw-semibold text-secondary py-1" style={{ width: "130px" }}>Kode Mesin</td>
                        <td>: {selectedMesin?.kode_mesin}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-secondary py-1">Lokasi / Ruang</td>
                        <td>: {selectedMesin?.lokasi_ruang}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* TABEL & FORM LOG AKTIVITAS */}
          <Card>
            <CardBody>
              <h5 className="mb-4 d-flex align-items-center gap-2">
                <IconActivity size={20} /> Log Aktivitas Harian Operator
              </h5>

              <Card className="mb-4 border bg-light">
                <CardBody>
                  <h6 className="fw-bold mb-3">+ Tambah Log Aktivitas Baru</h6>
                  <Form onSubmit={handleAddAktivitasLog}>
                    <Row className="g-3">
                      <Col md={3}>
                        <Form.Control
                          required
                          placeholder="Operator Pelaksana"
                          value={operator}
                          onChange={(e) => setOperator(e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          required
                          placeholder="Uraian Pekerjaan"
                          value={uraianAkt}
                          onChange={(e) => setUraianAkt(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="date"
                          required
                          value={tglAkt}
                          onChange={(e) => setTglAkt(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="time"
                          required
                          value={jamMulai}
                          onChange={(e) => setJamMulai(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="time"
                          required
                          value={jamSelesai}
                          onChange={(e) => setJamSelesai(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="number"
                          min={1}
                          required
                          placeholder="Jumlah / Output"
                          value={jumlahAkt}
                          onChange={(e) => setJumlahAkt(Number(e.target.value))}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          required
                          placeholder="Pemeriksa"
                          value={pemeriksaAkt}
                          onChange={(e) => setPemeriksaAkt(e.target.value)}
                        />
                      </Col>
                      <Col md={7} className="d-grid">
                        <Button variant="success" type="submit">Catat Log Aktivitas</Button>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
              </Card>

              <div className="table-responsive">
                <Table bordered hover className="align-middle">
                  <thead className="table-light text-center">
                    <tr>
                      <th rowSpan={2} style={{ width: "50px", verticalAlign: "middle" }}>No</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Operator Pelaksana</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Uraian Pekerjaan</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Tanggal</th>
                      <th colSpan={2}>Waktu</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Jumlah</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Pemeriksa</th>
                    </tr>
                    <tr>
                      <th>Mulai</th>
                      <th>Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAktivitas ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <Spinner animation="border" size="sm" /> Memuat data log aktivitas...
                        </td>
                      </tr>
                    ) : logsAktivitas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-secondary">
                          Belum ada catatan log aktivitas untuk mesin ini.
                        </td>
                      </tr>
                    ) : (
                      logsAktivitas.map((log, index) => (
                        <tr key={log.id}>
                          <td className="text-center fw-semibold">{index + 1}</td>
                          <td>{log.operator_pelaksana}</td>
                          <td>{log.uraian_pekerjaan}</td>
                          <td className="text-center">{log.tanggal}</td>
                          <td className="text-center">{log.waktu_mulai}</td>
                          <td className="text-center">{log.waktu_selesai}</td>
                          <td className="text-center fw-semibold">{log.jumlah}</td>
                          <td className="text-center">{log.pemeriksa}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

DataAktivitasManager.displayName = "DataAktivitasManager";

export default DataAktivitasManager;
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
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconBox,
  IconMoodEmpty,
  IconClipboardList,
  IconArrowLeft,
  IconActivity,
} from "@tabler/icons-react";
import Link from "next/link";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import { useMesinColumns } from "./ColumnDefination";
import MesinFormModal from "./MesinFormModal";

interface MesinItemType {
  id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  lokasi_ruang: string;
  status: 'Aktif' | 'Maintenance' | 'Rusak';
}

interface LogItemType {
  id: number;
  uraian_pemeliharaan: string;
  waktu_pelaksana: string;
  keterangan: string;
  paraf: string;
}

const EXPORT_COLUMNS_MESIN: ExportColumn[] = [
  { header: "Kode Mesin", key: "kode_mesin" },
  { header: "Nama Mesin", key: "nama_mesin" },
  { header: "Lokasi / Ruang", key: "lokasi_ruang" },
  { header: "Status", key: "status" },
];

const EXPORT_COLUMNS_LOG: ExportColumn[] = [
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Waktu Pelaksana", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Paraf", key: "paraf" },
];

const DataMesinManager = () => {
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedMesin, setSelectedMesin] = useState<MesinItemType | null>(null);

  const [mesinList, setMesinList] = useState<MesinItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State Log Pemeliharaan
  const [logs, setLogs] = useState<LogItemType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [uraian, setUraian] = useState("");
  const [waktu, setWaktu] = useState(new Date().toISOString().split("T")[0]);
  const [keteranganLog, setKeteranganLog] = useState("");

  const loadMesin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: MesinItemType[] } | MesinItemType[]>("/mesin-produksi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res) ? res : res.data || [];
      setMesinList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data mesin produksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMesin();
  }, [loadMesin]);

  const handleOpenDetail = async (mesin: MesinItemType) => {
    setSelectedMesin(mesin);
    setViewMode("detail");
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: LogItemType[] } | LogItemType[]>(`/log-pemeliharaan/mesin/${mesin.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Gagal memuat log", err);
    } finally {
      setLoadingLogs(false);
    }
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
    exportToPDF(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-produksi", "Data Mesin Produksi");
  const handleExportExcel = () =>
    exportToExcel(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-produksi");

  const handleExportLogPDF = () =>
    exportToPDF(logs as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${selectedMesin?.kode_mesin}`, `Kartu Gantung - ${selectedMesin?.nama_mesin}`);
  const handleExportLogExcel = () =>
    exportToExcel(logs as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${selectedMesin?.kode_mesin}`);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMesin) return;

    try {
      const token = localStorage.getItem("token");
      const userName = localStorage.getItem("userName") || "Teknisi PUSHARLIS";

      await api("/log-pemeliharaan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mesin_produksi_id: selectedMesin.id,
          uraian_pemeliharaan: uraian,
          waktu_pelaksana: waktu,
          keterangan: keteranganLog,
          paraf: userName,
        }),
      });

      setUraian("");
      setKeteranganLog("");
      setSuccessMessage("Log pemeliharaan berhasil ditambahkan!");
      handleOpenDetail(selectedMesin);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan log");
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
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center gap-1"
                onClick={() => handleOpenDetail(mesin)}
              >
                <IconClipboardList size={14} /> Pemeliharaan
              </Button>
              <Link href={`/pemeliharaan/aktivitas-mesin?id=${mesin.id}`}>
                <Button variant="outline-success" size="sm" className="d-flex align-items-center gap-1">
                  <IconActivity size={14} /> Aktivitas
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="datamesin-page">
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
                  <h1 className="mb-2 h2">Pemeliharaan Mesin Produksi</h1>
                  <p className="text-secondary mb-0">Mengelola daftar mesin produksi beserta log pemeliharaan dan aktivitas.</p>
                  <DasherBreadcrumb />
                </div>
                <div>
                  <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={18} /> Tambah Mesin Baru
                  </Button>
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
                  <p className="text-secondary mb-4">Mulai dengan menambahkan data mesin produksi.</p>
                  <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={18} /> Tambah Mesin Baru
                  </Button>
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
                        onClick={() => setViewMode("list")}
                      >
                        Mesin
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
                  <Button variant="outline-secondary" size="sm" onClick={() => setViewMode("list")} className="d-flex align-items-center gap-1">
                    <IconArrowLeft size={16} /> Kembali
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="mb-4 border-primary">
            <CardBody>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-bold tracking-wider">KARTU GANTUNG PELAKSANAAN PEMELIHARAAN</span>
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

          <Card>
            <CardBody>
              <h5 className="mb-4 d-flex align-items-center gap-2">
                <IconClipboardList size={20} /> Riwayat Log Pemeliharaan
              </h5>

              <Card className="mb-4 border bg-light">
                <CardBody>
                  <h6 className="fw-bold mb-3">+ Tambah Catatan Pelaksanaan Baru</h6>
                  <Form onSubmit={handleAddLog}>
                    <Row className="g-3">
                      <Col md={5}>
                        <Form.Control
                          required
                          placeholder="Uraian Pemeliharaan (Cth: Ganti oli, filter...)"
                          value={uraian}
                          onChange={(e) => setUraian(e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type="date"
                          required
                          value={waktu}
                          onChange={(e) => setWaktu(e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Keterangan / Suku Cadang"
                          value={keteranganLog}
                          onChange={(e) => setKeteranganLog(e.target.value)}
                        />
                      </Col>
                      <Col md={1} className="d-grid">
                        <Button variant="primary" type="submit">Catat</Button>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
              </Card>

              <div className="table-responsive">
                <Table bordered hover className="align-middle">
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "60px" }}>No</th>
                      <th>Uraian Pemeliharaan</th>
                      <th style={{ width: "160px" }}>Waktu Pelaksana</th>
                      <th>Keterangan</th>
                      <th style={{ width: "140px" }}>Paraf (Teknisi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          <Spinner animation="border" size="sm" /> Memuat riwayat log...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-secondary">
                          Belum ada catatan log pemeliharaan untuk mesin ini.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => (
                        <tr key={log.id}>
                          <td className="text-center fw-semibold">{index + 1}</td>
                          <td>{log.uraian_pemeliharaan}</td>
                          <td className="text-center">{log.waktu_pelaksana}</td>
                          <td>{log.keterangan || "-"}</td>
                          <td className="text-center fw-semibold">{log.paraf}</td>
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

      <MesinFormModal
        show={formModalOpen}
        onHide={() => setFormModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage("Mesin produksi berhasil ditambahkan!");
          loadMesin();
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
      />
    </div>
  );
};

export default DataMesinManager;
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
  Modal,
} from "react-bootstrap";
import {
  IconSearch,
  IconX,
  IconBox,
  IconMoodEmpty,
  IconActivity,
  IconArrowLeft,
  IconCircleCheck,
  IconPlus,
  IconEdit,
  IconTrash,
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
  status: 'Aktif' | 'Tidak Aktif';
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

  // State Modal Form Aktivitas (Tambah & Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  // State Log Aktivitas
  const [logsAktivitas, setLogsAktivitas] = useState<LogAktivitasType[]>([]);
  const [loadingAktivitas, setLoadingAktivitas] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
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
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await api<{ data: MesinItemType[] } | MesinItemType[]>("/mesin-produksi", { headers });
      const data = Array.isArray(res) ? res : res.data || [];
      setMesinList(data);

      if (mesinIdParam) {
        const found = data.find((m) => String(m.id) === String(mesinIdParam));
        if (found) {
          setSelectedMesin(found);
          setViewMode("detail");
          
          setLoadingAktivitas(true);
          try {
            const resAkt = await api<{ data: LogAktivitasType[] } | LogAktivitasType[]>(`/log-aktivitas/mesin/${found.id}`, { headers });
            setLogsAktivitas(Array.isArray(resAkt) ? resAkt : resAkt.data || []);
          } catch (errAkt) {
            console.error("Gagal memuat log aktivitas:", errAkt);
            setLogsAktivitas([]); 
          } finally {
            setLoadingAktivitas(false); 
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data aktivitas mesin");
    } finally {
      setLoading(false);
    }
  }, [mesinIdParam]);

  useEffect(() => {
    const userName = localStorage.getItem("userName") || "";
    setOperator(userName);
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
    if (mesinIdParam) {
      router.push("/pemeliharaan/data-mesin");
    } else {
      setViewMode("list");
      setSelectedMesin(null);
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
    exportToPDF(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-aktivitas", "Monitoring Aktivitas Mesin");
  const handleExportExcel = () =>
    exportToExcel(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-aktivitas");

  const handleExportLogPDF = () =>
    exportToPDF(logsAktivitas as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `log-aktivitas-${selectedMesin?.kode_mesin}`, `Log Aktivitas - ${selectedMesin?.nama_mesin}`);
  const handleExportLogExcel = () =>
    exportToExcel(logsAktivitas as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `log-aktivitas-${selectedMesin?.kode_mesin}`);

  const handleOpenAddModal = () => {
    setEditingLogId(null);
    const userName = localStorage.getItem("userName") || "";
    setOperator(userName);
    setUraianAkt("");
    setTglAkt(new Date().toISOString().split("T")[0]);
    setJamMulai("08:00");
    setJamSelesai("16:00");
    setJumlahAkt(1);
    setPemeriksaAkt("");
    setShowFormModal(true);
  };

  const handleOpenEditModal = (log: LogAktivitasType) => {
    setEditingLogId(log.id);
    setOperator(log.operator_pelaksana);
    setUraianAkt(log.uraian_pekerjaan);
    setTglAkt(log.tanggal);
    setJamMulai(log.waktu_mulai?.slice(0, 5) || "08:00");
    setJamSelesai(log.waktu_selesai?.slice(0, 5) || "16:00");
    setJumlahAkt(log.jumlah);
    setPemeriksaAkt(log.pemeriksa);
    setShowFormModal(true);
  };

  const handleAddOrUpdateAktivitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMesin) return;
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = editingLogId ? `/log-aktivitas/${editingLogId}` : "/log-aktivitas";
      const method = editingLogId ? "PUT" : "POST";

      await api(url, {
        method: method,
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

      setShowFormModal(false);
      setEditingLogId(null);
      setUraianAkt("");
      setJumlahAkt(1);
      setPemeriksaAkt("");
      
      setSuccessMessage(editingLogId ? "Log aktivitas berhasil diperbarui!" : "Log aktivitas berhasil dicatat!");
      handleOpenDetail(selectedMesin); 
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan log aktivitas");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAktivitas = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan log aktivitas ini?")) return;

    try {
      const token = localStorage.getItem("token");
      await api(`/log-aktivitas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage("Log aktivitas berhasil dihapus!");
      if (selectedMesin) handleOpenDetail(selectedMesin);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus log aktivitas");
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
        <Alert variant="success" className="d-flex align-items-center gap-2 py-2 small" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={18} />
          {successMessage}
        </Alert>
      )}

      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      {viewMode === "list" ? (
        <>
          <Row>
            <Col>
              <Flex justifyContent="between" alignItems="center" className="mb-3 w-100" breakpoint="md">
                <div>
                  <h1 className="mb-1 h4 h2-md">Monitoring Aktivitas Mesin</h1>
                  <p className="text-secondary mb-0 small">Mengelola catatan operasional harian operator mesin produksi.</p>
                </div>
              </Flex>
            </Col>
          </Row>

          <Card className="card-lg mb-4">
            <div className="datatools-toolbar border-bottom p-2 p-md-3">
              <Row className="g-2 align-items-center">
                <Col xs={12} md={5}>
                  <InputGroup className="datatools-search input-group-sm">
                    <InputGroup.Text><IconSearch size={16} /></InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Cari kode, nama mesin, atau lokasi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                        <IconX size={14} />
                      </Button>
                    )}
                  </InputGroup>
                </Col>
                <Col xs={6} md={3} className="text-muted small">
                  <span className="fw-semibold text-body">{filteredMesin.length}</span> dari {mesinList.length} data
                </Col>
                <Col xs={6} md={4} className="d-flex justify-content-end gap-1">
                  <Button variant="outline-danger" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportPDF}>PDF</Button>
                  <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportExcel}>Excel</Button>
                </Col>
              </Row>
            </div>

            <CardBody className="p-2 p-md-3">
              {loading ? (
                <div className="text-center py-4 small">
                  <Spinner animation="border" size="sm" className="me-2" /> Memuat data mesin...
                </div>
              ) : mesinList.length === 0 ? (
                <div className="datatools-empty text-center py-4">
                  <div className="datatools-empty-icon mb-2"><IconBox size={28} /></div>
                  <h6 className="mb-1">Belum ada data mesin produksi</h6>
                  <p className="text-secondary small mb-3">Tambahkan data mesin melalui menu pemeliharaan terlebih dahulu.</p>
                </div>
              ) : filteredMesin.length === 0 ? (
                <div className="datatools-empty text-center py-4">
                  <div className="datatools-empty-icon mb-2"><IconMoodEmpty size={28} /></div>
                  <h6 className="mb-1">Tidak ada hasil</h6>
                  <p className="text-secondary small mb-3">Tidak ditemukan mesin yang cocok.</p>
                  <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm("")}>
                    Reset Pencarian
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
          {/* Header & Breadcrumb Compact untuk Mobile */}
          <Row className="mb-3">
            <Col>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <div>
                  <h2 className="mb-1 fs-5 fw-bold">{selectedMesin?.nama_mesin}</h2>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 text-secondary" style={{ fontSize: "0.75rem" }}>
                      <li className="breadcrumb-item">Home</li>
                      <li className="breadcrumb-item">Pemeliharaan</li>
                      <li 
                        className="breadcrumb-item text-primary fw-semibold" 
                        style={{ cursor: "pointer" }}
                        onClick={handleBack}
                      >
                        Aktivitas
                      </li>
                      <li className="breadcrumb-item active text-body fw-semibold">
                        {selectedMesin?.kode_mesin}
                      </li>
                    </ol>
                  </nav>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-1 mt-md-0">
                  <Button variant="outline-danger" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportLogPDF}>PDF</Button>
                  <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportLogExcel}>Excel</Button>
                  <Button variant="outline-secondary" size="sm" className="py-1 px-2 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }} onClick={handleBack}>
                    <IconArrowLeft size={14} /> Kembali
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Info Singkat Mesin Compact */}
          <Card className="mb-3 border-primary shadow-none">
            <CardBody className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>MONITORING OPERASIONAL</span>
                <span className={`badge ${selectedMesin?.status === 'Aktif' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: "0.65rem" }}>{selectedMesin?.status}</span>
              </div>
              <table className="w-100" style={{ fontSize: "0.8rem" }}>
                <tbody>
                  <tr>
                    <td className="fw-semibold text-secondary py-0.5" style={{ width: "110px" }}>Kode Mesin</td>
                    <td className="py-0.5">: {selectedMesin?.kode_mesin}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-secondary py-0.5">Lokasi / Ruang</td>
                    <td className="py-0.5">: {selectedMesin?.lokasi_ruang}</td>
                  </tr>
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* TABEL DATA AKTIVITAS COMPACT */}
          <Card className="shadow-none">
            <CardBody className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 d-flex align-items-center gap-1 fw-bold fs-6">
                  <IconActivity size={18} /> Log Aktivitas Harian
                </h6>
                <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleOpenAddModal}>
                  <IconPlus size={14} /> Tambah Log
                </Button>
              </div>

              <div className="table-responsive">
                <Table bordered hover className="align-middle table-sm text-nowrap" style={{ fontSize: "0.75rem" }}>
                  <thead className="table-light text-center">
                    <tr>
                      <th rowSpan={2} style={{ width: "40px", verticalAlign: "middle" }}>No</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Operator Pelaksana</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Uraian Pekerjaan</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Tanggal</th>
                      <th colSpan={2}>Waktu</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Jumlah</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Pemeriksa</th>
                      <th rowSpan={2} style={{ width: "80px", verticalAlign: "middle" }}>Aksi</th>
                    </tr>
                    <tr>
                      <th>Mulai</th>
                      <th>Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAktivitas ? (
                      <tr>
                        <td colSpan={9} className="text-center py-3 text-muted">
                          <Spinner animation="border" size="sm" /> Memuat data...
                        </td>
                      </tr>
                    ) : logsAktivitas.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-3 text-secondary">
                          Belum ada catatan log aktivitas.
                        </td>
                      </tr>
                    ) : (
                      logsAktivitas.map((log, index) => (
                        <tr key={log.id}>
                          <td className="text-center fw-semibold">{index + 1}</td>
                          <td>{log.operator_pelaksana}</td>
                          <td>{log.uraian_pekerjaan}</td>
                          <td className="text-center">{log.tanggal}</td>
                          <td className="text-center">{log.waktu_mulai?.slice(0, 5) || "-"}</td>
                          <td className="text-center">{log.waktu_selesai?.slice(0, 5) || "-"}</td>
                          <td className="text-center fw-semibold">{log.jumlah}</td>
                          <td className="text-center">{log.pemeriksa}</td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                              <Button 
                                variant="outline-warning" 
                                size="sm" 
                                className="p-1"
                                title="Edit"
                                onClick={() => handleOpenEditModal(log)}
                              >
                                <IconEdit size={12} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="p-1"
                                title="Hapus"
                                onClick={() => handleDeleteAktivitas(log.id)}
                              >
                                <IconTrash size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>

          {/* MODAL POP-UP FORM AKTIVITAS (COMPACT) */}
          <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="lg" centered backdrop="static">
            <Modal.Header closeButton className="py-2 px-3">
              <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
                <IconActivity size={18} className="text-success" /> 
                {editingLogId ? "Edit Log Aktivitas" : "Tambah Log Aktivitas Baru"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
              <Form onSubmit={handleAddOrUpdateAktivitas} id="form-aktivitas">
                <Row className="g-2 mb-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Operator Pelaksana</Form.Label>
                      <Form.Control
                        size="sm"
                        required
                        placeholder="Nama Operator"
                        value={operator}
                        onChange={(e) => setOperator(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Uraian Pekerjaan</Form.Label>
                      <Form.Control
                        size="sm"
                        required
                        placeholder="Detail pekerjaan..."
                        value={uraianAkt}
                        onChange={(e) => setUraianAkt(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="g-2 mb-2">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Tanggal</Form.Label>
                      <Form.Control
                        size="sm"
                        type="date"
                        required
                        value={tglAkt}
                        onChange={(e) => setTglAkt(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Waktu Mulai</Form.Label>
                      <Form.Control
                        size="sm"
                        type="time"
                        required
                        value={jamMulai}
                        onChange={(e) => setJamMulai(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Waktu Selesai</Form.Label>
                      <Form.Control
                        size="sm"
                        type="time"
                        required
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-2 mb-1">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Jumlah / Output</Form.Label>
                      <Form.Control
                        size="sm"
                        type="number"
                        min={1}
                        required
                        placeholder="Contoh: 10"
                        value={jumlahAkt}
                        onChange={(e) => setJumlahAkt(Number(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Pemeriksa</Form.Label>
                      <Form.Control
                        size="sm"
                        required
                        placeholder="Nama Pemeriksa"
                        value={pemeriksaAkt}
                        onChange={(e) => setPemeriksaAkt(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light py-2 px-3">
              <Button variant="outline-secondary" size="sm" onClick={() => setShowFormModal(false)}>
                Batal
              </Button>
              <Button variant="success" size="sm" type="submit" form="form-aktivitas" disabled={submitLoading} className="fw-bold px-3">
                {submitLoading ? <Spinner size="sm" className="me-1" /> : null}
                {editingLogId ? "Perbarui" : "Simpan"}
              </Button>
            </Modal.Footer>
          </Modal>

        </div>
      )}
    </div>
  );
};

DataAktivitasManager.displayName = "DataAktivitasManager";

export default DataAktivitasManager;
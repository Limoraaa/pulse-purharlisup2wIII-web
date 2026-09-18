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
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconBox,
  IconMoodEmpty,
  IconArrowLeft,
  IconClipboardList,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";

// Import disesuaikan untuk Motor Konversi
import {MotorKonversiFormModal} from "./MotorKonversiFormModal";
import {useMotorKonversiColumns} from "./ColumnDefination";
// Sesuaikan Interface dengan Model MotorKonversi
interface MotorKonversiItemType {
  id: number | string;
  nomor_polisi: string;
  nama_motor: string;
  merek: string;
  warna: string;
  lokasi_penempatan: string;
  status: 'Aktif' | 'Tidak Aktif' | string;
}

// Interface Log Pemeliharaan (tambahkan null/undefined handling)
interface LogItemType {
  id: number;
  uraian_pemeliharaan: string;
  waktu_pelaksana: string;
  keterangan?: string | null;
  paraf: string;
}

// Definisi Kolom Export Data Motor
const EXPORT_COLUMNS_MOTOR: ExportColumn[] = [
  { header: "Nomor Polisi", key: "nomor_polisi" },
  { header: "Nama Motor", key: "nama_motor" },
  { header: "Merek", key: "merek" },
  { header: "Warna", key: "warna" },
  { header: "Lokasi Penempatan", key: "lokasi_penempatan" },
  { header: "Status", key: "status" },
];

const EXPORT_COLUMNS_LOG: ExportColumn[] = [
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Waktu Pelaksana", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Paraf", key: "paraf" },
];

const EXPORT_COLUMNS_ALL_LOGS: ExportColumn[] = [
  { header: "Nomor Polisi", key: "nomor_polisi" },
  { header: "Nama Motor", key: "nama_motor" },
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Tanggal", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Teknisi", key: "paraf" },
];

const DataMotorKonversiManager = () => {
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedMotor, setSelectedMotor] = useState<MotorKonversiItemType | null>(null);

  const [motorList, setMotorList] = useState<MotorKonversiItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State Log Pemeliharaan
  const [logs, setLogs] = useState<LogItemType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  // State Form Modal Log
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [waktu, setWaktu] = useState(new Date().toISOString().split("T")[0]);
  const [uraian, setUraian] = useState("");
  const [keteranganLog, setKeteranganLog] = useState("");
  const [temuan, setTemuan] = useState("");

  const loadMotor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: MotorKonversiItemType[] } | MotorKonversiItemType[]>("/motor-konversi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Memperbaiki TS Type Guard
      const data = Array.isArray(res) ? res : ('data' in res ? res.data : []);
      setMotorList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data motor konversi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMotor();
  }, [loadMotor]);

  const handleOpenDetail = useCallback(async (motor: MotorKonversiItemType) => {
    setSelectedMotor(motor);
    setViewMode("detail");
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      
      // Sesuaikan endpoint sesuai dengan route backend (/motor/{motor_id})
      const res = await api<{ data: LogItemType[] } | LogItemType[]>(`/log-pemeliharaan-motor/motor/${motor.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // PASTIKAN INI AMAN DARI OBJECT/ARRAY WRAPPER
      const data = Array.isArray(res) ? res : ('data' in res ? res.data : []);
      setLogs(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error("Gagal memuat log", err);
      setLogs([]); // Reset ke array kosong jika gagal
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const handleToggleStatus = useCallback(async (id: number | string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ success: boolean; message: string }>(`/motor-konversi/${id}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res && res.success) {
        setSuccessMessage(res.message);
        loadMotor();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status motor");
      setTimeout(() => setError(null), 3000);
    }
  }, [loadMotor]);

  const columns = useMotorKonversiColumns({
    onToggleStatus: handleToggleStatus,
    onOpenDetail: handleOpenDetail,
  });

  const filteredMotor = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return motorList;

    return motorList.filter((item) => {
      return (
        (item.nomor_polisi || "").toLowerCase().includes(keyword) ||
        (item.nama_motor || "").toLowerCase().includes(keyword) ||
        (item.merek || "").toLowerCase().includes(keyword) ||
        (item.lokasi_penempatan || "").toLowerCase().includes(keyword) ||
        (item.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [motorList, searchTerm]);

  // Export Data
  const handleExportPDF = () =>
    exportToPDF(filteredMotor as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MOTOR, "data-motor-konversi", "Data Motor Konversi");
  const handleExportExcel = () =>
    exportToExcel(filteredMotor as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MOTOR, "data-motor-konversi");

  const handleExportLogPDF = () =>
    exportToPDF(logs as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `log-pemeliharaan-${selectedMotor?.nomor_polisi}`, `Log Pemeliharaan - ${selectedMotor?.nama_motor}`);
  const handleExportLogExcel = () =>
    exportToExcel(logs as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `log-pemeliharaan-${selectedMotor?.nomor_polisi}`);

  const handleExportAllLogs = async (type: 'pdf' | 'excel') => {
    setExportingAll(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: any[] } | any[]>("/log-pemeliharaan-motor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const allLogs = Array.isArray(res) ? res : ('data' in res ? res.data : []);
      if (allLogs.length === 0) {
        alert("Belum ada data log pemeliharaan yang tercatat di sistem.");
        return;
      }

      if (type === 'pdf') {
        exportToPDF(allLogs, EXPORT_COLUMNS_ALL_LOGS, "semua-log-pemeliharaan-motor", "Seluruh Riwayat Pemeliharaan Motor Konversi");
      } else {
        exportToExcel(allLogs, EXPORT_COLUMNS_ALL_LOGS, "semua-log-pemeliharaan-motor");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil seluruh data log pemeliharaan");
    } finally {
      setExportingAll(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingLogId(null);
    setWaktu(new Date().toISOString().split("T")[0]);
    setUraian("");
    setKeteranganLog("");
    setTemuan("");
    setShowLogModal(true);
  };

  const handleOpenEditModal = (log: LogItemType) => {
    setEditingLogId(log.id);
    setWaktu(log.waktu_pelaksana);
    setUraian(log.uraian_pemeliharaan);
    
    // Perbaikan keamanan parsing nilai keterangan (menghindari error null)
    const rawKeterangan = log.keterangan || "";
    if (rawKeterangan.includes(" | Temuan: ")) {
      const parts = rawKeterangan.split(" | Temuan: ");
      setKeteranganLog(parts[0]);
      setTemuan(parts[1] || "");
    } else {
      setKeteranganLog(rawKeterangan);
      setTemuan("");
    }

    setShowLogModal(true);
  };

  const handleAddOrUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMotor) return;
    setSubmitLoading(true);

    const finalKeterangan = [
      keteranganLog,
      temuan ? `Temuan: ${temuan}` : ""
    ].filter(Boolean).join(" | ");

    try {
      const token = localStorage.getItem("token");
      const userName = localStorage.getItem("userName") || "Teknisi PUSHARLIS";

      const url = editingLogId ? `/log-pemeliharaan-motor/${editingLogId}` : "/log-pemeliharaan-motor";
      const method = editingLogId ? "PUT" : "POST";

      await api(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          motor_konversi_id: selectedMotor.id,
          uraian_pemeliharaan: uraian,
          waktu_pelaksana: waktu,
          keterangan: finalKeterangan,
          paraf: userName,
        }),
      });

      setShowLogModal(false);
      setSuccessMessage(editingLogId ? "Log pemeliharaan berhasil diperbarui!" : "Log pemeliharaan berhasil ditambahkan!");
      handleOpenDetail(selectedMotor);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan log");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan log pemeliharaan ini?")) return;

    try {
      const token = localStorage.getItem("token");
      await api(`/log-pemeliharaan-motor/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage("Log pemeliharaan berhasil dihapus!");
      if (selectedMotor) handleOpenDetail(selectedMotor);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus log");
    }
  };

  return (
    <div className="datamotor-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2 py-2 small" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={18} />
          {successMessage}
        </Alert>
      )}

      {error && <Alert variant="danger" className="py-2 small" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {viewMode === "list" ? (
        <>
          <Row>
            <Col>
              <Flex justifyContent="between" alignItems="center" className="mb-3 w-100" breakpoint="md">
                <div>
                  <h1 className="mb-1 h4 h2-md">Data Motor Konversi</h1>
                  <p className="text-secondary mb-0 small">Mengelola daftar motor konversi beserta log pemeliharaan dan aktivitas.</p>
                  <DasherBreadcrumb />
                </div>
                <div>
                  <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 py-2 px-3" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={16} /> Tambah Motor Baru
                  </Button>
                </div>
              </Flex>
            </Col>
          </Row>

          <Card className="card-lg mb-4">
            <div className="datatools-toolbar border-bottom p-2 p-md-3">
              <Row className="g-2 align-items-center">
                <Col xs={12} md={4}>
                  <InputGroup className="datatools-search input-group-sm">
                    <InputGroup.Text><IconSearch size={16} /></InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Cari nopol, nama, merek..."
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
                <Col xs={12} md={8} className="d-flex justify-content-md-end gap-1 flex-wrap align-items-center">
                  
                  {/* Ekspor Data Motor */}
                  <div className="d-flex align-items-center me-md-2 border-end pe-md-2 mb-2 mb-md-0">
                    <span className="me-2 small text-secondary" style={{ fontSize: "0.7rem" }}>Data Motor:</span>
                    <Button variant="outline-danger" size="sm" className="py-1 px-2 mx-1" style={{ fontSize: "0.75rem" }} onClick={handleExportPDF}>PDF</Button>
                    <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportExcel}>Excel</Button>
                  </div>

                  {/* Ekspor Seluruh Log */}
                  <div className="d-flex align-items-center mb-2 mb-md-0">
                    <span className="me-2 small text-secondary" style={{ fontSize: "0.7rem" }}>Seluruh Log:</span>
                    <Button variant="outline-danger" size="sm" className="py-1 px-2 mx-1" style={{ fontSize: "0.75rem" }} onClick={() => handleExportAllLogs('pdf')} disabled={exportingAll}>
                      {exportingAll ? <Spinner size="sm" /> : 'PDF'}
                    </Button>
                    <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={() => handleExportAllLogs('excel')} disabled={exportingAll}>
                      {exportingAll ? <Spinner size="sm" /> : 'Excel'}
                    </Button>
                  </div>
                  
                </Col>
              </Row>
            </div>

            <CardBody className="p-2 p-md-3">
              {loading ? (
                <div className="text-center py-4 small">
                  <Spinner animation="border" size="sm" className="me-2" /> Memuat data motor konversi...
                </div>
              ) : motorList.length === 0 ? (
                <div className="datatools-empty text-center py-4">
                  <div className="datatools-empty-icon mb-2"><IconBox size={28} /></div>
                  <h6 className="mb-1">Belum ada data motor konversi</h6>
                  <p className="text-secondary small mb-3">Mulai dengan menambahkan data motor konversi pertama.</p>
                  <Button variant="primary" size="sm" className="d-inline-flex align-items-center gap-1" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={16} /> Tambah Motor Baru
                  </Button>
                </div>
              ) : filteredMotor.length === 0 ? (
                <div className="datatools-empty text-center py-4">
                  <div className="datatools-empty-icon mb-2"><IconMoodEmpty size={28} /></div>
                  <h6 className="mb-1">Tidak ada hasil</h6>
                  <p className="text-secondary small mb-3">Tidak ditemukan data yang cocok.</p>
                  <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm("")}>
                    Reset Pencarian
                  </Button>
                </div>
              ) : (
                <TanstackTable data={filteredMotor} columns={columns} pagination isSortable />
              )}
            </CardBody>
          </Card>
        </>
      ) : (
        <div>
          {/* Header Detail Motor Konversi */}
          <Row className="mb-3">
            <Col>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <div>
                  <h2 className="mb-1 fs-5 fw-bold">{selectedMotor?.nama_motor}</h2>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 text-secondary" style={{ fontSize: "0.75rem" }}>
                      <li className="breadcrumb-item">Home</li>
                      <li className="breadcrumb-item">Pemeliharaan</li>
                      <li 
                        className="breadcrumb-item text-primary fw-semibold" 
                        style={{ cursor: "pointer" }}
                        onClick={() => setViewMode("list")}
                      >
                        Motor Konversi
                      </li>
                      <li className="breadcrumb-item active text-body fw-semibold">
                        {selectedMotor?.nomor_polisi}
                      </li>
                    </ol>
                  </nav>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-1 mt-md-0">
                  <Button variant="outline-danger" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportLogPDF}>PDF</Button>
                  <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportLogExcel}>Excel</Button>
                  <Button variant="outline-secondary" size="sm" className="py-1 px-2 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }} onClick={() => setViewMode("list")}>
                    <IconArrowLeft size={14} /> Kembali
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Info Singkat Motor */}
          <Card className="mb-3 border-primary shadow-none">
            <CardBody className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <span className="text-muted small fw-bold tracking-wider" style={{ fontSize: "0.7rem" }}>KARTU LOG PEMELIHARAAN</span>
                <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>{selectedMotor?.status}</span>
              </div>
              <Row>
                <Col md={6}>
                  <table className="w-100" style={{ fontSize: "0.8rem" }}>
                    <tbody>
                      <tr>
                        {/* Perbaikan class padding dari py-0.5 menjadi py-1 */}
                        <td className="fw-semibold text-secondary py-1" style={{ width: "120px" }}>Nomor Polisi</td>
                        <td className="py-1">: {selectedMotor?.nomor_polisi}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-secondary py-1">Merek & Warna</td>
                        <td className="py-1">: {selectedMotor?.merek} / {selectedMotor?.warna}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-secondary py-1">Lokasi Penempatan</td>
                        <td className="py-1">: {selectedMotor?.lokasi_penempatan}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Tabel Log Pemeliharaan Motor */}
          <Card className="shadow-none">
            <CardBody className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 d-flex align-items-center gap-1 fw-bold fs-6">
                  <IconClipboardList size={18} /> Riwayat Log Pemeliharaan
                </h6>
                <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleOpenAddModal}>
                  <IconPlus size={14} /> Tambah Catatan
                </Button>
              </div>

              <div className="table-responsive">
                <Table bordered hover className="align-middle table-sm text-nowrap" style={{ fontSize: "0.75rem" }}>
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "40px" }}>No</th>
                      <th>Uraian Pemeliharaan</th>
                      <th style={{ width: "130px" }}>Waktu Pelaksana</th>
                      <th>Keterangan</th>
                      <th style={{ width: "110px" }}>Paraf (Teknisi)</th>
                      <th style={{ width: "70px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-muted">
                          <Spinner animation="border" size="sm" /> Memuat riwayat log...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-secondary">
                          Belum ada catatan log pemeliharaan untuk motor ini.
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
                                onClick={() => handleDeleteLog(log.id)}
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
        </div>
      )}

      {/* Modal Input/Edit Pemeliharaan */}
      <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="py-2 px-3">
          <Modal.Title className="fs-6 fw-bold text-dark">
            {editingLogId ? "Edit Catatan Pemeliharaan" : "Tambah Catatan Pemeliharaan"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddOrUpdateLog}>
          <Modal.Body className="p-3">
            
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Waktu Pelaksana</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                required
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Uraian Pemeliharaan</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                required
                placeholder="Contoh: Pengecekan baterai, ganti komponen..."
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Keterangan</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                placeholder="Detail pemeliharaan / parts yang diganti"
                value={keteranganLog}
                onChange={(e) => setKeteranganLog(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-1">
              <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Temuan saat pemeliharaan (Opsional)</Form.Label>
              <Form.Control
                size="sm"
                as="textarea"
                rows={2}
                placeholder="Contoh: Kabel kontroler agak kendor"
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
              />
            </Form.Group>

          </Modal.Body>
          <Modal.Footer className="bg-light py-2 px-3">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowLogModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitLoading} className="fw-semibold px-3">
              {submitLoading ? <Spinner size="sm" className="me-1" /> : null}
              {editingLogId ? "Perbarui" : "Simpan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <MotorKonversiFormModal
        show={formModalOpen}
        onHide={() => setFormModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage("Data motor konversi berhasil ditambahkan!");
          loadMotor();
          setFormModalOpen(false); // Pastikan modal tertutup
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
      />
    </div>
  );
};

DataMotorKonversiManager.displayName = "DataMotorKonversiManager";

export default DataMotorKonversiManager;
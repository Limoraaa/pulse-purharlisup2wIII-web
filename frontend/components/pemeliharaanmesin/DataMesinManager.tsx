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
  IconArrowLeft,
  IconClipboardList,
  IconMapPin,
  IconClipboardCheck,
} from "@tabler/icons-react";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import MesinFormModal from "./MesinFormModal";
import PartMappingEditor from "./PartMappingEditor";
import PartMappingChecklistModal from "./PartMappingCheckListModal";

// Import definisi kolom dari file terpisah
import { useMesinColumns } from "./ColumnDefination";

interface MesinItemType {
  id: number | string;
  kode_mesin: string;
  nama_mesin: string;
  lokasi_ruang: string;
  status: 'Aktif' | 'Tidak Aktif';
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

// Kolom untuk export seluruh log semua mesin
const EXPORT_COLUMNS_ALL_LOGS: ExportColumn[] = [
  { header: "Kode Mesin", key: "kode_mesin" },
  { header: "Nama Mesin", key: "nama_mesin" },
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Tanggal", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Teknisi", key: "paraf" },
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

  // State Log Pemeliharaan (READ ONLY - dibuat lewat Checklist Visual, tidak ada input manual lagi)
  const [logs, setLogs] = useState<LogItemType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [exportingAll, setExportingAll] = useState(false); // State loading untuk export seluruh log

  // State modal Peta Part & Checklist Visual (satu-satunya cara membuat log baru)
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

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

  const handleOpenDetail = useCallback(async (mesin: MesinItemType) => {
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
  }, []);

  const handleToggleStatus = useCallback(async (id: number | string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ success: boolean; message: string }>(`/mesin-produksi/${id}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res && res.success) {
        setSuccessMessage(res.message);
        loadMesin();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status mesin");
      setTimeout(() => setError(null), 3000);
    }
  }, [loadMesin]);

  const columns = useMesinColumns({
    onToggleStatus: handleToggleStatus,
    onOpenDetail: handleOpenDetail,
  });

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

  // Export Data Mesin
  const handleExportPDF = () =>
    exportToPDF(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-produksi", "Data Mesin Produksi");
  const handleExportExcel = () =>
    exportToExcel(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-produksi");

  // Export Log Spesifik Mesin
  const handleExportLogPDF = () =>
    exportToPDF(logs as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${selectedMesin?.kode_mesin}`, `Kartu Gantung - ${selectedMesin?.nama_mesin}`);
  const handleExportLogExcel = () =>
    exportToExcel(logs as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${selectedMesin?.kode_mesin}`);

  // Export Seluruh Log Pemeliharaan
  const handleExportAllLogs = async (type: 'pdf' | 'excel') => {
    setExportingAll(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: any[] }>("/log-pemeliharaan", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allLogs = res.data || [];
      if (allLogs.length === 0) {
        alert("Belum ada data log pemeliharaan yang tercatat di sistem.");
        return;
      }

      if (type === 'pdf') {
        exportToPDF(allLogs, EXPORT_COLUMNS_ALL_LOGS, "semua-log-pemeliharaan", "Seluruh Riwayat Pemeliharaan Mesin");
      } else {
        exportToExcel(allLogs, EXPORT_COLUMNS_ALL_LOGS, "semua-log-pemeliharaan");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil seluruh data log pemeliharaan");
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="datamesin-page">
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
                  <h1 className="mb-1 h4 h2-md">Pemeliharaan Mesin Produksi</h1>
                  <p className="text-secondary mb-0 small">Mengelola daftar mesin produksi beserta log pemeliharaan dan aktivitas.</p>
                  <DasherBreadcrumb />
                </div>
                <div>
                  <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 py-2 px-3" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={16} /> Tambah Mesin Baru
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
                      placeholder="Cari kode, nama, lokasi..."
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

                  {/* Ekspor Data Mesin */}
                  <div className="d-flex align-items-center me-md-2 border-end pe-md-2 mb-2 mb-md-0">
                    <span className="me-2 small text-secondary" style={{ fontSize: "0.7rem" }}>Data Mesin:</span>
                    <Button variant="outline-danger" size="sm" className="py-1 px-2 mx-1" style={{ fontSize: "0.75rem" }} onClick={handleExportPDF}>PDF</Button>
                    <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportExcel}>Excel</Button>
                  </div>

                  {/* Ekspor Seluruh Log */}
                  <div className="d-flex align-items-center mb-2 mb-md-0">
                    <span className="me-2 small text-secondary" style={{ fontSize: "0.7rem" }}>Seluruh Log Pemeliharaan:</span>
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
                  <Spinner animation="border" size="sm" className="me-2" /> Memuat data mesin...
                </div>
              ) : mesinList.length === 0 ? (
                <div className="datatools-empty text-center py-4">
                  <div className="datatools-empty-icon mb-2"><IconBox size={28} /></div>
                  <h6 className="mb-1">Belum ada data mesin produksi</h6>
                  <p className="text-secondary small mb-3">Mulai dengan menambahkan data mesin produksi.</p>
                  <Button variant="primary" size="sm" className="d-inline-flex align-items-center gap-1" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={16} /> Tambah Mesin Baru
                  </Button>
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
                        onClick={() => setViewMode("list")}
                      >
                        Mesin
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
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="py-1 px-2 d-flex align-items-center gap-1"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => setShowMappingEditor(true)}
                  >
                    <IconMapPin size={14} /> Peta Part
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="py-1 px-2 d-flex align-items-center gap-1"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => setShowChecklistModal(true)}
                  >
                    <IconClipboardCheck size={14} /> Checklist Visual
                  </Button>
                  <Button variant="outline-secondary" size="sm" className="py-1 px-2 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }} onClick={() => setViewMode("list")}>
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
                <span className="text-muted small fw-bold tracking-wider" style={{ fontSize: "0.7rem" }}>KARTU GANTUNG PELAKSANAAN PEMELIHARAAN</span>
                <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>{selectedMesin?.status}</span>
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

          {/* TABEL RIWAYAT LOG PEMELIHARAAN - READ ONLY */}
          <Card className="shadow-none">
            <CardBody className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 d-flex align-items-center gap-1 fw-bold fs-6">
                  <IconClipboardList size={18} /> Riwayat Log Pemeliharaan
                </h6>
                <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                  Log baru dibuat lewat "Checklist Visual" — riwayat di bawah ini hanya untuk dilihat.
                </span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={5} className="text-center py-3 text-muted">
                          <Spinner animation="border" size="sm" /> Memuat riwayat log...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-3 text-secondary">
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

      {/* Satu-satunya cara membuat log pemeliharaan baru: Peta Part (admin) & Checklist Visual (teknisi) */}
      {selectedMesin && (
        <>
          <PartMappingEditor
            show={showMappingEditor}
            onHide={() => setShowMappingEditor(false)}
            mesinId={selectedMesin.id}
            mesinNama={selectedMesin.nama_mesin}
            onSaved={() => {
              setSuccessMessage("Mapping part berhasil disimpan!");
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
          />
          <PartMappingChecklistModal
            show={showChecklistModal}
            onHide={() => setShowChecklistModal(false)}
            mesinId={selectedMesin.id}
            mesinNama={selectedMesin.nama_mesin}
            onSubmitted={() => {
              setShowChecklistModal(false);
              setSuccessMessage("Laporan checklist visual berhasil disimpan!");
              handleOpenDetail(selectedMesin); // refresh riwayat log biar laporan baru langsung tampil
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
          />
        </>
      )}
    </div>
  );
};

DataMesinManager.displayName = "DataMesinManager";

export default DataMesinManager;
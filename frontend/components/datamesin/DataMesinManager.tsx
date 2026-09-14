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
} from "@tabler/icons-react";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import MesinFormModal from "./MesinFormModal";

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
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // State Khusus Form Modal Checklist
  const [showLogModal, setShowLogModal] = useState(false); // State Pop-Up Form
  const [waktu, setWaktu] = useState(new Date().toISOString().split("T")[0]);
  const [checkFilter, setCheckFilter] = useState(false);
  const [checkCoolant, setCheckCoolant] = useState(false);
  const [valCoolant, setValCoolant] = useState("");
  const [checkOli, setCheckOli] = useState(false);
  const [temuan, setTemuan] = useState("");

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
        loadMesin(); // Refresh data di tabel
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
    setSubmitLoading(true);

    // Gabungkan checklist yang dicentang menjadi satu string Uraian
    const uraianArr = [];
    if (checkFilter) uraianArr.push("Membersihkan filter udara");
    if (checkCoolant) uraianArr.push(`Pengisian coolant (${valCoolant || "0"} L)`);
    if (checkOli) uraianArr.push("Pengisian oli slideway");
    
    // Jika tidak ada yang dicentang, beri nilai default
    const finalUraian = uraianArr.length > 0 ? uraianArr.join(", ") : "Pengecekan rutin";

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
          uraian_pemeliharaan: finalUraian,
          waktu_pelaksana: waktu,
          keterangan: temuan,
          paraf: userName,
        }),
      });

      // Tutup Pop-Up dan Reset Form state
      setShowLogModal(false);
      setCheckFilter(false);
      setCheckCoolant(false);
      setValCoolant("");
      setCheckOli(false);
      setTemuan("");
      
      setSuccessMessage("Log pemeliharaan berhasil ditambahkan!");
      handleOpenDetail(selectedMesin);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan log");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="datamesin-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

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
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <IconClipboardList size={20} /> Riwayat Log Pemeliharaan
                </h5>
                <Button variant="primary" size="sm" className="d-flex align-items-center gap-1" onClick={() => setShowLogModal(true)}>
                  <IconPlus size={16} /> Tambah Catatan
                </Button>
              </div>

              {/* TABEL DATA */}
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

      {/* POP-UP FORM TAMBAH LOG PEMELIHARAAN */}
      <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold text-dark">Tambah Catatan Pemeliharaan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="formPemeliharaan" onSubmit={handleAddLog}>
            <Row className="mb-4">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Waktu Pelaksana</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-semibold text-dark mb-3">Checklist Pemeliharaan</h6>
            
            {/* Item 1 */}
            <Form.Group className="mb-3 d-flex align-items-center">
              <Form.Check 
                type="checkbox" 
                id="check-filter" 
                label={<span className="fw-medium ms-2">Membersihkan filter udara</span>}
                checked={checkFilter}
                onChange={(e) => setCheckFilter(e.target.checked)}
              />
            </Form.Group>

            {/* Item 2 (Dengan Input Liter) */}
            <Form.Group className="mb-3 d-flex align-items-center gap-3">
              <Form.Check 
                type="checkbox" 
                id="check-coolant" 
                label={<span className="fw-medium ms-2">Pengisian coolant</span>}
                checked={checkCoolant}
                onChange={(e) => {
                  setCheckCoolant(e.target.checked);
                  if (!e.target.checked) setValCoolant(""); // Reset nilai jika di-uncheck
                }}
              />
              {checkCoolant && (
                <InputGroup size="sm" style={{ width: "100px" }}>
                  <Form.Control 
                    type="number" 
                    placeholder="0" 
                    min="0.1"
                    step="0.1"
                    value={valCoolant}
                    onChange={(e) => setValCoolant(e.target.value)}
                    required 
                  />
                  <InputGroup.Text>L</InputGroup.Text>
                </InputGroup>
              )}
            </Form.Group>

            {/* Item 3 */}
            <Form.Group className="mb-4 d-flex align-items-center">
              <Form.Check 
                type="checkbox" 
                id="check-oli" 
                label={<span className="fw-medium ms-2">Pengisian oli slideway</span>}
                checked={checkOli}
                onChange={(e) => setCheckOli(e.target.checked)}
              />
            </Form.Group>

            {/* Temuan Opsional */}
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-secondary">Temuan saat pemeliharaan (Opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Contoh: baut penutup filter kendor"
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowLogModal(false)}>
            Batal
          </Button>
          <Button variant="primary" type="submit" form="formPemeliharaan" disabled={submitLoading} className="fw-semibold">
            {submitLoading ? <Spinner size="sm" /> : "Simpan Pemeliharaan"}
          </Button>
        </Modal.Footer>
      </Modal>

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
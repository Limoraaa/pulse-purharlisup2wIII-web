"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Spinner, Alert, InputGroup, Form, Table, Badge } from "react-bootstrap";
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
  IconMapPin,
  IconClipboardCheck,
} from "@tabler/icons-react";
import Link from "next/link";

import TanstackTable from "components/table/TanstackTable";

import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import MesinFormModal from "./MesinFormModal";
import PartMappingEditor from "./PartMappingEditor";
import PartMappingChecklistModal from "./PartMappingCheckListModal";

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
  status?: "baik" | "perlu_perhatian" | "rusak" | null;
  jumlah_part_diperiksa?: number | null;
  jumlah_part_total?: number | null;
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

const STATUS_BADGE = {
  baik: { label: "Baik", bg: "success" },
  perlu_perhatian: { label: "Perlu perhatian", bg: "warning" },
  rusak: { label: "Rusak", bg: "danger" },
} as const;

const DataPemeliharaanManager = () => {
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

  // State modal Peta Part & Checklist Visual (satu-satunya cara membuat log baru)
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const loadMesin = async () => {
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
  };

  useEffect(() => {
    loadMesin();
  }, []);

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
            <div className="d-flex flex-column flex-lg-row gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center justify-content-center gap-1 w-100 w-lg-auto"
                onClick={() => handleOpenDetail(mesin)}
              >
                <IconClipboardList size={14} /> Pemeliharaan
              </Button>
              <Link href={`/pemeliharaan/aktivitas-mesin?id=${mesin.id}`} className="w-100 w-lg-auto">
                <Button variant="outline-success" size="sm" className="d-flex align-items-center justify-content-center gap-1 w-100">
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
    <div className="datapemeliharaan-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {viewMode === "list" ? (
        <>
          <Row className="mb-4">
            <Col xs={12}>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 w-100">
                <div>
                  <h1 className="mb-2 h2">Pemeliharaan Mesin Produksi</h1>
                  <p className="text-secondary mb-0">Mengelola daftar mesin produksi beserta log pemeliharaan dan aktivitas.</p>
                </div>
                <div className="w-100 w-md-auto">
                  <Button variant="primary" className="d-flex align-items-center justify-content-center gap-2 w-100" onClick={() => setFormModalOpen(true)}>
                    <IconPlus size={18} /> Tambah Mesin Baru
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="card-lg mb-6">
            <div className="datatools-toolbar border-bottom p-3">
              <Row className="g-3 align-items-center">
                <Col xs={12} lg={5} md={12}>
                  <InputGroup className="datatools-search">
                    <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Cari kode, nama, lokasi..."
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
                <Col xs={12} lg={3} md={6} className="text-muted small text-center text-lg-start">
                  Menampilkan <span className="fw-semibold text-body">{filteredMesin.length}</span> dari {mesinList.length} data
                </Col>
                <Col xs={12} lg={4} md={6} className="d-flex flex-column flex-sm-row justify-content-lg-end gap-2">
                  <Button variant="outline-danger" size="sm" className="w-100 w-sm-auto" onClick={handleExportPDF}>Export PDF</Button>
                  <Button variant="outline-success" size="sm" className="w-100 w-sm-auto" onClick={handleExportExcel}>Export Excel</Button>
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
            <Col xs={12}>
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 w-100">
                <div>
                  <h1 className="mb-2 h2">{selectedMesin?.nama_mesin}</h1>
                  <nav aria-label="breadcrumb" className="d-none d-md-block">
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

                <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto mt-2 mt-lg-0">
                  <Button variant="outline-secondary" size="sm" onClick={() => setViewMode("list")} className="d-flex align-items-center justify-content-center gap-1 w-100 w-sm-auto order-5 order-sm-1">
                    <IconArrowLeft size={16} /> Kembali
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleExportLogPDF} className="w-100 w-sm-auto order-1 order-sm-2">Export PDF</Button>
                  <Button variant="outline-success" size="sm" onClick={handleExportLogExcel} className="w-100 w-sm-auto order-2 order-sm-3">Export Excel</Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowMappingEditor(true)}
                    className="d-flex align-items-center justify-content-center gap-1 w-100 w-sm-auto order-3 order-sm-4"
                  >
                    <IconMapPin size={16} /> Peta Part
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowChecklistModal(true)}
                    className="d-flex align-items-center justify-content-center gap-1 w-100 w-sm-auto order-4 order-sm-5"
                  >
                    <IconClipboardCheck size={16} /> Checklist Visual
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="mb-4 border-primary">
            <CardBody>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="text-muted small fw-bold tracking-wider">KARTU GANTUNG PELAKSANAAN PEMELIHARAAN</span>
                <span className="badge bg-success">{selectedMesin?.status}</span>
              </div>
              <Row>
                <Col xs={12} md={8} lg={6}>
                  <table className="w-100 text-sm">
                    <tbody>
                      <tr>
                        <td className="fw-semibold text-secondary py-1" style={{ width: "130px", minWidth: "120px" }}>Kode Mesin</td>
                        <td className="text-break">: {selectedMesin?.kode_mesin}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-secondary py-1">Lokasi / Ruang</td>
                        <td className="text-break">: {selectedMesin?.lokasi_ruang}</td>
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
                <span className="text-muted small">
                  Log baru dibuat lewat Checklist Visual — riwayat di bawah ini hanya untuk dilihat.
                </span>
              </div>

              <div className="table-responsive border rounded">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "40px" }}>No</th>
                      <th>Uraian Pemeliharaan</th>
                      <th style={{ width: "120px" }}>Waktu Pelaksana</th>
                      <th style={{ width: "130px" }}>Teknisi</th>
                      <th style={{ width: "90px" }}>Part Diperiksa</th>
                      <th style={{ width: "120px" }}>Status</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={7} className="text-center py-3 text-muted">
                          <Spinner animation="border" size="sm" /> Memuat riwayat log...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-3 text-secondary">
                          Belum ada catatan log pemeliharaan untuk mesin ini.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => {
                        const badge = log.status ? STATUS_BADGE[log.status] : null;
                        return (
                          <tr key={log.id}>
                            <td className="text-center fw-semibold">{index + 1}</td>
                            <td>{log.uraian_pemeliharaan}</td>
                            <td className="text-center text-nowrap">{log.waktu_pelaksana}</td>
                            <td className="text-center fw-semibold">{log.paraf}</td>
                            <td className="text-center text-nowrap">
                              {log.jumlah_part_diperiksa != null
                                ? `${log.jumlah_part_diperiksa} / ${log.jumlah_part_total ?? log.jumlah_part_diperiksa}`
                                : "-"}
                            </td>
                            <td className="text-center">
                              {badge ? (
                                <Badge bg={badge.bg} text={log.status === "perlu_perhatian" ? "dark" : undefined}>
                                  {badge.label}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>{log.keterangan || "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal Tambah Data Mesin */}
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

DataPemeliharaanManager.displayName = "DataPemeliharaanManager";

export default DataPemeliharaanManager;
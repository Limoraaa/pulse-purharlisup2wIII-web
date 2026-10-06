'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, CardBody, Button, Badge, Table, Spinner, Alert, Dropdown, Modal, Form } from 'react-bootstrap';
import { 
  IconArrowLeft, 
  IconBox, 
  IconHistory,      
  IconActivity, 
  IconFileText, 
  IconAlertTriangle, 
  IconMapPin,
  IconCalendarEvent,
  IconCash,
  IconClipboardList,
  IconMapPin as IconMap,
  IconClipboardCheck,
  IconCircleCheck,
  IconDownload,
  IconPlus,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';
import Image from 'next/image';
import api from 'lib/api';
import { exportToExcel, exportToPDF, ExportColumn } from 'components/ruangtools/riwayat/common/exportUtils';

// Import Modal pendukung
import PartMappingEditor from './PartMappingEditor';
import PartMappingChecklistModal from './PartMappingCheckListModal';

interface MesinProps {
  mesin: {
    id: number | string;
    nama?: string;
    nama_mesin?: string;
    kode?: string;
    kode_mesin?: string;
    status: string;
    lokasi?: string;
    lokasi_ruang?: string;
    foto_katalog?: string | null;
  };
  canManage?: boolean;
  onBack: () => void;
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

const EXPORT_COLUMNS_LOG: ExportColumn[] = [
  { header: "No", key: "no" },
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Waktu Pelaksana", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Teknisi", key: "paraf" },
];

const EXPORT_COLUMNS_AKTIVITAS: ExportColumn[] = [
  { header: "No", key: "no" },
  { header: "Operator Pelaksana", key: "operator_pelaksana" },
  { header: "Uraian Pekerjaan", key: "uraian_pekerjaan" },
  { header: "Tanggal", key: "tanggal" },
  { header: "Mulai", key: "waktu_mulai" },
  { header: "Selesai", key: "waktu_selesai" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Pemeriksa", key: "pemeriksa" },
];

const STATUS_BADGE = {
  baik: { label: "Baik", bg: "success" },
  perlu_perhatian: { label: "Perlu perhatian", bg: "warning" },
  rusak: { label: "Rusak", bg: "danger" },
} as const;

export default function DetailMesinManager({ mesin, canManage = false, onBack }: MesinProps) {

  const mesinId = mesin?.id;
  const mesinNama = mesin?.nama_mesin || mesin?.nama || 'Tanpa Nama';
  const mesinKode = mesin?.kode_mesin || mesin?.kode || '-';
  const mesinLokasi = mesin?.lokasi_ruang || mesin?.lokasi || '-';
  const mesinStatus = mesin?.status || 'Aktif';
  const mesinFoto = mesin?.foto_katalog;

  const [activeTab, setActiveTab] = useState('log_pemeliharaan');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogItemType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const [logAktivitas, setLogAktivitas] = useState<LogAktivitasType[]>([]);
  const [loadingAktivitas, setLoadingAktivitas] = useState(false);

  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // State Modal (Aktivitas) - CRUD Terpadu
  const [showAktivitasModal, setShowAktivitasModal] = useState(false);
  const [submitLoadingAktivitas, setSubmitLoadingAktivitas] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  
  const [operator, setOperator] = useState("");
  const [uraianAkt, setUraianAkt] = useState("");
  const [tglAkt, setTglAkt] = useState("");
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("16:00");
  const [jumlahAkt, setJumlahAkt] = useState<number>(1);
  const [pemeriksaAkt, setPemeriksaAkt] = useState("");

  const loadLogs = useCallback(async () => {
    if (!mesinId) return;
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: LogItemType[] } | LogItemType[]>(`/log-pemeliharaan/mesin/${mesinId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res) ? res : res.data || [];
      setLogs(data);
    } catch (err) {
      console.error("Gagal memuat log pemeliharaan", err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [mesinId]);

  const loadAktivitas = useCallback(async () => {
    if (!mesinId) return;
    setLoadingAktivitas(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: LogAktivitasType[] } | LogAktivitasType[]>(`/log-aktivitas/mesin/${mesinId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res) ? res : res.data || [];
      setLogAktivitas(data);
    } catch (err) {
      console.error("Gagal memuat log aktivitas", err);
      setLogAktivitas([]);
    } finally {
      setLoadingAktivitas(false);
    }
  }, [mesinId]);

  useEffect(() => {
    if (activeTab === 'log_pemeliharaan') {
      loadLogs();
    } else if (activeTab === 'log_aktivitas') {
      loadAktivitas();
    }
  }, [activeTab, loadLogs, loadAktivitas]);

  const handleExportLogPDF = () => {
    const dataWithIndex = logs.map((log, index) => ({ no: index + 1, ...log }));
    exportToPDF(dataWithIndex as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${mesinKode}`, `Kartu Gantung - ${mesinNama}`);
  };

  const handleExportLogExcel = () => {
    const dataWithIndex = logs.map((log, index) => ({ no: index + 1, ...log }));
    exportToExcel(dataWithIndex as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${mesinKode}`);
  };

  const handleExportAktivitasPDF = () => {
    const dataWithIndex = logAktivitas.map((item, index) => ({ no: index + 1, ...item }));
    exportToPDF(dataWithIndex as unknown as Record<string, unknown>[], EXPORT_COLUMNS_AKTIVITAS, `log-aktivitas-${mesinKode}`, `Log Aktivitas - ${mesinNama}`);
  };

  const handleExportAktivitasExcel = () => {
    const dataWithIndex = logAktivitas.map((item, index) => ({ no: index + 1, ...item }));
    exportToExcel(dataWithIndex as unknown as Record<string, unknown>[], EXPORT_COLUMNS_AKTIVITAS, `log-aktivitas-${mesinKode}`);
  };

  const handleOpenAddAktivitas = () => {
    setEditingLogId(null);
    const userName = localStorage.getItem("userName") || "";
    setOperator(userName);
    setUraianAkt("");
    setTglAkt(new Date().toISOString().split("T")[0]);
    setJamMulai("08:00");
    setJamSelesai("16:00");
    setJumlahAkt(1);
    setPemeriksaAkt("");
    setShowAktivitasModal(true);
  };

  const handleOpenEditAktivitas = (log: LogAktivitasType) => {
    setEditingLogId(log.id);
    setOperator(log.operator_pelaksana);
    setUraianAkt(log.uraian_pekerjaan);
    setTglAkt(log.tanggal);
    setJamMulai(log.waktu_mulai?.slice(0, 5) || "08:00");
    setJamSelesai(log.waktu_selesai?.slice(0, 5) || "16:00");
    setJumlahAkt(log.jumlah);
    setPemeriksaAkt(log.pemeriksa);
    setShowAktivitasModal(true);
  };

  const handleAddOrUpdateAktivitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesinId) return;
    setSubmitLoadingAktivitas(true);

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
          mesin_produksi_id: mesinId,
          operator_pelaksana: operator,
          uraian_pekerjaan: uraianAkt,
          tanggal: tglAkt,
          waktu_mulai: jamMulai,
          waktu_selesai: jamSelesai,
          jumlah: jumlahAkt,
          pemeriksa: pemeriksaAkt,
        }),
      });

      setShowAktivitasModal(false);
      setEditingLogId(null);
      setSuccessMessage(editingLogId ? "Log aktivitas berhasil diperbarui!" : "Log aktivitas berhasil dicatat!");
      loadAktivitas(); 
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan log aktivitas");
    } finally {
      setSubmitLoadingAktivitas(false);
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
      loadAktivitas();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus log aktivitas");
    }
  };

  return (
    <div className="detail-mesin-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2 py-2 small" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={18} />
          {successMessage}
        </Alert>
      )}

      {/* Header Navigator Tombol Kembali */}
      <div className="mb-3">
        <Button 
          variant="outline-secondary" 
          size="sm" 
          className="d-flex align-items-center gap-1"
          onClick={onBack}
        >
          <IconArrowLeft size={16} /> Kembali ke Katalog Mesin
        </Button>
      </div>

      {/* Hero Section: Profil Detail Mesin */}
      <Card className="mb-4 shadow-sm border-0">
        <CardBody className="p-4">
          <Row className="align-items-center g-4">
            
            <Col xs={12} md={4} lg={3}>
              <div 
                className="position-relative rounded overflow-hidden border bg-body shadow-sm d-flex align-items-center justify-content-center p-2" 
                style={{ height: '200px', width: '100%' }}
              >
                {mesinFoto ? (
                  <Image 
                    src={mesinFoto} 
                    alt={mesinNama || "Foto Mesin"}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    style={{ objectFit: 'contain', padding: '0.5rem' }}
                  />
                ) : (
                  <div className="text-muted text-center">
                    <IconBox size={48} stroke={1.5} className="mb-1 opacity-50" />
                    <div className="small">Tidak ada foto</div>
                  </div>
                )}
              </div>
            </Col>

            <Col xs={12} md={8} lg={9}>
              <div className="mb-2 text-center text-md-start">
                <span className="text-muted small fw-bold tracking-wider" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>KODE: {mesinKode}</span>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3 mt-1 flex-wrap">
                  <h2 className="h4 fw-bold text-body mb-0">{mesinNama}</h2>
                  <Badge 
                    bg={mesinStatus === 'Aktif' ? 'success' : mesinStatus === 'Maintenance' ? 'warning' : 'danger'}
                    className="px-3 py-1 shadow-sm"
                    style={{ fontSize: '0.75rem', fontWeight: '600' }}
                  >
                    {mesinStatus}
                  </Badge>
                </div>
              </div>

              <p className="text-secondary small mb-4 d-flex align-items-center justify-content-center justify-content-md-start gap-1">
                <IconMapPin size={16} className="text-muted" /> Lokasi Penempatan: <strong className="text-body">{mesinLokasi}</strong>
              </p>

              <Row className="g-3 pt-3 border-top">
                <Col xs={12} sm={6}>
                  <div className="p-3 bg-body-tertiary rounded border h-100 text-center text-md-start">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                      <IconCash size={16} className="me-2 text-primary" /> Total Biaya Pemeliharaan
                    </div>
                    <h6 className="fw-bold text-body mb-0 fs-5 mt-1">Rp 2.450.000</h6>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="p-3 bg-body-tertiary rounded border h-100 text-center text-md-start">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                      <IconCalendarEvent size={16} className="me-2 text-success" /> Servis / Pemeliharaan Berikutnya
                    </div>
                    <h6 className="fw-bold text-body mb-0 fs-5 mt-1">15 Nov 2026</h6>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Navigation Tabs */}
      <Card className="shadow-sm border-0">
        <div className="bg-body-tertiary border-bottom px-3 py-3 rounded-top">
          {/* justify-content-center memastikan tombol center di mobile */}
          <ul className="nav nav-pills gap-2 m-0 justify-content-center justify-content-md-start">
            {[
              { id: 'log_pemeliharaan', label: 'Log Pemeliharaan', icon: IconHistory }, 
              { id: 'log_aktivitas', label: 'Log Aktivitas', icon: IconActivity },
              { id: 'ik', label: 'Instruksi Kerja (IK)', icon: IconFileText },
              { id: 'hirarc', label: 'HIRARC', icon: IconAlertTriangle },
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li className="nav-item" key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`nav-link d-flex align-items-center gap-1 py-2 px-3 rounded-2 fw-semibold border-0 transition ${
                      isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-secondary bg-transparent hover-bg-body-secondary'
                    }`}
                    style={{ fontSize: '0.85rem' }}
                  >
                    {IconComponent && <IconComponent size={16} />}
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <CardBody className="p-3 p-md-4">
          
          {/* TAB: LOG PEMELIHARAAN */}
          {activeTab === 'log_pemeliharaan' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 text-center text-md-start">
                <h5 className="mb-0 d-flex align-items-center gap-2 fs-6 fw-bold w-100 w-md-auto justify-content-center justify-content-md-start">
                  <IconClipboardList size={18} /> Riwayat Log Pemeliharaan
                </h5>
                <div className="d-flex gap-2 flex-wrap w-100 w-md-auto justify-content-center">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem' }}>
                      <IconDownload size={14} /> Export
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-0" style={{ fontSize: '0.8rem' }}>
                      <Dropdown.Item onClick={handleExportLogPDF}>Export sebagai PDF</Dropdown.Item>
                      <Dropdown.Item onClick={handleExportLogExcel}>Export sebagai Excel</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  {canManage && (
                    <Button variant="outline-primary" size="sm" onClick={() => setShowMappingEditor(true)} className="d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem' }}>
                      <IconMap size={14} /> Peta Part
                    </Button>
                  )}
                  {canManage && (
                    <Button variant="primary" size="sm" onClick={() => setShowChecklistModal(true)} className="d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem' }}>
                      <IconClipboardCheck size={14} /> Checklist Visual
                    </Button>
                  )}
                </div>
              </div>

              <div className="table-responsive border rounded shadow-sm">
                <Table hover className="align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "5%" }}>No</th>
                      <th className="text-start" style={{ width: "30%" }}>Uraian Pemeliharaan</th>
                      <th style={{ width: "12%" }}>Waktu Pelaksana</th>
                      <th style={{ width: "13%" }}>Teknisi</th>
                      <th style={{ width: "10%" }}>Part Diperiksa</th>
                      <th style={{ width: "10%" }}>Status</th>
                      <th className="text-start" style={{ width: "20%" }}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          <Spinner animation="border" size="sm" className="me-2" /> Memuat riwayat log pemeliharaan...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-secondary">
                          <IconHistory size={32} className="mb-2 opacity-50" /><br/>
                          Belum ada catatan log pemeliharaan untuk mesin ini.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => {
                        const badge = log.status ? STATUS_BADGE[log.status] : null;
                        return (
                          <tr key={log.id}>
                            <td className="text-center fw-semibold text-muted">{index + 1}</td>
                            <td>
                              <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {log.uraian_pemeliharaan}
                              </div>
                            </td>
                            <td className="text-center text-nowrap">{log.waktu_pelaksana}</td>
                            <td className="text-center fw-semibold text-secondary">{log.paraf}</td>
                            <td className="text-center text-nowrap fw-medium">
                              {log.jumlah_part_diperiksa != null
                                ? `${log.jumlah_part_diperiksa} / ${log.jumlah_part_total ?? log.jumlah_part_diperiksa}`
                                : "-"}
                            </td>
                            <td className="text-center">
                              {badge ? (
                                <Badge bg={badge.bg} text={log.status === "perlu_perhatian" ? "dark" : undefined} className="px-2 py-1 shadow-sm" style={{ minWidth: '95px' }}>
                                  {badge.label}
                                </Badge>
                              ) : "-"}
                            </td>
                            <td>
                              <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={log.keterangan || ""}>
                                {log.keterangan || "-"}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB: LOG AKTIVITAS */}
          {activeTab === 'log_aktivitas' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 text-center text-md-start">
                <h5 className="mb-0 d-flex align-items-center gap-2 fs-6 fw-bold w-100 w-md-auto justify-content-center justify-content-md-start">
                  <IconActivity size={18} /> Riwayat Log Aktivitas
                </h5>
                <div className="d-flex gap-2 flex-wrap w-100 w-md-auto justify-content-center">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem' }}>
                      <IconDownload size={14} /> Export
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-0" style={{ fontSize: '0.8rem' }}>
                      <Dropdown.Item onClick={handleExportAktivitasPDF}>Export sebagai PDF</Dropdown.Item>
                      <Dropdown.Item onClick={handleExportAktivitasExcel}>Export sebagai Excel</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  {canManage && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="d-flex align-items-center gap-1 shadow-sm" 
                      style={{ fontSize: '0.75rem' }} 
                      onClick={handleOpenAddAktivitas}
                    >
                      <IconPlus size={14} /> Tambah Aktivitas
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="table-responsive border rounded shadow-sm">
                <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light text-center">
                    <tr>
                      <th rowSpan={2} style={{ width: "40px", verticalAlign: "middle" }}>No</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Operator Pelaksana</th>
                      <th className="text-start" rowSpan={2} style={{ verticalAlign: "middle", minWidth: "200px" }}>Uraian Pekerjaan</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Tanggal</th>
                      <th colSpan={2}>Waktu</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Jumlah</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Pemeriksa</th>
                      {canManage && <th rowSpan={2} style={{ width: "80px", verticalAlign: "middle" }}>Aksi</th>}
                    </tr>
                    <tr>
                      <th>Mulai</th>
                      <th>Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAktivitas ? (
                      <tr>
                        <td colSpan={canManage ? 9 : 8} className="text-center py-4 text-muted">
                          <Spinner animation="border" size="sm" className="me-2" /> Memuat log aktivitas...
                        </td>
                      </tr>
                    ) : logAktivitas.length === 0 ? (
                      <tr>
                        <td colSpan={canManage ? 9 : 8} className="text-center py-5 text-secondary">
                          <IconActivity size={32} className="mb-2 opacity-50" /><br/>
                          Belum ada catatan log aktivitas harian untuk mesin ini.
                        </td>
                      </tr>
                    ) : (
                      logAktivitas.map((item, index) => (
                        <tr key={item.id}>
                          <td className="text-center fw-semibold text-muted">{index + 1}</td>
                          <td className="text-center fw-semibold text-secondary">{item.operator_pelaksana}</td>
                          <td style={{ whiteSpace: "normal" }}>
                            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.uraian_pekerjaan}
                            </div>
                          </td>
                          <td className="text-center">{item.tanggal}</td>
                          <td className="text-center">{item.waktu_mulai?.slice(0, 5) || "-"}</td>
                          <td className="text-center">{item.waktu_selesai?.slice(0, 5) || "-"}</td>
                          <td className="text-center fw-bold">{item.jumlah}</td>
                          <td className="text-center">{item.pemeriksa}</td>
                          {canManage && (
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                <Button 
                                  variant="outline-warning" 
                                  size="sm" 
                                  className="p-1"
                                  title="Edit"
                                  onClick={() => handleOpenEditAktivitas(item)}
                                >
                                  <IconEdit size={12} />
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  className="p-1"
                                  title="Hapus"
                                  onClick={() => handleDeleteAktivitas(item.id)}
                                >
                                  <IconTrash size={12} />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB: INSTRUKSI KERJA */}
          {activeTab === 'ik' && (
            <div className="text-center py-5 text-muted">
              <IconFileText size={36} className="mb-2 opacity-50" />
              <h6 className="mb-1">Dokumen Instruksi Kerja (IK)</h6>
              <p className="small text-secondary mb-0">Menampilkan file panduan instruksi kerja untuk {mesinNama}.</p>
            </div>
          )}

          {/* TAB: HIRARC */}
          {activeTab === 'hirarc' && (
            <div className="text-center py-5 text-muted">
              <IconAlertTriangle size={36} className="mb-2 opacity-50 text-warning" />
              <h6 className="mb-1">Dokumen HIRARC</h6>
              <p className="small text-secondary mb-0">Analisis potensi bahaya dan risiko keselamatan kerja mesin {mesinNama}.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL: Tambah/Edit Aktivitas */}
      <Modal show={showAktivitasModal} onHide={() => setShowAktivitasModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="py-2 px-3 bg-body-tertiary">
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2 text-body">
            <IconActivity size={18} className="text-success" /> 
            {editingLogId ? "Edit Log Aktivitas" : "Tambah Log Aktivitas Baru"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 bg-body">
          <Form onSubmit={handleAddOrUpdateAktivitas} id="form-aktivitas">
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Operator Pelaksana</Form.Label>
                  <Form.Control size="sm" required placeholder="Nama Operator" value={operator} onChange={(e) => setOperator(e.target.value)} className="bg-body text-body" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Uraian Pekerjaan</Form.Label>
                  <Form.Control size="sm" required placeholder="Detail pekerjaan..." value={uraianAkt} onChange={(e) => setUraianAkt(e.target.value)} className="bg-body text-body" />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-2 mb-2">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Tanggal</Form.Label>
                  <Form.Control size="sm" type="date" required value={tglAkt} onChange={(e) => setTglAkt(e.target.value)} className="bg-body text-body" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Waktu Mulai</Form.Label>
                  <Form.Control size="sm" type="time" required value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} className="bg-body text-body" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Waktu Selesai</Form.Label>
                  <Form.Control size="sm" type="time" required value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} className="bg-body text-body" />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mb-1">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Jumlah / Output</Form.Label>
                  <Form.Control size="sm" type="number" min={1} required placeholder="Contoh: 10" value={jumlahAkt} onChange={(e) => setJumlahAkt(Number(e.target.value))} className="bg-body text-body" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>Pemeriksa</Form.Label>
                  <Form.Control size="sm" required placeholder="Nama Pemeriksa" value={pemeriksaAkt} onChange={(e) => setPemeriksaAkt(e.target.value)} className="bg-body text-body" />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-body-tertiary py-2 px-3">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowAktivitasModal(false)}>Batal</Button>
          <Button variant="success" size="sm" type="submit" form="form-aktivitas" disabled={submitLoadingAktivitas} className="fw-bold px-3">
            {submitLoadingAktivitas ? <Spinner size="sm" className="me-1" /> : null}
            {editingLogId ? "Perbarui" : "Simpan"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Peta Part & Checklist Visual */}
      {mesinId && (
        <>
          <PartMappingEditor
            show={showMappingEditor}
            onHide={() => setShowMappingEditor(false)}
            mesinId={mesinId}
            mesinNama={mesinNama}
            onSaved={() => {
              setSuccessMessage("Mapping part berhasil disimpan!");
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
          />
          <PartMappingChecklistModal
            show={showChecklistModal}
            onHide={() => setShowChecklistModal(false)}
            mesinId={mesinId}
            mesinNama={mesinNama}
            onSubmitted={() => {
              setShowChecklistModal(false);
              setSuccessMessage("Laporan checklist visual berhasil disimpan!");
              loadLogs();
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
          />
        </>
      )}
    </div>
  );
}
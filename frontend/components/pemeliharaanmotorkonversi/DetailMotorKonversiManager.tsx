'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, CardBody, Button, Badge, Table, Spinner, Alert, Dropdown } from 'react-bootstrap';
import { 
  IconArrowLeft, 
  IconBox, 
  IconHistory,      
  IconFileText, 
  IconAlertTriangle, 
  IconMapPin,
  IconCalendarEvent,
  IconCash,
  IconClipboardList,
  IconMapPin as IconMap,
  IconClipboardCheck,
  IconCircleCheck,
  IconDownload
} from '@tabler/icons-react';
import Image from 'next/image';
import api from 'lib/api';
import { exportToExcel, exportToPDF, ExportColumn } from 'components/ruangtools/riwayat/common/exportUtils';

// Import Modal pendukung (Pastikan Anda mengadaptasi file ini juga nantinya untuk Motor)
import PartMappingEditorMotor from './PartMappingEditor'; // Sesuaikan path jika namanya diubah
import PartMappingChecklistModalMotor from './PartMappingCheckListModal'; // Sesuaikan path jika namanya diubah

interface MotorProps {
  motor: {
    id: number | string;
    nama?: string;
    nama_motor?: string;
    kode?: string;
    kode_motor?: string;
    status: string;
    lokasi?: string;
    lokasi_ruang?: string;
    foto_katalog?: string | null;
  };
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

const EXPORT_COLUMNS_LOG: ExportColumn[] = [
  { header: "No", key: "no" },
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Waktu Pelaksana", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Teknisi", key: "paraf" },
];

const STATUS_BADGE = {
  baik: { label: "Baik", bg: "success" },
  perlu_perhatian: { label: "Perlu perhatian", bg: "warning" },
  rusak: { label: "Rusak", bg: "danger" },
} as const;

export default function DetailMotorKonversiManager({ motor, onBack }: MotorProps) {
  const motorId = motor?.id;
  const motorNama = motor?.nama_motor || motor?.nama || 'Tanpa Nama';
  const motorKode = motor?.kode_motor || motor?.kode || '-';
  const motorLokasi = motor?.lokasi_ruang || motor?.lokasi || '-';
  const motorStatus = motor?.status || 'Aktif';
  const motorFoto = motor?.foto_katalog;

  const [activeTab, setActiveTab] = useState('log_pemeliharaan');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogItemType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // Sesuaikan endpoint API ini dengan backend Motor Konversi Anda
  const loadLogs = useCallback(async () => {
    if (!motorId) return;
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      // Asumsi endpoint log pemeliharaan motor:
      const res = await api<{ data: LogItemType[] } | LogItemType[]>(`/log-pemeliharaan-motor/by-motor/${motorId}`, {
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
  }, [motorId]);

  useEffect(() => {
    if (activeTab === 'log_pemeliharaan') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  const handleExportLogPDF = () => {
    const dataWithIndex = logs.map((log, index) => ({ no: index + 1, ...log }));
    exportToPDF(dataWithIndex as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${motorKode}`, `Kartu Gantung - ${motorNama}`);
  };

  const handleExportLogExcel = () => {
    const dataWithIndex = logs.map((log, index) => ({ no: index + 1, ...log }));
    exportToExcel(dataWithIndex as unknown as Record<string, unknown>[], EXPORT_COLUMNS_LOG, `kartu-gantung-${motorKode}`);
  };

  return (
    <div className="detail-motor-page">
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
          <IconArrowLeft size={16} /> Kembali ke Katalog Motor
        </Button>
      </div>

      {/* Hero Section: Profil Detail Motor */}
      <Card className="mb-4 shadow-sm border-0">
        <CardBody className="p-4">
          <Row className="align-items-center g-4">
            
            <Col xs={12} md={4} lg={3}>
              <div 
                className="position-relative rounded overflow-hidden border bg-body shadow-sm d-flex align-items-center justify-content-center p-2" 
                style={{ height: '200px', width: '100%' }}
              >
                {motorFoto ? (
                  <Image 
                    src={motorFoto} 
                    alt={motorNama || "Foto Motor"}
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
                <span className="text-muted small fw-bold tracking-wider" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>KODE: {motorKode}</span>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3 mt-1 flex-wrap">
                  <h2 className="h4 fw-bold text-body mb-0">{motorNama}</h2>
                  <Badge 
                    bg={motorStatus === 'Aktif' ? 'success' : motorStatus === 'Maintenance' ? 'warning' : 'danger'}
                    className="px-3 py-1 shadow-sm"
                    style={{ fontSize: '0.75rem', fontWeight: '600' }}
                  >
                    {motorStatus}
                  </Badge>
                </div>
              </div>

              <p className="text-secondary small mb-4 d-flex align-items-center justify-content-center justify-content-md-start gap-1">
                <IconMapPin size={16} className="text-muted" /> Lokasi Penempatan: <strong className="text-body">{motorLokasi}</strong>
              </p>

              <Row className="g-3 pt-3 border-top">
                <Col xs={12} sm={6}>
                  <div className="p-3 bg-body-tertiary rounded border h-100 text-center text-md-start">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                      <IconCash size={16} className="me-2 text-primary" /> Total Biaya Pemeliharaan
                    </div>
                    <h6 className="fw-bold text-body mb-0 fs-5 mt-1">Rp 0</h6>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="p-3 bg-body-tertiary rounded border h-100 text-center text-md-start">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                      <IconCalendarEvent size={16} className="me-2 text-success" /> Servis / Pemeliharaan Berikutnya
                    </div>
                    <h6 className="fw-bold text-body mb-0 fs-5 mt-1">Belum Terjadwal</h6>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Navigation Tabs (Tanpa Log Aktivitas) */}
      <Card className="shadow-sm border-0">
        <div className="bg-body-tertiary border-bottom px-3 py-3 rounded-top">
          <ul className="nav nav-pills gap-2 m-0 justify-content-center justify-content-md-start">
            {[
              { id: 'log_pemeliharaan', label: 'Log Pemeliharaan', icon: IconHistory }, 
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
                  
                  <Button variant="outline-primary" size="sm" onClick={() => setShowMappingEditor(true)} className="d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem' }}>
                    <IconMap size={14} /> Peta Komponen
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setShowChecklistModal(true)} className="d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem' }}>
                    <IconClipboardCheck size={14} /> Checklist Visual
                  </Button>
                </div>
              </div>

              <div className="table-responsive border rounded shadow-sm">
                <Table hover className="align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light text-center text-nowrap">
                    <tr>
                      <th style={{ width: "5%" }}>No</th>
                      <th className="text-start" style={{ width: "25%" }}>Uraian Pemeliharaan</th>
                      <th style={{ width: "12%" }}>Waktu Pelaksana</th>
                      <th style={{ width: "12%" }}>Teknisi</th>
                      <th style={{ width: "12%" }}>Part Diperiksa</th>
                      <th style={{ width: "10%" }}>Status</th>
                      <th className="text-start" style={{ width: "15%" }}>Keterangan</th>
                      <th style={{ width: "9%" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          <Spinner animation="border" size="sm" className="me-2" /> Memuat riwayat log pemeliharaan...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-secondary">
                          <IconHistory size={32} className="mb-2 opacity-50" /><br/>
                          Belum ada catatan log pemeliharaan untuk motor ini.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => {
                        const badge = log.status ? STATUS_BADGE[log.status] : null;
                        return (
                          <tr key={log.id}>
                            <td className="text-center fw-semibold text-muted">{index + 1}</td>
                            <td>
                              <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={log.uraian_pemeliharaan}>
                                {log.uraian_pemeliharaan}
                              </div>
                            </td>
                            <td className="text-center text-nowrap">{log.waktu_pelaksana}</td>
                            <td className="text-center fw-semibold text-secondary text-nowrap">{log.paraf}</td>
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
                              <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={log.keterangan || ""}>
                                {log.keterangan || "-"}
                              </div>
                            </td>
                            {/* --- TAMBAHAN TOMBOL AKSI --- */}
                            <td className="text-center text-nowrap">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="px-2 py-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => {
                                  // Nanti Anda bisa memanggil fungsi modal detail di sini
                                  console.log("Lihat Detail Log", log.id);
                                }}
                              >
                                Detail
                              </Button>
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

          {/* TAB: INSTRUKSI KERJA */}
          {activeTab === 'ik' && (
            <div className="text-center py-5 text-muted">
              <IconFileText size={36} className="mb-2 opacity-50" />
              <h6 className="mb-1">Dokumen Instruksi Kerja (IK)</h6>
              <p className="small text-secondary mb-0">Menampilkan file panduan instruksi kerja untuk {motorNama}.</p>
            </div>
          )}

          {/* TAB: HIRARC */}
          {activeTab === 'hirarc' && (
            <div className="text-center py-5 text-muted">
              <IconAlertTriangle size={36} className="mb-2 opacity-50 text-warning" />
              <h6 className="mb-1">Dokumen HIRARC</h6>
              <p className="small text-secondary mb-0">Analisis potensi bahaya dan risiko keselamatan kerja motor {motorNama}.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal Peta Part & Checklist Visual (Pastikan import disesuaikan) */}
      {motorId && (
        <>
          <PartMappingEditorMotor
            show={showMappingEditor}
            onHide={() => setShowMappingEditor(false)}
            mesinId={motorId}
            mesinNama={motorNama}
            onSaved={() => {
              setSuccessMessage("Mapping komponen berhasil disimpan!");
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
          />
          <PartMappingChecklistModalMotor
            show={showChecklistModal}
            onHide={() => setShowChecklistModal(false)}
            mesinId={motorId}
            mesinNama={motorNama}
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
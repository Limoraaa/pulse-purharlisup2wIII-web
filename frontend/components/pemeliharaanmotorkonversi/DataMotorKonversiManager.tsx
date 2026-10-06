"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Alert,
  InputGroup,
  Form,
  Spinner,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconBox,
  IconMoodEmpty,
  IconMapPin,
} from "@tabler/icons-react";
import Image from "next/image";

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import DetailMotorKonversiManager from "./DetailMotorKonversiManager";
import { MotorKonversiFormModal } from "./MotorKonversiFormModal";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";

interface MotorKonversiItemType {
  id: number | string;
  nomor_polisi: string;
  nama_motor: string;
  merek: string;
  warna: string;
  lokasi_penempatan: string;
  status: 'Aktif' | 'Maintenance' | 'Rusak' | string;
  foto_katalog?: string | null;
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

const EXPORT_COLUMNS_ALL_LOGS: ExportColumn[] = [
  { header: "Nomor Polisi", key: "nomor_polisi" },
  { header: "Nama Motor", key: "nama_motor" },
  { header: "Uraian Pemeliharaan", key: "uraian_pemeliharaan" },
  { header: "Tanggal", key: "waktu_pelaksana" },
  { header: "Keterangan", key: "keterangan" },
  { header: "Teknisi", key: "paraf" },
];

const DataMotorKonversiManager = () => {
  const [selectedMotor, setSelectedMotor] = useState<MotorKonversiItemType | null>(null);
  const [motorList, setMotorList] = useState<MotorKonversiItemType[]>([]);
  const [loading, setLoading] = useState(true);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const loadMotor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: MotorKonversiItemType[] } | MotorKonversiItemType[]>("/motor-konversi", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const filteredMotor = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return motorList;

    return motorList.filter((item) => {
      return (
        (item.nama_motor || "").toLowerCase().includes(keyword) ||
        (item.nomor_polisi || "").toLowerCase().includes(keyword) ||
        (item.merek || "").toLowerCase().includes(keyword) ||
        (item.lokasi_penempatan || "").toLowerCase().includes(keyword) ||
        (item.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [motorList, searchTerm]);

  // Handler Export
  const handleExportPDF = () =>
    exportToPDF(filteredMotor as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MOTOR, "data-motor-konversi", "Data Motor Konversi");
  const handleExportExcel = () =>
    exportToExcel(filteredMotor as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MOTOR, "data-motor-konversi");

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

  // Render komponen detail jika ada motor yang dipilih
  if (selectedMotor) {
    return (
      <DetailMotorKonversiManager 
        motor={{
          id: selectedMotor.id,
          nama_motor: selectedMotor.nama_motor,
          kode_motor: selectedMotor.nomor_polisi,
          lokasi_ruang: selectedMotor.lokasi_penempatan,
          status: selectedMotor.status,
          foto_katalog: selectedMotor.foto_katalog || null,
        }} 
        onBack={() => setSelectedMotor(null)} 
      />
    );
  }

  return (
    <div className="datamotor-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2 py-2 small" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={18} />
          {successMessage}
        </Alert>
      )}

      {error && <Alert variant="danger" className="py-2 small" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-3 w-100" breakpoint="md">
            <div>
              <h1 className="mb-1 h4 h2-md">Katalog Motor Konversi</h1>
              <p className="text-secondary mb-0 small">Daftar motor konversi beserta dokumen IK dan log pemeliharaan.</p>
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

      <Card className="card-lg mb-4 shadow-sm border-0">
        <div className="datatools-toolbar border-bottom p-2 p-md-3">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={5} lg={4}>
              <InputGroup className="datatools-search input-group-sm">
                <InputGroup.Text className="bg-body-secondary border-end-0"><IconSearch size={16} /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari nopol, nama, merek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-body border-start-0"
                />
                {searchTerm && (
                  <Button variant="outline-secondary" className="datatools-search-clear border" onClick={() => setSearchTerm("")}>
                    <IconX size={14} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={12} md={7} lg={8} className="d-flex justify-content-md-end gap-2 flex-wrap align-items-center mt-2 mt-md-0">
              {/* Grup Export Data Motor */}
              <div className="d-flex align-items-center me-md-2 border-end pe-md-2">
                <span className="me-2 small text-secondary d-none d-lg-inline" style={{ fontSize: "0.7rem" }}>Katalog:</span>
                <Button variant="outline-danger" size="sm" className="py-1 px-2 mx-1" style={{ fontSize: "0.75rem" }} onClick={handleExportPDF}>PDF</Button>
                <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportExcel}>Excel</Button>
              </div>

              {/* Grup Export Log */}
              <div className="d-flex align-items-center">
                <span className="me-2 small text-secondary d-none d-lg-inline" style={{ fontSize: "0.7rem" }}>Riwayat Log:</span>
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

        <CardBody className="p-3 p-md-4 bg-body-tertiary">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat katalog motor konversi...
            </div>
          ) : motorList.length === 0 ? (
            <div className="datatools-empty text-center py-5 bg-body rounded border">
              <div className="datatools-empty-icon mb-2 text-muted"><IconBox size={40} /></div>
              <h6 className="mb-1">Belum ada data motor konversi</h6>
              <p className="text-secondary small mb-3">Mulai dengan menambahkan data motor konversi pertama.</p>
              <Button variant="primary" size="sm" className="d-inline-flex align-items-center gap-1" onClick={() => setFormModalOpen(true)}>
                <IconPlus size={16} /> Tambah Motor Baru
              </Button>
            </div>
          ) : filteredMotor.length === 0 ? (
            <div className="datatools-empty text-center py-5 bg-body rounded border">
              <div className="datatools-empty-icon mb-2 text-muted"><IconMoodEmpty size={40} /></div>
              <h6 className="mb-1">Tidak ada hasil</h6>
              <p className="text-secondary small mb-3">Tidak ditemukan data motor yang cocok dengan pencarian Anda.</p>
              <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm("")}>
                Reset Pencarian
              </Button>
            </div>
          ) : (
            <Row className="g-3">
              {filteredMotor.map((motor) => (
                <Col xs={6} sm={4} md={3} lg={2} xl={2} key={motor.id}>
                  <Card 
                    className="h-100 shadow-sm border overflow-hidden bg-body" 
                    style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onClick={() => setSelectedMotor(motor)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#0d6efd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
                      e.currentTarget.style.borderColor = 'var(--bs-border-color)';
                    }}
                  >
                    {/* Image Area */}
                    <div style={{ paddingTop: '100%', position: 'relative', backgroundColor: 'var(--bs-tertiary-bg)', borderBottom: '1px solid var(--bs-border-color)' }}>
                      {motor.foto_katalog ? (
                        <Image 
                          src={motor.foto_katalog} 
                          alt={motor.nama_motor}
                          fill
                          sizes="(max-width: 768px) 50vw, 20vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-secondary opacity-50">
                          <IconBox size={48} stroke={1.5} />
                        </div>
                      )}
                      
                      {/* Badge Status */}
                      <div className="position-absolute top-0 end-0 mt-2 z-3">
                        <span 
                          className={`badge rounded-start-2 rounded-end-0 shadow-sm ${
                            motor.status === 'Aktif' ? 'bg-success' : 
                            motor.status === 'Maintenance' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {motor.status}
                        </span>
                      </div>
                    </div>

                    {/* Info Area */}
                    <CardBody className="p-2 d-flex flex-column">
                      <div className="flex-grow-1">
                        <h6 
                          className="mb-1 text-body fw-bold" 
                          style={{ 
                            fontSize: '0.8rem', 
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          title={motor.nama_motor}
                        >
                          {motor.nama_motor}
                        </h6>
                        <small className="text-muted d-block mb-2" style={{ fontSize: '0.65rem' }}>
                          {motor.nomor_polisi} {motor.merek ? `• ${motor.merek}` : ''}
                        </small>
                      </div>
                      
                      <div className="mt-auto pt-2 border-top d-flex align-items-center text-secondary" style={{ fontSize: '0.65rem' }}>
                        <IconMapPin size={12} className="me-1 flex-shrink-0" />
                        <span className="text-truncate" title={motor.lokasi_penempatan}>{motor.lokasi_penempatan}</span>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </CardBody>
      </Card>

      {/* Modal Tambah Motor */}
      {formModalOpen && (
        <MotorKonversiFormModal
          show={formModalOpen}
          onHide={() => setFormModalOpen(false)}
          onSuccess={() => {
            setSuccessMessage("Data motor konversi berhasil ditambahkan!");
            loadMotor();
            setFormModalOpen(false);
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
};

DataMotorKonversiManager.displayName = "DataMotorKonversiManager";

export default DataMotorKonversiManager;
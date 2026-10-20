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
  IconDatabase,
  IconSearch,
  IconX,
  IconBox,
  IconMoodEmpty,
  IconMapPin,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import Flex from "components/common/Flex";
import DetailMesinManager from "./DetailMesinManager";
import api from "lib/api";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import { usePermission } from "hooks/usePermissions";

// Interface untuk data mesin dari API
interface MesinItemType {
  id: number | string;
  nama_mesin: string;
  kode_mesin: string;
  lokasi_ruang: string;
  status: 'Aktif' | 'Maintenance' | 'Rusak' | string;
  foto_katalog?: string | null;
}

const DATA_MESIN_PATH = "/data-mesin";

// Interface Props untuk komponen ini agar bisa menerima "mode"
interface DataMesinManagerProps {
  mode?: 'operasional' | 'pemeliharaan';
}

// Definisi Kolom Export Katalog Mesin
const EXPORT_COLUMNS_MESIN: ExportColumn[] = [
  { header: "Kode Mesin", key: "kode_mesin" },
  { header: "Nama Mesin", key: "nama_mesin" },
  { header: "Lokasi / Ruang", key: "lokasi_ruang" },
  { header: "Status", key: "status" },
];

const DataMesinManager = ({ mode = 'pemeliharaan' }: DataMesinManagerProps) => {
  const canManageMesin = usePermission("manage_pemeliharaan_mesin");
  const canManageDataMesin = usePermission("manage_data_mesin");
  const canManageOperasional = usePermission("manage_operasional_mesin");
  // State untuk menyimpan objek mesin yang sedang dipilih untuk dibuka detailnya
  const [selectedMesin, setSelectedMesin] = useState<MesinItemType | null>(null);
  const [mesinList, setMesinList] = useState<MesinItemType[]>([]);
  const [loading, setLoading] = useState(true);

  // Mesin nonaktif disembunyikan dari katalog pencatatan, kecuali user memilih menampilkannya
  const [tampilkanNonaktif, setTampilkanNonaktif] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data mesin dari API Laravel
  const loadMesin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api<{ data: MesinItemType[] } | MesinItemType[]>("mesin-produksi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res) ? res : ('data' in res ? res.data : []);
      setMesinList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data mesin produksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMesin();
  }, [loadMesin]);

  // Logika pencarian
  const filteredMesin = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const terlihat = tampilkanNonaktif ? mesinList : mesinList.filter((item) => item.status !== "Tidak Aktif");
    if (!keyword) return terlihat;

    return terlihat.filter((item) => {
      return (
        (item.nama_mesin || "").toLowerCase().includes(keyword) ||
        (item.kode_mesin || "").toLowerCase().includes(keyword) ||
        (item.lokasi_ruang || "").toLowerCase().includes(keyword) ||
        (item.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [mesinList, searchTerm, tampilkanNonaktif]);
  const adaNonaktif = mesinList.some((item) => item.status === "Tidak Aktif");

  // Handler Export Katalog
  const handleExportPDF = () =>
    exportToPDF(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-produksi", "Data Mesin Produksi");
  const handleExportExcel = () =>
    exportToExcel(filteredMesin as unknown as Record<string, unknown>[], EXPORT_COLUMNS_MESIN, "data-mesin-produksi");

  // Jika ada mesin yang dipilih, langsung render komponen DetailMesinManager dan alirkan props 'mode'
  if (selectedMesin) {
    return (
      <DetailMesinManager 
        mesin={{
          id: selectedMesin.id,
          nama_mesin: selectedMesin.nama_mesin,
          kode_mesin: selectedMesin.kode_mesin,
          lokasi_ruang: selectedMesin.lokasi_ruang,
          status: selectedMesin.status,
          foto_katalog: selectedMesin.foto_katalog
        }} 
        canManage={mode === 'operasional' ? canManageOperasional : canManageMesin}
        mode={mode} // <--- MENGIRIMKAN PROPS MODE KE DETAIL MESIN
        onBack={() => setSelectedMesin(null)} 
      />
    );
  }

  return (
    <div className="datamesin-page">
      {error && <Alert variant="danger" className="py-2 small" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-3 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">
                {mode === 'operasional' ? 'Katalog Operasional Mesin' : 'Katalog Mesin Produksi'}
              </h1>
              <p className="text-secondary mb-0">
                {mode === 'operasional' 
                  ? 'Pilih mesin untuk mencatat log aktivitas harian.' 
                  : 'Daftar mesin produksi beserta dokumen IK dan riwayat pemeliharaan.'}
              </p>
              {/* Data mesin dikelola satu pintu dari halaman Data Mesin */}
              <p className="text-secondary small mb-0 mt-1">
                Daftar mesin dikelola melalui menu <strong>Data Mesin</strong>.
              </p>
            </div>
            <div>
              {canManageDataMesin && (
                <Link href={DATA_MESIN_PATH} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 py-2 px-3">
                  <IconDatabase size={16} /> Kelola Data Mesin
                </Link>
              )}
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-4 shadow-sm border-0">
        <div className="datatools-toolbar border-bottom p-2 p-md-3">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={5} lg={4}>
              <InputGroup className="datatools-search input-group-sm">
                <InputGroup.Text className="bg-light"><IconSearch size={16} /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari nama mesin, kode, atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="light" className="datatools-search-clear text-secondary border" onClick={() => setSearchTerm("")}>
                    <IconX size={14} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={12} md={7} lg={8} className="d-flex justify-content-md-end gap-2 flex-wrap align-items-center mt-2 mt-md-0">
              {adaNonaktif && (
                <Form.Check
                  type="switch"
                  id="tampilkan-mesin-nonaktif"
                  label="Tampilkan mesin nonaktif"
                  className="small text-secondary me-2 mb-0"
                  checked={tampilkanNonaktif}
                  onChange={(e) => setTampilkanNonaktif(e.target.checked)}
                />
              )}
              <div className="d-flex align-items-center">
                <span className="me-2 small text-secondary d-none d-lg-inline" style={{ fontSize: "0.7rem" }}>Katalog:</span>
                <Button variant="outline-danger" size="sm" className="py-1 px-2 mx-1" style={{ fontSize: "0.75rem" }} onClick={handleExportPDF}>PDF</Button>
                <Button variant="outline-success" size="sm" className="py-1 px-2" style={{ fontSize: "0.75rem" }} onClick={handleExportExcel}>Excel</Button>
              </div>
            </Col>
          </Row>
        </div>

        <CardBody className="p-3 p-md-4 bg-light">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat katalog mesin...
            </div>
          ) : mesinList.length === 0 ? (
            <div className="datatools-empty text-center py-5 bg-white rounded border">
              <div className="datatools-empty-icon mb-2 text-muted"><IconBox size={40} /></div>
              <h6 className="mb-1">Belum ada data mesin produksi</h6>
              <p className="text-secondary small mb-3">
                {canManageDataMesin
                  ? 'Tambahkan mesin terlebih dahulu melalui menu Data Mesin.'
                  : 'Belum ada mesin. Hubungi pengelola Data Mesin untuk menambahkan mesin.'}
              </p>
              {canManageDataMesin && (
                <Link href={DATA_MESIN_PATH} className="btn btn-primary btn-sm">
                  Buka Data Mesin
                </Link>
              )}
            </div>
          ) : filteredMesin.length === 0 ? (
            <div className="datatools-empty text-center py-5 bg-white rounded border">
              <div className="datatools-empty-icon mb-2 text-muted"><IconMoodEmpty size={40} /></div>
              <h6 className="mb-1">Tidak ada hasil</h6>
              <p className="text-secondary small mb-3">Tidak ditemukan data mesin yang cocok dengan pencarian Anda.</p>
              <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm("")}>
                Reset Pencarian
              </Button>
            </div>
          ) : (
            <Row className="g-3">
              {filteredMesin.map((mesin) => (
                <Col xs={6} sm={4} md={3} lg={2} xl={2} key={mesin.id}>
                  <Card 
                    className="h-100 shadow-sm border border-light overflow-hidden" 
                    style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onClick={() => setSelectedMesin({
                      id: mesin.id,
                      nama_mesin: mesin.nama_mesin,
                      kode_mesin: mesin.kode_mesin,
                      lokasi_ruang: mesin.lokasi_ruang,
                      status: mesin.status,
                      foto_katalog: mesin.foto_katalog
                    })}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#0d6efd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
                      e.currentTarget.style.borderColor = '#f8f9fa';
                    }}
                  >
                    <div style={{ paddingTop: '100%', position: 'relative', backgroundColor: '#f8f9fa', borderBottom: '1px solid #f1f5f9' }}>
                      {mesin.foto_katalog ? (
                        <Image 
                          src={mesin.foto_katalog} 
                          alt={mesin.nama_mesin}
                          fill
                          sizes="(max-width: 768px) 50vw, 20vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-secondary opacity-50">
                          <IconBox size={48} stroke={1.5} />
                        </div>
                      )}
                      
                      <div className="position-absolute top-0 end-0 mt-2 z-3">
                        <span 
                          className={`badge rounded-start-2 rounded-end-0 shadow-sm ${
                            mesin.status === 'Aktif' ? 'bg-success' : 
                            mesin.status === 'Maintenance' ? 'bg-warning text-dark' :
                            mesin.status === 'Tidak Aktif' ? 'bg-secondary' : 'bg-danger'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {mesin.status}
                        </span>
                      </div>
                    </div>

                    <CardBody className="p-2 d-flex flex-column">
                      <div className="flex-grow-1">
                        <h6 
                          className="mb-1 text-dark" 
                          style={{ 
                            fontSize: '0.8rem', 
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          title={mesin.nama_mesin}
                        >
                          {mesin.nama_mesin}
                        </h6>
                        <small className="text-muted d-block mb-2" style={{ fontSize: '0.65rem' }}>{mesin.kode_mesin}</small>
                      </div>
                      
                      <div className="mt-auto pt-2 border-top d-flex align-items-center text-secondary" style={{ fontSize: '0.65rem' }}>
                        <IconMapPin size={12} className="me-1 flex-shrink-0" />
                        <span className="text-truncate" title={mesin.lokasi_ruang}>{mesin.lokasi_ruang}</span>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </CardBody>
      </Card>

    </div>
  );
};

DataMesinManager.displayName = "DataMesinManager";

export default DataMesinManager;
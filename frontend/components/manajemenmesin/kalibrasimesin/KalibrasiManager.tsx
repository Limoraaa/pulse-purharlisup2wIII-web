"use client";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Row, Col, Card, CardBody, Button, InputGroup, Form, Badge, Spinner, Alert } from "react-bootstrap";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconCertificate,
  IconDownload,
  IconEdit,
  IconAlertCircle,
  IconAdjustmentsAlt
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import TanstackTable from "components/table/TanstackTable";
import api from "lib/api";
import { usePermission } from "hooks/usePermissions";
import KalibrasiFormModal from "./KalibrasiFormModal"; // Import Modal

// --- Tipe Data Kalibrasi ---
export interface KalibrasiItem {
  id: number;
  mesin_id: number;
  kode_mesin: string;
  nama_mesin: string;
  tanggal_kalibrasi: string;
  tanggal_jatuh_tempo: string;
  nomor_sertifikat: string;
  kalibrator: string;
  hasil_status: "Lulus" | "Perlu Penyesuaian" | "Tidak Layak";
  file_sertifikat?: string;
  keterangan?: string;
}

// Fetcher untuk SWR menyesuaikan dengan custom fetch wrapper
const fetcher = async (url: string) => {
  const response = await api<any>(url, { method: "GET" });
  return response.data; 
};

const KalibrasiManager = () => {
  const canManage = usePermission("manage_pemeliharaan_mesin");
  
  // State untuk pencarian dan kontrol modal
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState<KalibrasiItem | null>(null);

  // Mengambil data kalibrasi dari backend
  const { data: kalibrasiData, error, isLoading, mutate } = useSWR<KalibrasiItem[]>(
    "/pemeliharaan/kalibrasi",
    fetcher,
    { fallbackData: [] } // Fallback array kosong agar tidak undefined
  );

  // Filter pencarian berdasarkan kode mesin, nama mesin, atau nomor sertifikat
  const filteredData = useMemo(() => {
    if (!kalibrasiData) return [];
    const keyword = searchTerm.toLowerCase();
    return kalibrasiData.filter(
      (item) =>
        item.kode_mesin.toLowerCase().includes(keyword) ||
        item.nama_mesin.toLowerCase().includes(keyword) ||
        item.nomor_sertifikat.toLowerCase().includes(keyword)
    );
  }, [kalibrasiData, searchTerm]);

  // Fungsi helper format tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Definisi Kolom Tabel
  const columns = useMemo<ColumnDef<KalibrasiItem>[]>(
    () => [
      {
        id: "mesin",
        header: "Mesin Produksi",
        accessorKey: "kode_mesin",
        cell: ({ row }) => (
          <div>
            <div className="fw-semibold text-dark">{row.original.kode_mesin}</div>
            <div className="text-secondary small">{row.original.nama_mesin}</div>
          </div>
        ),
      },
      {
        id: "sertifikat",
        header: "No. Sertifikat",
        accessorKey: "nomor_sertifikat",
        cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <IconCertificate size={16} className="text-secondary" />
            <span className="fw-medium">{row.original.nomor_sertifikat}</span>
          </div>
        ),
      },
      {
        id: "tanggal_kalibrasi",
        header: "Tgl. Kalibrasi",
        accessorKey: "tanggal_kalibrasi",
        cell: ({ row }) => formatDate(row.original.tanggal_kalibrasi),
      },
      {
        id: "tanggal_jatuh_tempo",
        header: "Jatuh Tempo",
        accessorKey: "tanggal_jatuh_tempo",
        cell: ({ row }) => {
          const isOverdue = new Date(row.original.tanggal_jatuh_tempo) < new Date();
          return (
            <span className={isOverdue ? "text-danger fw-semibold" : ""}>
              {formatDate(row.original.tanggal_jatuh_tempo)}
            </span>
          );
        },
      },
      {
        id: "kalibrator",
        header: "Kalibrator",
        accessorKey: "kalibrator",
      },
      {
        id: "hasil_status",
        header: "Status Kelayakan",
        accessorKey: "hasil_status",
        cell: ({ row }) => {
          const status = row.original.hasil_status;
          let bg = "secondary";
          if (status === "Lulus") bg = "success";
          if (status === "Perlu Penyesuaian") bg = "warning";
          if (status === "Tidak Layak") bg = "danger";

          return (
            <Badge bg={bg} text={status === "Perlu Penyesuaian" ? "dark" : "white"} pill>
              {status}
            </Badge>
          );
        },
      },
      {
        id: "aksi",
        header: "Aksi",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            {row.original.file_sertifikat && (
              <Button
                variant="outline-secondary"
                size="sm"
                title="Download Sertifikat"
                onClick={() => window.open(row.original.file_sertifikat, "_blank")}
              >
                <IconDownload size={16} />
              </Button>
            )}
            {canManage && (
              <Button
                variant="outline-primary"
                size="sm"
                title="Edit Kalibrasi"
                onClick={() => {
                  setSelectedData(row.original);
                  setShowModal(true);
                }}
              >
                <IconEdit size={16} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canManage]
  );

  return (
    <div className="datatools-page">
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Sertifikasi & Kalibrasi</h1>
              <p className="text-secondary mb-0">
                Mengelola riwayat kalibrasi, sertifikat kelayakan, dan batas waktu kalibrasi mesin.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              {canManage && (
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center gap-2"
                  onClick={() => {
                    setSelectedData(null);
                    setShowModal(true);
                  }}
                >
                  <IconPlus size={18} /> Tambah Kalibrasi
                </Button>
              )}
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg shadow-sm border-0">
        <div className="datatools-toolbar border-bottom p-3">
          <Row className="g-2 align-items-center justify-content-between">
            <Col lg={4} md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <IconSearch size={18} className="text-secondary" />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode mesin atau no. sertifikat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg="auto">
              <span className="text-secondary small">
                Menampilkan <span className="fw-semibold text-dark">{filteredData.length}</span> catatan kalibrasi
              </span>
            </Col>
          </Row>
        </div>

        <CardBody className="p-0">
          {error ? (
            <div className="p-4">
              <Alert variant="danger" className="d-flex align-items-center gap-2 mb-0">
                <IconAlertCircle size={20} />
                <span>Gagal memuat data kalibrasi. Pastikan koneksi ke server berjalan dengan baik.</span>
              </Alert>
            </div>
          ) : isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data kalibrasi...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-6">
              <IconAdjustmentsAlt size={48} className="text-secondary opacity-25 mb-3" />
              <h5 className="mb-1">Belum ada data kalibrasi</h5>
              <p className="text-secondary">Data kalibrasi mesin yang ditambahkan akan muncul di sini.</p>
            </div>
          ) : (
            <TanstackTable
              data={filteredData}
              columns={columns}
              pagination
              isSortable
            />
          )}
        </CardBody>
      </Card>

      {/* MODAL FORM KALIBRASI */}
      <KalibrasiFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editData={selectedData}
        onSuccess={() => {
          mutate(); // Refresh tabel setelah berhasil simpan/edit
        }}
      />
    </div>
  );
};

export default KalibrasiManager;
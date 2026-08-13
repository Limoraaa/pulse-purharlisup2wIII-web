"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
  InputGroup,
  Form,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconUsers,
  IconMoodEmpty,
} from "@tabler/icons-react";

import { PeminjamType } from "types/DataToolsTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getPeminjamColumns } from "components/ruangtools/datapeminjam/ColumnDefination";
import PeminjamFormModal, { PeminjamFormValues } from "components/ruangtools/datapeminjam/PeminjamFormModal";
import DeleteConfirmModal from "components/ruangtools/datapeminjam/DeleteConfirmModal";
// reuse fungsi export yang sudah ada dari fitur Riwayat / Laporan Kerusakan
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";

import {
  getPeminta,
  createPeminta,
  updatePeminta,
  nonaktifkanPeminta,
  aktifkanPeminta,
  updateRolePeminta,
} from "services/pemintaService";

function sortByNama(items: PeminjamType[]): PeminjamType[] {
  return [...items].sort((a, b) => {
    // Yang aktif selalu di atas, nonaktif selalu di bawah
    if (a.aktif !== b.aktif) {
      return a.aktif ? -1 : 1;
    }
    // Di dalam grup yang sama (sesama aktif atau sesama nonaktif), urutkan abjad
    return a.nama.localeCompare(b.nama);
  });
}

// Kolom yang dipakai untuk file Export PDF/Excel
const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Nama", key: "nama" },
  { header: "Divisi", key: "divisi" },
  { header: "RFID UID", key: "rfid_uid" },
  { header: "Status", key: "statusLabel" },
];

const PeminjamManager = () => {
  const [peminjamList, setPeminjamList] = useState<PeminjamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PeminjamType | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Toolbar: pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");

  // Data turunan untuk tampilan; sumber data (peminjamList) tidak diubah.
  // Data turunan untuk tampilan; sumber data (peminjamList) tidak diubah.
  // Data turunan untuk tampilan; sumber data (peminjamList) tidak diubah.
  // Data turunan untuk tampilan; sumber data (peminjamList) tidak diubah.
  const filteredPeminjam = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    // Jika kolom pencarian kosong, langsung kembalikan semua data
    if (!keyword) return peminjamList;

    return peminjamList.filter((item) => {
      // 1. Amankan data dari nilai null/undefined (Null-Safety)
      const nama = (item.nama || "").toLowerCase();
      const divisi = (item.divisi || "").toLowerCase();
      const rfid = (item.id || "").toLowerCase();
      
      // 2. TERJEMAHKAN ROLE: Jika dari DB adalah "user", anggap sebagai "pekerja"
      const rawRole = (item.role || "").toLowerCase();
      const role = rawRole === "user" ? "pekerja" : rawRole;
      
      // 3. Terjemahkan boolean aktif menjadi teks agar bisa dicari
      const status = item.aktif ? "aktif" : "nonaktif";

      // 4. Cocokkan keyword dengan semua properti
      return (
        nama.includes(keyword) ||
        divisi.includes(keyword) ||
        role.includes(keyword) ||
        rfid.includes(keyword) ||
        status.includes(keyword)
      );
    });
  }, [peminjamList, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeminta();
      setPeminjamList(sortByNama(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data peminjam";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: PeminjamType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeleteModal = (item: PeminjamType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values: PeminjamFormValues) => {
    setFormError(null);
    try {
      if (activeItem) {
        const updated = await updatePeminta(activeItem.id, values);
        setPeminjamList((prev) =>
          sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
        );
      } else {
        const created = await createPeminta(values);
        setPeminjamList((prev) => sortByNama([created, ...prev]));
      }
      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      setFormError(message);
    }
  };

  // ---- Nonaktifkan (bukan hapus permanen -- backend sudah soft-delete) ----
  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    setDeleting(true);
    try {
      const updated = await nonaktifkanPeminta(activeItem.id);
      setPeminjamList((prev) =>
        sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
      );
      setDeleteModalOpen(false);
      setActiveItem(null);
      setSuccessMessage(`${updated.nama} berhasil dinonaktifkan.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menonaktifkan data";
      alert(message);
    } finally {
      setDeleting(false);
    }
  };

  // ---- Aktifkan kembali ----
  const handleAktifkan = async (item: PeminjamType) => {
    setTogglingId(item.id);
    try {
      const updated = await aktifkanPeminta(item.id);
      setPeminjamList((prev) =>
        sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
      );
      setSuccessMessage(`${updated.nama} berhasil diaktifkan kembali.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengaktifkan data";
      alert(message);
    } finally {
      setTogglingId(null);
    }
  };

  // ---- Export PDF / Excel ----
  // Sengaja pakai `peminjamList` (bukan `filteredPeminjam`) supaya file
  // export SELALU berisi seluruh data, tidak terpengaruh pencarian yang
  // sedang aktif di layar.
  const buildExportData = () =>
    peminjamList.map((item) => ({
      ...item,
      statusLabel: item.aktif ? "Aktif" : "Nonaktif",
    }));

  const handleExportPDF = () =>
    exportToPDF(
      buildExportData() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS,
      "data-peminjam",
      "Data Peminjam"
    );

  const handleExportExcel = () =>
    exportToExcel(
      buildExportData() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS,
      "data-peminjam"
    );
  // ---- Ganti Role (Inventory Man / Pekerja) ----
  const handleGantiRole = async (item: PeminjamType, roleBaru: "user" | "inventory man") => { 
    try {
      const updated = await updateRolePeminta(item.id, roleBaru);
      setPeminjamList((prev) =>
        sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
      );
      setSuccessMessage(`Role ${updated.nama} berhasil diubah menjadi ${roleBaru === "inventory man" ? "Inventory Man" : "Pekerja"}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengubah role";
      alert(message);
    }
  };

  const columns = useMemo(
    () =>
      getPeminjamColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onAktifkan: handleAktifkan,
        onGantiRole: handleGantiRole,
        togglingId,
      }),
    [togglingId]
  );

  return (
    <div className="datapeminjam-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Data Peminjam</h1>
              <p className="text-secondary mb-0">
                Mengelola daftar pegawai yang dapat meminjam alat atau mengambil bahan.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} />
                Tambah Data
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Toolbar: Search + Info + Export ---- */}
        <div className="datapeminjam-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={5} md={6}>
              <InputGroup className="datapeminjam-search">
                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari nama, divisi, atau tap kartu RFID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari data peminjam"
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="datapeminjam-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Bersihkan pencarian"
                  >
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={4} md={3} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan{" "}
                <span className="fw-semibold text-body">{filteredPeminjam.length}</span>{" "}
                dari {peminjamList.length} data
              </span>
            </Col>
            <Col lg={3} md={3} className="d-flex justify-content-md-end gap-2">
              <Button variant="outline-danger" size="sm" onClick={handleExportPDF}>
                Export PDF
              </Button>
              <Button variant="outline-success" size="sm" onClick={handleExportExcel}>
                Export Excel
              </Button>
            </Col>
          </Row>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : peminjamList.length === 0 ? (
            /* Empty state: belum ada data sama sekali */
            <div className="datapeminjam-empty text-center py-6">
              <div className="datapeminjam-empty-icon mb-3">
                <IconUsers size={32} />
              </div>
              <h5 className="mb-1">Belum ada data peminjam</h5>
              <p className="text-secondary mb-4">
                Mulai dengan menambahkan pegawai yang dapat meminjam alat atau mengambil bahan.
              </p>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <IconPlus size={18} />
                Tambah Data
              </Button>
            </div>
          ) : filteredPeminjam.length === 0 ? (
            /* Empty state: hasil pencarian / filter kosong */
            <div className="datapeminjam-empty text-center py-6">
              <div className="datapeminjam-empty-icon mb-3">
                <IconMoodEmpty size={32} />
              </div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">
                Tidak ditemukan data yang cocok dengan pencarian.
              </p>
              <Button
                variant="outline-secondary"
                className="d-inline-flex align-items-center gap-2"
                onClick={() => setSearchTerm("")}
              >
                <IconX size={18} />
                Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable
              data={filteredPeminjam}
              columns={columns}
              pagination
              isSortable
            />
          )}
        </CardBody>
      </Card>

      <PeminjamFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        error={formError}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        peminjam={activeItem}
        submitting={deleting}
      />
    </div>
  );
};

export default PeminjamManager;

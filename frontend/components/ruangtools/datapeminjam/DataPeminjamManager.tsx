"use client";
// import node module libraries
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Alert, Spinner } from "react-bootstrap";
import { IconPlus, IconRefresh } from "@tabler/icons-react";

// import custom types
import { PeminjamType } from "types/DataToolsTypes";

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getDataPeminjamColumns } from "components/ruangtools/datapeminjam/ColumnDefination";
import PeminjamFormModal, {
  PeminjamFormValues,
} from "components/ruangtools/datapeminjam/PeminjamFormModal";
import DeleteConfirmModal from "components/ruangtools/datapeminjam/DeleteConfirmModal";

// import service untuk ambil data dari database
// NOTE: sesuaikan path import ini kalau lokasi file service kamu bukan di "services/pemintaService"
import { getPeminta } from "services/pemintaService";

const DataPeminjamManager = () => {
  const [peminjamList, setPeminjamList] = useState<PeminjamType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- ambil data dari database saat halaman dibuka ----
  const fetchPeminjam = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getPeminta();
      setPeminjamList(data);
    } catch (err) {
      setErrorMsg(
        "Gagal memuat data peminjam. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeminjam();
  }, []);

  // State modal: Tambah/Edit, Hapus
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activePeminjam, setActivePeminjam] = useState<PeminjamType | null>(
    null
  );

  // ---- handler: Tambah Data ----
  const openAddModal = () => {
    setActivePeminjam(null);
    setFormModalOpen(true);
  };

  // ---- handler: Edit Data ----
  const openEditModal = (peminjam: PeminjamType) => {
    setActivePeminjam(peminjam);
    setFormModalOpen(true);
  };

  // ---- handler: submit form (dipakai untuk Tambah maupun Edit) ----
  // Catatan: pemintaService.ts yang kamu kasih baru punya getPeminta() (GET).
  // Untuk sekarang Tambah/Edit masih mengubah state lokal saja supaya
  // tampilannya tetap interaktif. Begitu ada endpoint POST/PUT (misal
  // createPeminta / updatePeminta di pemintaService.ts), panggil itu di
  // sini lalu fetchPeminjam() ulang supaya datanya sinkron dari database.
  const handleFormSubmit = (values: PeminjamFormValues) => {
    if (activePeminjam) {
      setPeminjamList((prev) =>
        prev.map((p) =>
          p.id === activePeminjam.id ? { ...p, ...values } : p
        )
      );
    } else {
      setPeminjamList((prev) => [
        { id: crypto.randomUUID(), ...values },
        ...prev,
      ]);
    }
    setFormModalOpen(false);
    setActivePeminjam(null);
  };

  // ---- handler: Hapus Data ----
  const openDeleteModal = (peminjam: PeminjamType) => {
    setActivePeminjam(peminjam);
    setDeleteModalOpen(true);
  };

  // Catatan: sama seperti di atas, begitu ada endpoint DELETE
  // (misal deletePeminta di pemintaService.ts), panggil itu di sini.
  const handleConfirmDelete = () => {
    if (activePeminjam) {
      setPeminjamList((prev) => prev.filter((p) => p.id !== activePeminjam.id));
    }
    setDeleteModalOpen(false);
    setActivePeminjam(null);
  };

  const columns = useMemo(
    () =>
      getDataPeminjamColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
  );

  return (
    <>
      {/* ---- Header: judul, deskripsi, breadcrumb, tombol Tambah Data ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Data Peminjam</h1>
              <p className="text-secondary mb-0">
                Master data pegawai yang dapat melakukan peminjaman alat.
              </p>
              <DasherBreadcrumb />
            </div>
            <div className="d-flex gap-2">
            
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <IconPlus size={18} />
                Tambah Data
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      {/* ---- Error state ---- */}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* ---- Tabel + Pencarian bawaan TanstackTable ---- */}
      <Card className="card-lg mb-6">
        <CardBody>
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-secondary">Memuat data peminjam...</span>
            </div>
          ) : (
            <TanstackTable
              data={peminjamList}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari nama pegawai / divisi..."
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Modals ---- */}
      <PeminjamFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActivePeminjam(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activePeminjam}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        peminjam={activePeminjam}
      />
    </>
  );
};

export default DataPeminjamManager;

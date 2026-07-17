"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Alert, Spinner } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";

import { PeminjamType } from "types/DataToolsTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getPeminjamColumns } from "components/ruangtools/datapeminjam/ColumnDefination";
import PeminjamFormModal, { PeminjamFormValues } from "components/ruangtools/datapeminjam/PeminjamFormModal";
import DeleteConfirmModal from "components/ruangtools/datapeminjam/DeleteConfirmModal";

import {
  getPeminta,
  createPeminta,
  updatePeminta,
  nonaktifkanPeminta,
  aktifkanPeminta,
} from "services/pemintaService";

function sortByNama(items: PeminjamType[]): PeminjamType[] {
  return [...items].sort((a, b) => a.nama.localeCompare(b.nama));
}

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

  const columns = useMemo(
    () =>
      getPeminjamColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onAktifkan: handleAktifkan,
        togglingId,
      }),
    [togglingId]
  );

  return (
    <>
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
        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : (
            <TanstackTable
              data={peminjamList}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari nama / divisi..."
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
        item={activeItem}
        submitting={deleting}
      />
    </>
  );
};

export default PeminjamManager;
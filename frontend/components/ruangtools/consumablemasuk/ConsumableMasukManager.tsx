"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Alert, Spinner } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";


import {
  ConsumableItemType,
  ConsumableMasukType,
  ConsumableMasukFormValues,
} from "types/DataConsumableTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getConsumableMasukColumns } from "components/ruangtools/consumablemasuk/ColumnDefination";
import ConsumableMasukFormModal from "components/ruangtools/consumablemasuk/ConsumableMasukFormModal";
import DeleteConfirmModal from "components/ruangtools/consumablemasuk/DeleteConfirmModal";

import { getConsumables } from "services/consumableService";
import {
  getConsumableMasuk,
  createConsumableMasuk,
  updateConsumableMasuk,
  deleteConsumableMasuk,
} from "services/consumableMasukService";

const ConsumableMasukManager = () => {
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);
  const [loadingConsumables, setLoadingConsumables] = useState(true);

  const [masukList, setMasukList] = useState<ConsumableMasukType[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ConsumableMasukType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadConsumables = async () => {
    setLoadingConsumables(true);
    try {
      const data = await getConsumables();
      setConsumables(data);
    } catch {
      setErrorMsg("Gagal memuat data consumable untuk pilihan Kode Barang.");
    }finally {
      setLoadingConsumables(false);
    }
  };

  const loadMasukList = async () => {
    setLoadingList(true);
    try {
      const data = await getConsumableMasuk();
      setMasukList(data);
    } catch {
      setErrorMsg("Gagal memuat riwayat barang masuk.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConsumables();
    loadMasukList();
  }, []);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: ConsumableMasukType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeleteModal = (item: ConsumableMasukType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values: ConsumableMasukFormValues) => {
    setFormError(null);
    try {
      if (activeItem) {
          const updated = await updateConsumableMasuk(activeItem.id, {
            tanggal: values.tanggal,
            jumlah_masuk: values.jumlah_masuk,
            keterangan: values.keterangan,
          });
          setMasukList((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
           await loadConsumables();
      } else {
        const dicatatOleh = localStorage.getItem("userId");
        if (!dicatatOleh) {
          throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
        }

        const created = await createConsumableMasuk(values, dicatatOleh);
        setMasukList((prev) => [created, ...prev]);

        // refresh Data Consumable supaya stok_awal yang tampil di halaman lain akurat
        await loadConsumables();

        setSuccessMessage(
          `Berhasil menambah ${values.jumlah_masuk} unit "${values.nama}" ke Data Consumable.`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      setFormError(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteConsumableMasuk(activeItem.id);
      setMasukList((prev) => prev.filter((m) => m.id !== activeItem.id));
      // stok Data Consumable otomatis disesuaikan balik oleh backend,
      // refresh supaya halaman lain (Data Consumable) tetap akurat
      await loadConsumables();
    } catch {
      setErrorMsg("Gagal menghapus data consumable masuk.");
    } finally {
      setDeleteModalOpen(false);
      setActiveItem(null);
    }
  };

  const columns = useMemo(
    () =>
      getConsumableMasukColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
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
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Consumable Masuk</h1>
              <p className="text-secondary mb-0">
                Mencatat barang Consumable yang masuk.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingConsumables}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <CardBody>
          {loadingList ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : masukList.length === 0 ? (
            <p className="text-secondary text-center py-6 mb-0">
              Belum ada catatan barang masuk. Klik &quot;Tambah&quot; untuk mulai mencatat.
            </p>
          ) : (
            <TanstackTable
              data={masukList}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari kode / nama barang..."
            />
          )}
        </CardBody>
      </Card>

      <ConsumableMasukFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        consumableOptions={consumables}
        error={formError}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={activeItem}
      />

      {loadingConsumables && (
        <div
          className="position-fixed bottom-0 end-0 m-4 bg-white shadow rounded-3 px-3 py-2 d-flex align-items-center gap-2"
          style={{ zIndex: 1050 }}
        >
          <Spinner animation="border" size="sm" />
          <span className="small text-secondary">Memuat data consumable...</span>
        </div>
      )}
    </>
  );
};

export default ConsumableMasukManager;
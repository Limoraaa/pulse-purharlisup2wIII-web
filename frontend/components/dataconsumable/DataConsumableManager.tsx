"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Spinner, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";

import {
  ConsumableItemType,
  ConsumableFormValues,
  ConsumableCartItemType,
  ConsumableOutFormValues,
} from "types/DataConsumableTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getConsumableColumns } from "components/dataconsumable/ColumnDefination";
import ConsumableToolFormModal from "components/dataconsumable/ConsumableFormModal";
import ConsumableDetailModal from "components/dataconsumable/ConsumableDetailModal";
import DeleteConfirmModal from "components/dataconsumable/DeleteConfirmModal";
import CartFAB from "components/dataconsumable/CartFAB";
import CartOffcanvas from "components/dataconsumable/CartOffcanvas";
import ConsumableOutFormModal from "components/dataconsumable/ConsumableOutFormModal";

import {
  getConsumables,
  createConsumable,
  updateConsumable,
  deleteConsumable,
} from "services/consumableService";

// urutan natural, dipakai lagi di sini supaya urutan tetap benar tiap ada perubahan state lokal
function sortByKode(items: ConsumableItemType[]): ConsumableItemType[] {
  return [...items].sort((a, b) =>
    a.kode_barang.localeCompare(b.kode_barang, undefined, { numeric: true })
  );
}

const DataConsumableManager = () => {
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ConsumableItemType | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadConsumables = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConsumables(); // sudah terurut dari service
      setConsumables(data);
    } catch (err) {
      setError("Gagal memuat data consumable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsumables();
  }, []);

  const [cart, setCart] = useState<ConsumableCartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };
  const openEditModal = (item: ConsumableItemType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  };
  const openDetailModal = (item: ConsumableItemType) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };
  const openDeleteModal = (item: ConsumableItemType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values: ConsumableFormValues) => {
    setFormError(null);
    try {
      if (activeItem) {
        const updated = await updateConsumable(activeItem.id, values);
        setConsumables((prev) =>
          sortByKode(prev.map((c) => (c.id === updated.id ? updated : c)))
        );
      } else {
        const created = await createConsumable(values);
        setConsumables((prev) => sortByKode([created, ...prev]));
      }
      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      setFormError(message); // ditampilkan di dalam modal, bukan alert()
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteConsumable(activeItem.id);
      setConsumables((prev) => prev.filter((c) => c.id !== activeItem.id));
      setDeleteModalOpen(false);
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  const handleAddToCart = (item: ConsumableItemType) => {
    if (item.stok_awal <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.consumable_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.consumable_id === item.id
            ? { ...c, jumlah: Math.min(c.jumlah + 1, item.stok_awal) }
            : c
        );
      }
      return [
        ...prev,
        {
          consumable_id: item.id,
          kode_barang: item.kode_barang,
          nama: item.nama,
          jumlah: 1,
          stok_tersedia: item.stok_awal,
        },
      ];
    });
    setCartOpen(true);
  };

  const handleLoanSubmit = (values: ConsumableOutFormValues) => {
    // TODO: sambungkan ke ConsumableKeluarController (belum diimplementasi)
    console.log("Submit Pengambilan:", values, cart);
    setCart([]);
    setLoanFormOpen(false);
    setSuccessMessage("Pengambilan bahan berhasil dicatat!");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const columns = useMemo(
  () =>
    getConsumableColumns({
      onDetail: openDetailModal,
      onEdit: openEditModal,
      onDelete: openDeleteModal,
      onStockOut: handleAddToCart,
    }),
  []
);
  return (
    <>
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} /> {successMessage}
        </Alert>
      )}

      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <div>
          <h1 className="h2">Data Consumable</h1>
          <DasherBreadcrumb />
        </div>
        <Button variant="primary" onClick={openAddModal}>
          <IconPlus size={18} /> Tambah Bahan
        </Button>
      </Flex>

      <Card>
        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" /> Memuat...
            </div>
          ) : (
            <TanstackTable data={consumables} columns={columns} filter pagination isSortable />
          )}
        </CardBody>
      </Card>

     <ConsumableToolFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        error={formError}
        existingCodes={consumables.map((c) => c.kode_barang)} // ← tambahan
      />
      <ConsumableDetailModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} consumable={activeItem} />
      <DeleteConfirmModal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} consumable={activeItem} />

      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />
      <CartOffcanvas
        show={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onProceed={() => setLoanFormOpen(true)}
        onUpdateQty={(id, qty) => setCart((prev) => prev.map((c) => (c.consumable_id === id ? { ...c, jumlah: qty } : c)))}
        onRemove={(id) => setCart((prev) => prev.filter((c) => c.consumable_id !== id))}
      />
      <ConsumableOutFormModal show={loanFormOpen} onClose={() => setLoanFormOpen(false)} onSubmit={handleLoanSubmit} cartItems={cart} />
    </>
  );
};

export default DataConsumableManager;
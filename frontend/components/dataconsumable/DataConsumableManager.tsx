"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Spinner, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";

// Import custom types yang sudah disesuaikan
import { ConsumableItemType, ConsumableFormValues, ConsumableCartItemType, ConsumableOutFormValues } from "types/DataConsumableTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
// Ubah semua import dari 'components/dataconsumable/...' menjadi:
import { getConsumableColumns } from "components/dataconsumable/ColumnDefination";
import ConsumableToolFormModal from "components/dataconsumable/ConsumableFormModal";
import ConsumableDetailModal from "components/dataconsumable/ConsumableDetailModal";
import DeleteConfirmModal from "components/dataconsumable/DeleteConfirmModal";
import CartFAB from "components/dataconsumable/CartFAB";
import CartOffcanvas from "components/dataconsumable/CartOffcanvas";
import ConsumableOutFormModal from "components/dataconsumable/ConsumableOutFormModal";

import { getConsumables, createConsumable, updateConsumable, deleteConsumable } from "services/consumableService";

const DataConsumableManager = () => {
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ConsumableItemType | null>(null);
  
  const loadConsumables = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConsumables();
      setConsumables(data);
    } catch (err) {
      setError("Gagal memuat data consumable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConsumables(); }, []);

  // State "Antrean Pengambilan"
  const [cart, setCart] = useState<ConsumableCartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openAddModal = () => { setActiveItem(null); setFormModalOpen(true); };
  const openEditModal = (item: ConsumableItemType) => { setActiveItem(item); setFormModalOpen(true); };
  const openDetailModal = (item: ConsumableItemType) => { setActiveItem(item); setDetailModalOpen(true); };
  const openDeleteModal = (item: ConsumableItemType) => { setActiveItem(item); setDeleteModalOpen(true); };

  const handleFormSubmit = async (values: ConsumableFormValues) => {
    try {
      if (activeItem) {
        await updateConsumable(activeItem.id, values);
      } else {
        await createConsumable(values);
      }
      loadConsumables();
      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) { alert("Gagal menyimpan data"); }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteConsumable(activeItem.id);
      loadConsumables();
      setDeleteModalOpen(false);
    } catch (err) { alert("Gagal menghapus data"); }
  };

  // ---- Handler: Tambah ke Antrean ----
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
      return [...prev, { consumable_id: item.id, kode_barang: item.kode_barang, nama: item.nama, jumlah: 1, stok_tersedia: item.stok_awal }];
    });
    setCartOpen(true);
  };

  const handleLoanSubmit = (values: ConsumableOutFormValues) => {
    // Implementasi API ke ConsumableKeluarController
    console.log("Submit Pengambilan:", values, cart);
    setCart([]);
    setLoanFormOpen(false);
    setSuccessMessage("Pengambilan bahan berhasil dicatat!");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const columns = useMemo(() => getConsumableColumns({
    onDetail: openDetailModal,
    onEdit: openEditModal,
    onDelete: openDeleteModal,
    onStockIn: (item) => alert("Buka Modal Tambah Stok"),
    onStockOut: handleAddToCart,
  }), []);

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
            <div className="text-center py-6"><Spinner animation="border" /> Memuat...</div>
          ) : (
            <TanstackTable data={consumables} columns={columns} filter pagination isSortable />
          )}
        </CardBody>
      </Card>

      <ConsumableToolFormModal show={formModalOpen} onClose={() => setFormModalOpen(false)} onSubmit={handleFormSubmit} initialData={activeItem} />
      <ConsumableDetailModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} consumable={activeItem} />
      <DeleteConfirmModal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} consumable={activeItem} />
      
      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />
      <CartOffcanvas show={cartOpen} onClose={() => setCartOpen(false)} items={cart} onProceed={() => setLoanFormOpen(true)} onUpdateQty={(id, qty) => setCart(prev => prev.map(c => c.consumable_id === id ? {...c, jumlah: qty} : c))} onRemove={(id) => setCart(prev => prev.filter(c => c.consumable_id !== id))} />
      <ConsumableOutFormModal show={loanFormOpen} onClose={() => setLoanFormOpen(false)} onSubmit={handleLoanSubmit} cartItems={cart} />
    </>
  );
};

export default DataConsumableManager;
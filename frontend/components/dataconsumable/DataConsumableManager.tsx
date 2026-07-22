"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconPackage,
  IconMoodEmpty,
} from "@tabler/icons-react";
import { submitConsumableKeluar } from "services/consumableKeluarService";

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
import AddToCartFlyEffect, {
  FlyAnimationItem,
} from "components/dataconsumable/AddToCartFlyEffect";
import { v4 as uuid } from "uuid";

import {
  getConsumables,
  createConsumable,
  updateConsumable,
  deleteConsumable,
} from "services/consumableService";

// urutan natural, dipakai lagi di sini supaya urutan tetap benar tiap ada perubahan state lokal
function sortByKode(items: ConsumableItemType[]): ConsumableItemType[] {
  return [...items].sort((a, b) =>
    b.kode_barang.localeCompare(a.kode_barang, undefined, { numeric: true })
  );
}

const DataConsumableManager = () => {
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingOut, setSubmittingOut] = useState(false);
  const [outError, setOutError] = useState<string | null>(null);

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
  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Toolbar: pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");

  // Data turunan untuk tampilan; sumber data (consumables) tidak diubah.
  const filteredConsumables = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return consumables.filter((item) => {
      const cocokKeyword =
        keyword === "" ||
        item.kode_barang.toLowerCase().includes(keyword) ||
        item.nama.toLowerCase().includes(keyword) ||
        item.merk.toLowerCase().includes(keyword) ||
        item.type.toLowerCase().includes(keyword);
      return cocokKeyword;
    });
  }, [consumables, searchTerm]);

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

  const handleAddToCart = (
    item: ConsumableItemType,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
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

    // Panel keranjang TIDAK otomatis terbuka -> cukup animasi ikon terbang ke FAB.
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyAnimations((prev) => [
      ...prev,
      {
        id: uuid(),
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
      },
    ]);
  };

  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleLoanSubmit = async (values: ConsumableOutFormValues) => {
    setSubmittingOut(true);
    setOutError(null);

    try {
      const dicatatOleh = localStorage.getItem("userId");
      if (!dicatatOleh) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      await submitConsumableKeluar(cart, values, dicatatOleh);

      // ambil ulang data consumable, supaya kolom Stok Tersedia akurat
      const freshData = await getConsumables();
      setConsumables(freshData);

      setCart([]);
      setLoanFormOpen(false);

      setSuccessMessage(`Pengambilan bahan oleh ${values.namaPeminta} berhasil dicatat!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mencatat pengambilan";
      setOutError(message);
    } finally {
      setSubmittingOut(false);
    }
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
    <div className="dataconsumable-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} /> {successMessage}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Data Consumable</h1>
              <p className="text-secondary mb-0">
                Mengelola seluruh data bahan habis pakai di Ruang Tools.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <IconPlus size={18} /> Tambah Bahan
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Toolbar: Search ---- */}
        <div className="dataconsumable-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={6} md={7}>
              <InputGroup className="dataconsumable-search">
                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode, nama, merk, atau tipe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari data consumable"
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="dataconsumable-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Bersihkan pencarian"
                  >
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={6} md={5} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan{" "}
                <span className="fw-semibold text-body">
                  {filteredConsumables.length}
                </span>{" "}
                dari {consumables.length} data
              </span>
            </Col>
          </Row>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat...
            </div>
          ) : consumables.length === 0 ? (
            /* Empty state: belum ada data sama sekali */
            <div className="dataconsumable-empty text-center py-6">
              <div className="dataconsumable-empty-icon mb-3">
                <IconPackage size={32} />
              </div>
              <h5 className="mb-1">Belum ada data consumable</h5>
              <p className="text-secondary mb-4">
                Mulai dengan menambahkan bahan pertama ke Ruang Tools.
              </p>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <IconPlus size={18} /> Tambah Bahan
              </Button>
            </div>
          ) : filteredConsumables.length === 0 ? (
            /* Empty state: hasil pencarian / filter kosong */
            <div className="dataconsumable-empty text-center py-6">
              <div className="dataconsumable-empty-icon mb-3">
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
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable
              data={filteredConsumables}
              columns={columns}
              pagination
              isSortable
            />
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

      <AddToCartFlyEffect
        animations={flyAnimations}
        onAnimationEnd={handleAnimationEnd}
      />

      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />
      <CartOffcanvas
        show={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onProceed={() => setLoanFormOpen(true)}
        onUpdateQty={(id, qty) => setCart((prev) => prev.map((c) => (c.consumable_id === id ? { ...c, jumlah: qty } : c)))}
        onRemove={(id) => setCart((prev) => prev.filter((c) => c.consumable_id !== id))}
      />
      <ConsumableOutFormModal
    show={loanFormOpen}
    onClose={() => setLoanFormOpen(false)}
    onSubmit={handleLoanSubmit}
    cartItems={cart}
    submitting={submittingOut}
    error={outError}
  />
    </div>
  );
};

export default DataConsumableManager;
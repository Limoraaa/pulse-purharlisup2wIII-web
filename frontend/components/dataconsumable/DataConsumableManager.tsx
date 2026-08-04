"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
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
  IconBox,
  IconMoodEmpty,
} from "@tabler/icons-react";
import { v4 as uuid } from "uuid";

import {
  ConsumableItemType,
  ConsumableFormValues,
  ConsumableCartItemType,
  ConsumableOutFormValues,
} from "types/DataConsumableTypes";

interface ConsumableCartItem extends ConsumableCartItemType {
  id: string;
}

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

import {
  getConsumables,
  createConsumable,
  updateConsumable,
  deleteConsumable,
} from "services/consumableService";

import api from "lib/api";

function sortByKode(items: ConsumableItemType[]): ConsumableItemType[] {
  return [...items].sort((a, b) =>
    b.kode_barang.localeCompare(a.kode_barang, undefined, { numeric: true })
  );
}


const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Barang", key: "kode_barang" },
  { header: "Nama Consumable", key: "nama" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "ER/E", key: "er_e" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Stok Tersedia", key: "stok_awal" },
];

interface AntreanConsumableApiItem {
  id: string;
  consumable_id: string;
  kodeBarang?: string;
  kode_barang?: string;
  namaBarang?: string;
  nama?: string;
  qty?: number;
  jumlah?: number;
  stok_tersedia?: number;
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

  const [cart, setCart] = useState<ConsumableCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [outError, setOutError] = useState<string | null>(null);

  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const loadConsumables = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConsumables();
      setConsumables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data consumable");
    } finally {
      setLoading(false);
    }
  };

  const loadCart = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const json = await api<{ data: AntreanConsumableApiItem[] } | AntreanConsumableApiItem[]>(
        "/consumable-keluar/antrean",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(userId ? { "x-user-id": userId } : {}),
          },
        }
      );

<<<<<<< HEAD
      // 1. TAMBAHKAN LOG INI UNTUK MELIHAT RESPON BACKEND
      console.log("RESPON API ANTREAN:", json);

      const rawItems = json.data || (Array.isArray(json) ? json : []);

      // 2. TAMBAHKAN LOG INI UNTUK MELIHAT DATA SEBELUM DI-MAPPING
      console.log("DATA MENTAH (RAW ITEMS):", rawItems);

      const mappedCart: ConsumableCartItem[] = rawItems.map((item: any) => ({
=======
      const rawItems: AntreanConsumableApiItem[] = Array.isArray(json) ? json : json.data || [];

      const mappedCart: ConsumableCartItem[] = rawItems.map((item) => ({
>>>>>>> 2a7288689f276357f85adf4bc240025c4907cd09
        id: item.id,
        consumable_id: item.consumable_id,
        kode_barang: item.kodeBarang || item.kode_barang || "-",
        nama: item.namaBarang || item.nama || "Bahan Dihapus",
        jumlah: item.qty || item.jumlah || 1,
        stok_tersedia: item.stok_tersedia ?? 0,
      }));

      // 3. TAMBAHKAN LOG INI UNTUK MELIHAT HASIL AKHIR KERANJANG
      console.log("HASIL MAPPING KERANJANG:", mappedCart);

      setCart(mappedCart);
    } catch (err) {
      console.error("Gagal load keranjang", err);
    }

  }, []);
  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (!token) return; 

    loadConsumables();
    loadCart();

    const handleFocus = () => {
      loadCart();
    };

    window.addEventListener("focus", handleFocus);

    // ========================================================
    // TAMBAHAN BARU: Auto-refresh keranjang setiap 3 detik
    // agar data dari HP langsung merender di PC tanpa di-klik
    // ========================================================
    const autoRefresh = setInterval(() => {
      loadCart();
    }, 3000); 

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(autoRefresh); // Bersihkan timer saat komponen di-unmount
    };
  }, [loadCart]);

  const filteredConsumables = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    return consumables
      .map((item) => {
        const itemDiKeranjang = cart.find((c) => c.consumable_id === item.id);
        const jumlahDiKeranjang = itemDiKeranjang ? itemDiKeranjang.jumlah : 0;

        return {
          ...item,
          stok_awal: item.stok_awal - jumlahDiKeranjang, 
        };
      })
      .filter((item) => {
        return (
          keyword === "" ||
          item.kode_barang.toLowerCase().includes(keyword) ||
          item.nama.toLowerCase().includes(keyword)
        );
      });
  }, [consumables, searchTerm, cart]);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };

    const openEditModal = useCallback((item: ConsumableItemType) => {
    setActiveItem(consumables.find((c) => c.id === item.id) || item);
    setFormError(null);
    setFormModalOpen(true);
  }, [consumables]);

   const openDetailModal = useCallback((item: ConsumableItemType) => {
    setActiveItem(consumables.find((c) => c.id === item.id) || item);
    setDetailModalOpen(true);
  }, [consumables]);

  const openDeleteModal = useCallback((item: ConsumableItemType) => {
    setActiveItem(consumables.find((c) => c.id === item.id) || item);
    setDeleteModalOpen(true);
  }, [consumables]);

  const handleExportPDF = () =>
    exportToPDF(filteredConsumables as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-consumable", "Data Consumable");
  const handleExportExcel = () =>
    exportToExcel(filteredConsumables as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-consumable");

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
      setFormError(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteConsumable(activeItem.id);
      setConsumables((prev) => prev.filter((c) => c.id !== activeItem.id));
      await loadCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setDeleteModalOpen(false);
      setActiveItem(null);
    }
  };

  const handleAddToCart = useCallback(async (
    item: ConsumableItemType,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (item.stok_awal <= 0) {
      alert(`Stok untuk ${item.nama} sudah habis!`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      await api("/consumable-keluar/scan", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          consumable_id: item.id, 
          jumlah: 1,
          ...(userId ? { user_id: userId } : {})
        }),
      });

      await loadCart();
      setCartOpen(true);

      if (event?.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        setFlyAnimations((prev) => [
          ...prev,
          {
            id: uuid(),
            startX: rect.left + rect.width / 2,
            startY: rect.top + rect.height / 2,
          },
        ]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambah ke keranjang.");
    }
  }, [loadCart]);

  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateQty = async (consumableId: string, qty: number) => {
    const item = consumables.find((c) => c.id === consumableId); 
    if (!item) return;

    if (qty > item.stok_awal) {
      alert(`Jumlah tidak boleh melebihi stok tersedia (${item.stok_awal})`);
      return;
    }

    try {
      const cartItem = cart.find((c) => c.consumable_id === consumableId);
      if (!cartItem) return;

      const token = localStorage.getItem("token");
      await api(`/consumable-keluar/cart/${cartItem.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ qty }),
      });
      await loadCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate jumlah.");
    }
  };

  const handleRemoveItem = async (consumableId: string) => {
    const cartItem = cart.find((c) => c.consumable_id === consumableId);
    if (!cartItem) return;

    try {
      const token = localStorage.getItem("token");
      await api(`/consumable-keluar/antrean/${cartItem.consumable_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadCart();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Gagal menghapus item dari keranjang.");
    }
  };

  const handleLoanSubmit = async (values: ConsumableOutFormValues) => {
    if (cart.length === 0) return;
    setIsSubmittingCart(true);
    setOutError(null);

    try {
      const dicatatOleh = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      if (!dicatatOleh || !token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const payload = {
        peminta_id: values.pemintaId,
<<<<<<< HEAD
=======
        nama_pekerjaan: values.namaPekerjaan,
>>>>>>> 2a7288689f276357f85adf4bc240025c4907cd09
        pekerjaan_area: values.areaKerja,
        keterangan: values.keterangan || "",
        dicatat_oleh: dicatatOleh,
      };

      await api("/consumable-keluar/proses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      setLoanFormOpen(false);
      setCartOpen(false);
      setSuccessMessage("Pengeluaran bahan berhasil diproses!");

      await loadConsumables();
      await loadCart();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Gagal proses keranjang:", err);
      setOutError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pengeluaran bahan."
      );
    } finally {
      setIsSubmittingCart(false);
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
    [openDetailModal, openEditModal, openDeleteModal, handleAddToCart]
  );

  return (
    <div className="datatools-page">
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

      {outError && (
        <Alert variant="danger" dismissible onClose={() => setOutError(null)}>
          {outError}
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Data Consumable</h1>
              <p className="text-secondary mb-0">
                Mengelola seluruh data bahan yang terdapat di Ruang Tools.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} /> Tambah Bahan
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <div className="datatools-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={6} md={7}>
              <InputGroup className="datatools-search">
                <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode atau nama bahan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={6} md={5} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan <span className="fw-semibold text-body">{filteredConsumables.length}</span> dari {consumables.length} data
              </span>
            </Col>
          </Row>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : consumables.length === 0 ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3"><IconBox size={32} /></div>
              <h5 className="mb-1">Belum ada data consumable</h5>
              <p className="text-secondary mb-4">Mulai dengan menambahkan bahan pertama ke Ruang Tools.</p>
              <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} /> Tambah Bahan
              </Button>
            </div>
          ) : filteredConsumables.length === 0 ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3"><IconMoodEmpty size={32} /></div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">Tidak ditemukan bahan yang cocok dengan pencarian.</p>
              <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm("")}>
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable data={filteredConsumables} columns={columns} pagination isSortable />
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
        existingCodes={consumables.map((c) => c.kode_barang)}
      />

      <ConsumableDetailModal
        show={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        consumable={activeItem}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        consumable={activeItem}
      />

      {/* FLOATING ACTION BUTTON KERANJANG */}
      <CartFAB 
        itemCount={cart.length} 
        onClick={async () => {
          await loadCart();
          setCartOpen(true);
        }} 
      />

      {/* OFFCANVAS KERANJANG */}
      <CartOffcanvas
        show={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onProceed={() => {
          setCartOpen(false);
          setLoanFormOpen(true);
        }}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveItem}
      />
      <AddToCartFlyEffect animations={flyAnimations} onAnimationEnd={handleAnimationEnd} />

      {/* MODAL CHECKOUT KELUAR */}
      <ConsumableOutFormModal
        show={loanFormOpen}
        onClose={() => setLoanFormOpen(false)}
        onSubmit={handleLoanSubmit}
        cartItems={cart}
        submitting={isSubmittingCart}
        error={outError}
      />
    </div>
  );
};

export default DataConsumableManager;
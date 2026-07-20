"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Button, Spinner, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";
import { v4 as uuid } from "uuid";

import {
  ConsumableItemType,
  ConsumableFormValues,
  ConsumableCartItemType,
  ConsumableOutFormValues,
} from "types/DataConsumableTypes";

// ConsumableCartItemType (dari types/DataConsumableTypes) tidak punya `id`,
// karena CartOffcanvas cuma butuh consumable_id untuk update/remove.
// Tapi di manager ini kita butuh `id` (row id cart di DB) untuk hit endpoint
// PATCH/DELETE /api/consumable-keluar/cart/{id}. Extend saja supaya tetap
// structurally compatible saat dioper ke CartOffcanvas / ConsumableOutFormModal.
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

// Gunakan API wrapper kamu (sesuaikan path-nya jika berbeda)
import api from "lib/api";

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

  // State Keranjang & Checkout
  const [cart, setCart] = useState<ConsumableCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [outError, setOutError] = useState<string | null>(null);

  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);

  // ==========================================
  // FETCH DATA MASTER & KERANJANG
  // ==========================================
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

  const loadCart = async () => {
    try {
      // apiFetch (lib/api.ts) sudah mem-parse response jadi JSON dan langsung
      // mengembalikannya (bukan objek Response), jadi TIDAK perlu panggil .json() lagi.
      const json = await api<{ data: any[] }>("/consumable-keluar/antrean");

      const mappedCart: ConsumableCartItem[] = json.data.map((item: any) => ({
        id: item.id,
        consumable_id: item.consumable_id,
        kode_barang: item.kode_barang,
        nama: item.nama,
        jumlah: item.qty,
        stok_tersedia: item.stok_tersedia,
      }));

      setCart(mappedCart);
    } catch (err) {
      console.error("Gagal load keranjang", err);
    }
  };

  // ================= LOAD DATA + POLLING ANTREAN =================
  useEffect(() => {
    // Cek apakah user sudah login (sesuaikan dengan cara kamu menyimpan sesi/token)
    const token = localStorage.getItem("token"); // atau "userId"

    if (!token) {
      return; // Hentikan proses jika tidak ada token/belum login
    }

    loadConsumables();
    loadCart();

    // polling supaya hasil scan dari Flutter app langsung muncul di web
    const interval = setInterval(() => {
      loadCart();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // HANDLER MODAL MASTER DATA
  // ==========================================
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
      setFormError(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteConsumable(activeItem.id);
      setConsumables((prev) => prev.filter((c) => c.id !== activeItem.id));
      // kalau consumable yang dihapus ada di cart, item di temporary_cart jadi orphan
      // -> antrean() sudah nge-skip consumable yang null, jadi tinggal refetch
      await loadCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setDeleteModalOpen(false);
      setActiveItem(null);
    }
  };

  // ==========================================
  // HANDLER CART (BERBASIS API/DATABASE)
  // ==========================================

  // Berlaku untuk Klik Manual dari Tabel maupun dari Hasil Scan QR Code.
  // `event` opsional: kalau dipanggil dari hasil scan (bukan klik tombol),
  // tidak ada elemen DOM untuk dijadikan titik awal animasi.
  const handleAddToCart = async (
    item: ConsumableItemType,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    // 1. Cari item di keranjang untuk tahu berapa yang sudah di-scan/input
    const itemDiKeranjang = cart.find((c) => c.consumable_id === item.id);
    const jumlahDiKeranjang = itemDiKeranjang ? itemDiKeranjang.jumlah : 0;

    // 2. Validasi: Stok yang tersedia = Stok Awal - Jumlah di Keranjang
    const tersedia = item.stok_awal - jumlahDiKeranjang;

    if (tersedia <= 0) {
      alert(`Stok untuk ${item.nama} sudah habis! (Tersedia: 0)`);
      return;
    }

    try {
      // 3. Scan ke API
      await api("/consumable/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumable_id: item.id,
          jumlah: 1,
        }),
      });

      // 4. Update state keranjang segera setelah scan berhasil
      await loadCart();
      setCartOpen(true);

      // Fly animation hanya jika ada event click (bukan dari scan QR otomatis)
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
  };

  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateQty = async (consumableId: string, qty: number) => {
    const item = consumables.find((c) => c.id === consumableId);
    if (!item) return;

    // Validasi: Jika qty baru > stok_awal, batasi ke stok_awal
    if (qty > item.stok_awal) {
      alert(`Jumlah tidak boleh melebihi stok tersedia (${item.stok_awal})`);
      return;
    }

    try {
      const cartItem = cart.find((c) => c.consumable_id === consumableId);
      if (!cartItem) return;

      await api(`/consumable-keluar/cart/${cartItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty }),
      });
      await loadCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate jumlah.");
    }
  };

  const handleRemoveItem = async (consumableId: string) => {
    // Cari row id cart berdasarkan consumable_id
    const cartItem = cart.find((c) => c.consumable_id === consumableId);
    if (!cartItem) return;

    try {
      await api(`/consumable-keluar/cart/${cartItem.id}`, {
        method: "DELETE",
      });
      await loadCart();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Gagal menghapus item dari keranjang.");
    }
  };

  // ==========================================
  // PROSES CHECKOUT KELUAR
  // ==========================================
  const handleLoanSubmit = async (values: ConsumableOutFormValues) => {
    if (cart.length === 0) return;
    setIsSubmittingCart(true);
    setOutError(null);

    try {
      const dicatatOleh = localStorage.getItem("userId");
      if (!dicatatOleh) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const payload = {
        peminta_id: values.pemintaId,
        pekerjaan_area: values.areaKerja,
        keterangan: values.keterangan || "",
        dicatat_oleh: dicatatOleh,
      };

      // apiFetch (lib/api.ts) sudah otomatis throw Error kalau request gagal
      // (lihat `if (!res.ok) throw ...` di dalamnya), jadi kalau baris di bawah
      // ini berhasil dieksekusi tanpa exception, artinya checkout sudah sukses.
      // Tidak perlu (dan tidak bisa) cek response.ok di sini.
      await api("/consumable-keluar/proses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Setup Kolom Tabel
  const columns = useMemo(
    () =>
      getConsumableColumns({
        onDetail: openDetailModal,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onStockOut: handleAddToCart, // Klik keranjang di tabel masuk ke fungsi API
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

      {outError && (
        <Alert variant="danger" dismissible onClose={() => setOutError(null)}>
          {outError}
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
      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />

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
    </>
  );
};

export default DataConsumableManager;
"use client";
// import node module libraries
import { useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Form, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";
import { v4 as uuid } from "uuid";

// import redux store
import { useAppDispatch, useAppSelector } from "store/store";
import {
  addTool,
  updateTool,
  deleteTool,
  checkoutPeminjaman,
} from "store/slices/inventoryToolsSlice";

// import custom types
import {
  ToolItemType,
  ToolFormValues,
  ToolCondition,
  CartItemType,
  LoanFormValues,
} from "types/DataToolsTypes";

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getDataToolsColumns } from "components/ruangtools/datatools/ColumnDefination";
import ToolFormModal from "components/ruangtools/datatools/ToolFormModal";
import ToolDetailModal from "components/ruangtools/datatools/ToolDetailModal";
import DeleteConfirmModal from "components/ruangtools/datatools/DeleteConfirmModal";
import CartFAB from "components/ruangtools/datatools/CartFAB";
import CartOffcanvas from "components/ruangtools/datatools/CartOffcanvas";
import LoanFormModal from "components/ruangtools/datatools/LoanFormModal";
import AddToCartFlyEffect, {
  FlyAnimationItem,
} from "components/ruangtools/datatools/AddToCartFlyEffect";

const KONDISI_FILTER_OPTIONS: (ToolCondition | "Semua")[] = [
  "Semua",
  "Baik",
  "Rusak Ringan",
  "Rusak Berat",
  "Rusak Permanen",
];

const DataToolsManager = () => {
  const dispatch = useAppDispatch();
  // Data tools sekarang dari Redux store (dipakai bersama halaman Peminjaman Aktif)
  const tools = useAppSelector((state) => state.inventoryTools.tools);

  // Filter "Kondisi" (dropdown custom, terpisah dari search bawaan TanstackTable)
  const [kondisiFilter, setKondisiFilter] = useState<ToolCondition | "Semua">(
    "Semua"
  );

  // State modal: Tambah/Edit, Detail, Hapus
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolItemType | null>(null);

  // State Keranjang Peminjaman (tetap lokal, hanya UI sementara sebelum checkout)
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);

  // Animasi "fly to cart"
  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredTools = useMemo(() => {
    if (kondisiFilter === "Semua") return tools;
    return tools.filter((t) => t.kondisi === kondisiFilter);
  }, [tools, kondisiFilter]);

  // ---- handler: Tambah Data ----
  const openAddModal = () => {
    setActiveTool(null);
    setFormModalOpen(true);
  };

  // ---- handler: Edit Data ----
  const openEditModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setFormModalOpen(true);
  };

  // ---- handler: submit form (dipakai untuk Tambah maupun Edit) ----
  const handleFormSubmit = (values: ToolFormValues) => {
    if (activeTool) {
      dispatch(updateTool({ id: activeTool.id, values }));
    } else {
      dispatch(addTool(values));
    }
    setFormModalOpen(false);
    setActiveTool(null);
  };

  // ---- handler: Detail Alat ----
  const openDetailModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setDetailModalOpen(true);
  };

  // ---- handler: Hapus Data ----
  const openDeleteModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (activeTool) {
      dispatch(deleteTool({ id: activeTool.id }));
      // kalau alat yang dihapus kebetulan ada di keranjang, ikut dihapus juga
      setCart((prev) => prev.filter((c) => c.toolId !== activeTool.id));
    }
    setDeleteModalOpen(false);
    setActiveTool(null);
  };

  // ---- handler: Tambah ke Peminjaman (keranjang) ----
  // Panel keranjang TIDAK otomatis terbuka -> cukup animasi ikon terbang ke FAB.
  const handleAddToCart = (
    tool: ToolItemType,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const tersedia = tool.stok - tool.dipinjam;
    if (tersedia <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.toolId === tool.id);
      if (existing) {
        return prev.map((c) =>
          c.toolId === tool.id
            ? { ...c, jumlah: Math.min(c.jumlah + 1, tersedia) }
            : c
        );
      }
      return [
        ...prev,
        {
          toolId: tool.id,
          kodeBarang: tool.kodeBarang,
          namaBarang: tool.namaBarang,
          jumlah: 1,
          maxJumlah: tersedia,
        },
      ];
    });

    // trigger animasi dari posisi tombol yang diklik menuju FAB keranjang
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

  const handleUpdateCartQty = (toolId: string, jumlah: number) => {
    setCart((prev) =>
      prev.map((c) => (c.toolId === toolId ? { ...c, jumlah } : c))
    );
  };

  const handleRemoveFromCart = (toolId: string) => {
    setCart((prev) => prev.filter((c) => c.toolId !== toolId));
  };

  // ---- handler: Lanjutkan Peminjaman -> buka Form Peminjaman ----
  const handleProceedToLoanForm = () => {
    setCartOpen(false);
    setLoanFormOpen(true);
  };

  // ---- handler: submit Form Peminjaman ----
  const handleLoanSubmit = (values: LoanFormValues) => {
    dispatch(checkoutPeminjaman({ loanForm: values, cartItems: cart }));

    setCart([]);
    setLoanFormOpen(false);

    setSuccessMessage(
      `Peminjaman untuk ${values.namaPeminjam} berhasil dibuat. Status: Sedang Dipinjam.`
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const columns = useMemo(
    () =>
      getDataToolsColumns({
        onDetail: openDetailModal,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onAddToCart: handleAddToCart,
      }),
    []
  );

  return (
    <>
      {/* ---- Notifikasi sukses setelah peminjaman dikonfirmasi ---- */}
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
              <h1 className="mb-2 h2">Data Tools</h1>
              <p className="text-secondary mb-0">
                Mengelola seluruh data peralatan yang terdapat di Ruang
                Tools.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
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

      {/* ---- Filter Kondisi ---- */}
      <Card className="card-lg mb-6">
        <CardBody>
          <Row className="align-items-center g-3 mb-2">
            <Col md={4} sm={6}>
              <Form.Label className="mb-1 small text-secondary">
                Filter Kondisi
              </Form.Label>
              <Form.Select
                size="sm"
                value={kondisiFilter}
                onChange={(e) =>
                  setKondisiFilter(
                    e.target.value as ToolCondition | "Semua"
                  )
                }
              >
                {KONDISI_FILTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <TanstackTable
            data={filteredTools}
            columns={columns}
            filter
            pagination
            isSortable
            filterPlaceholder="Cari kode / nama barang..."
          />
        </CardBody>
      </Card>

      {/* ---- Modals ---- */}
      <ToolFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveTool(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeTool}
      />
      <ToolDetailModal
        show={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        tool={activeTool}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        tool={activeTool}
      />

      {/* ---- Keranjang Peminjaman: FAB + panel (tidak auto-terbuka) ---- */}
      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />
      <CartOffcanvas
        show={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemove={handleRemoveFromCart}
        onProceed={handleProceedToLoanForm}
      />
      <AddToCartFlyEffect
        animations={flyAnimations}
        onAnimationEnd={handleAnimationEnd}
      />

      {/* ---- Form Peminjaman ---- */}
      <LoanFormModal
        show={loanFormOpen}
        onClose={() => setLoanFormOpen(false)}
        onSubmit={handleLoanSubmit}
        cartItems={cart}
      />
    </>
  );
};

export default DataToolsManager;

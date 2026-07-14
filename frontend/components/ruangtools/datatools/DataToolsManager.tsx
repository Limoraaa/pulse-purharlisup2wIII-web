"use client";
// import node module libraries
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Form, Spinner, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";
import { v4 as uuid } from "uuid";

// import redux store
import { useAppDispatch, useAppSelector } from "store/store";
import {
  fetchTools,
  addToolThunk,
  updateToolThunk,
  deleteToolThunk,
  checkoutPeminjamanThunk,
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

// ---- Helper: generate kode barang berikutnya (I-001, I-002, dst) ----
const generateNextKodeBarang = (tools: ToolItemType[]): string => {
  if (tools.length === 0) return "I-001";
  const maxNumber = tools.reduce((max, tool) => {
    const match = tool.kodeBarang.match(/^I-(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  const nextNumber = maxNumber + 1;
  return `I-${String(nextNumber).padStart(3, "0")}`;
};

const KONDISI_FILTER_OPTIONS: (ToolCondition | "Semua")[] = [
  "Semua",
  "Baik",
  "Rusak Ringan",
  "Rusak Berat",
  "Rusak Permanen",
];

const DataToolsManager = () => {
  const dispatch = useAppDispatch();

  // Data tools dari Redux store, diisi dari database lewat fetchTools()
  const tools = useAppSelector((state) => state.inventoryTools.tools);
  const loadingTools = useAppSelector((state) => state.inventoryTools.loadingTools);
  const toolsError = useAppSelector((state) => state.inventoryTools.toolsError);

  // Filter "Kondisi" (dropdown custom, terpisah dari search bawaan TanstackTable)
  const [kondisiFilter, setKondisiFilter] = useState<ToolCondition | "Semua">("Semua");

  // ---- State modal: Tambah/Edit, Detail, Hapus ----
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolItemType | null>(null);
  const [suggestedKodeBarang, setSuggestedKodeBarang] = useState("");

  // ---- State Keranjang Peminjaman (lokal, hanya UI sementara sebelum checkout) ----
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ---- Animasi "fly to cart" ----
  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);

  // ---- Notifikasi ----
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ================= LOAD DATA DARI DATABASE =================
  useEffect(() => {
    dispatch(fetchTools());
  }, [dispatch]);

  const filteredTools = useMemo(() => {
    if (kondisiFilter === "Semua") return tools;
    return tools.filter((t) => t.kondisi === kondisiFilter);
  }, [tools, kondisiFilter]);

  // ================= CRUD TOOLS =================
  const openAddModal = () => {
    setActiveTool(null);
    setSuggestedKodeBarang(generateNextKodeBarang(tools));
    setFormModalOpen(true);
  };

  const openEditModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (values: ToolFormValues) => {
    try {
      if (activeTool) {
        await dispatch(updateToolThunk({ id: activeTool.id, values })).unwrap();
      } else {
        await dispatch(addToolThunk(values)).unwrap();
      }
      setFormModalOpen(false);
      setActiveTool(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      alert(message);
    }
  };

  const openDetailModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeTool) return;
    try {
      await dispatch(deleteToolThunk(activeTool.id)).unwrap();
      // kalau alat yang dihapus kebetulan ada di keranjang, ikut dihapus juga
      setCart((prev) => prev.filter((c) => c.toolId !== activeTool.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus data";
      alert(message);
    } finally {
      setDeleteModalOpen(false);
      setActiveTool(null);
    }
  };

  // ================= KERANJANG PEMINJAMAN =================
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
          c.toolId === tool.id ? { ...c, jumlah: Math.min(c.jumlah + 1, tersedia) } : c
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
    setCart((prev) => prev.map((c) => (c.toolId === toolId ? { ...c, jumlah } : c)));
  };

  const handleRemoveFromCart = (toolId: string) => {
    setCart((prev) => prev.filter((c) => c.toolId !== toolId));
  };

  const handleProceedToLoanForm = () => {
    setCartOpen(false);
    setLoanFormOpen(true);
  };

  // ---- submit Form Peminjaman -> dispatch ke Redux -> hit API Laravel ----
  const handleLoanSubmit = async (values: LoanFormValues) => {
    setSubmittingLoan(true);
    setLoanError(null);

    try {
      // TODO: ganti cara ambil staff id ini sesuai skema auth yang sebenarnya
      const dicatatOleh = localStorage.getItem("userId");
      if (!dicatatOleh) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      await dispatch(
        checkoutPeminjamanThunk({ loanForm: values, cartItems: cart, dicatatOleh })
      ).unwrap();

      setCart([]);
      setLoanFormOpen(false);

      setSuccessMessage(
        `Peminjaman untuk ${values.namaPeminjam} berhasil dibuat. Status: Sedang Dipinjam.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat peminjaman";
      setLoanError(message);
    } finally {
      setSubmittingLoan(false);
    }
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

      {loanError && (
        <Alert variant="danger" dismissible onClose={() => setLoanError(null)}>
          {loanError}
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
              <h1 className="mb-2 h2">Data Tools</h1>
              <p className="text-secondary mb-0">
                Mengelola seluruh data peralatan yang terdapat di Ruang Tools.
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
          {toolsError && <Alert variant="danger">{toolsError}</Alert>}

          <Row className="align-items-center g-3 mb-2">
            <Col md={4} sm={6}>
              <Form.Label className="mb-1 small text-secondary">Filter Kondisi</Form.Label>
              <Form.Select
                size="sm"
                value={kondisiFilter}
                onChange={(e) => setKondisiFilter(e.target.value as ToolCondition | "Semua")}
              >
                {KONDISI_FILTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {loadingTools ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : (
            <TanstackTable
              data={filteredTools}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari kode / nama barang..."
            />
          )}
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
        suggestedKodeBarang={suggestedKodeBarang}
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
      <AddToCartFlyEffect animations={flyAnimations} onAnimationEnd={handleAnimationEnd} />

      <LoanFormModal
        show={loanFormOpen}
        onClose={() => setLoanFormOpen(false)}
        onSubmit={handleLoanSubmit}
        cartItems={cart}
        submitting={submittingLoan}
      />
    </>
  );
};

export default DataToolsManager;
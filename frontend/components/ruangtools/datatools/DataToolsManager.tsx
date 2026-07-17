"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Form, Spinner, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";
import { v4 as uuid } from "uuid";

import { useAppDispatch, useAppSelector } from "store/store";
import {
  fetchTools,
  addToolThunk,
  updateToolThunk,
  deleteToolThunk,
  checkoutPeminjamanThunk,
  fetchAntreanThunk,
  scanToolThunk,
  updateCartItemThunk,
  removeCartItemThunk,
} from "store/slices/inventoryToolsSlice";

import {
  ToolItemType,
  ToolFormValues,
  ToolCondition,
  LoanFormValues,
} from "types/DataToolsTypes";

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

const generateNextKodeBarang = (tools: ToolItemType[]): string => {
  if (tools.length === 0) return "I-001";
  const maxNumber = tools.reduce((max, tool) => {
    const match = tool.kodeBarang.match(/^I-(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `I-${String(maxNumber + 1).padStart(3, "0")}`;
};

const KONDISI_FILTER_OPTIONS: (ToolCondition | "Semua")[] = ["Semua", "Baik", "Rusak"];

const DataToolsManager = () => {
  const dispatch = useAppDispatch();

  const tools = useAppSelector((state) => state.inventoryTools.tools);
  const cart = useAppSelector((state) => state.inventoryTools.cart);
  const loadingTools = useAppSelector((state) => state.inventoryTools.loadingTools);
  const toolsError = useAppSelector((state) => state.inventoryTools.toolsError);
  const cartError = useAppSelector((state) => state.inventoryTools.cartError);

  const [kondisiFilter, setKondisiFilter] = useState<ToolCondition | "Semua">("Semua");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolItemType | null>(null);
  const [suggestedKodeBarang, setSuggestedKodeBarang] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ================= LOAD DATA + POLLING ANTREAN =================
  // ================= LOAD DATA + POLLING ANTREAN =================
  useEffect(() => {
    // Cek apakah user sudah login (sesuaikan dengan cara kamu menyimpan sesi/token)
    const token = localStorage.getItem("token"); // atau "userId"
    
    if (!token) {
      return; // Hentikan proses jika tidak ada token/belum login
    }

    dispatch(fetchTools());
    dispatch(fetchAntreanThunk());

    // polling supaya hasil scan dari Flutter app langsung muncul di web
    const interval = setInterval(() => {
      dispatch(fetchAntreanThunk());
    }, 4000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const filteredTools = useMemo(() => {
    if (kondisiFilter === "Semua") return tools;
    return tools.filter((t) => t.kondisi === kondisiFilter);
  }, [tools, kondisiFilter]);

  // ================= CRUD TOOLS (tidak berubah) =================
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
      alert(err instanceof Error ? err.message : "Gagal menyimpan data");
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
      // kalau tool yang dihapus ada di cart, item di temporary_cart jadi orphan
      // -> antrean() sudah nge-skip tool yang null, jadi tinggal refetch
      dispatch(fetchAntreanThunk());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setDeleteModalOpen(false);
      setActiveTool(null);
    }
  };

  // ================= KERANJANG PEMINJAMAN =================
  const handleAddToCart = async (
    tool: ToolItemType,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // 1. Ambil data keranjang terbaru dari Redux (sudah disinkronkan via polling)
    const itemDiKeranjang = cart.find(c => c.toolId === tool.id);
    const jumlahDiKeranjang = itemDiKeranjang ? itemDiKeranjang.jumlah : 0;

    // 2. Hitung sisa stok (Stok total - yang sedang dipinjam orang lain - yang sudah ada di cart)
    const tersedia = (tool.stok - tool.dipinjam) - jumlahDiKeranjang;

    if (tersedia <= 0) {
      alert(`Stok untuk ${tool.namaBarang} sudah habis di keranjang!`);
      return;
    }

    try {
      // dispatch thunk yang memanggil API scan
      await dispatch(scanToolThunk({ toolId: tool.id, jumlah: 1 })).unwrap();
      await dispatch(fetchAntreanThunk()).unwrap(); // Refresh antrean setelah scan

      // Fly effect...
      if (event.currentTarget) {
         // ... (kode fly effect tetap sama)
      }
    } catch (err: any) {
      // Jika backend me-return 422 (Stok tidak cukup), ini akan ditangkap di sini
      const errorMessage = typeof err === 'string' ? err : (err?.message || "Gagal menambah ke keranjang");
      alert(errorMessage); 
    }
  };

  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  // Pastikan parameter di sini menerima string cartId
  const handleUpdateCartQty = (cartId: string, jumlah: number) => {
    // Pastikan updateCartItemThunk mengirimkan cartId ke backend
    dispatch(updateCartItemThunk({ cartId, qty: jumlah }));
  };

  const handleRemoveFromCart = async (cartId: string) => {
    // Pastikan removeCartItemThunk mengirimkan cartId ke backend
    await dispatch(removeCartItemThunk(cartId)).unwrap();
    await dispatch(fetchAntreanThunk()).unwrap(); // Refresh agar UI terupdate
  };

  const handleProceedToLoanForm = () => {
    setCartOpen(false);
    setLoanFormOpen(true);
  };

  const handleLoanSubmit = async (values: LoanFormValues) => {
    setSubmittingLoan(true);
    setLoanError(null);

    try {
      const dicatatOleh = localStorage.getItem("userId");
      if (!dicatatOleh) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      await dispatch(checkoutPeminjamanThunk({ loanForm: values, dicatatOleh })).unwrap();

      setLoanFormOpen(false);
      setSuccessMessage(
        `Peminjaman untuk ${values.namaPeminjam} berhasil dibuat. Status: Sedang Dipinjam.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setLoanError(err instanceof Error ? err.message : "Gagal membuat peminjaman");
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
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {loanError && (
        <Alert variant="danger" dismissible onClose={() => setLoanError(null)}>
          {loanError}
        </Alert>
      )}

      {cartError && (
        <Alert variant="warning" dismissible onClose={() => {}}>
          {cartError}
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Data Tools</h1>
              <p className="text-secondary mb-0">
                Mengelola seluruh data peralatan yang terdapat di Ruang Tools.
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
                  <option key={opt} value={opt}>{opt}</option>
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

      <ToolFormModal
        show={formModalOpen}
        onClose={() => { setFormModalOpen(false); setActiveTool(null); }}
        onSubmit={handleFormSubmit}
        initialData={activeTool}
        suggestedKodeBarang={suggestedKodeBarang}
      />
      <ToolDetailModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} tool={activeTool} />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        tool={activeTool}
      />

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
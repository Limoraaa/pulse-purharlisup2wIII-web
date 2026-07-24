"use client";
// import node module libraries
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import { AntreanItemResponse } from "services/peminjamanService";
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
  IconTool,
  IconMoodEmpty,
} from "@tabler/icons-react";
import { v4 as uuid } from "uuid";
import useSWR, { useSWRConfig } from "swr";

// Import service layer
import {
  fetchAntrean,
  scanTool,
  updateCartItem,
  removeCartItem,
  prosesPeminjamanApi,
} from "services/peminjamanService";

// import redux store
import { useAppDispatch, useAppSelector } from "store/store";
import {
  fetchTools,
  addToolThunk,
  updateToolThunk,
  deleteToolThunk,
} from "store/slices/inventoryToolsSlice";

// import custom types
import {
  ToolItemType,
  ToolFormValues,
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

// ---- Helper: generate kode barang berikutnya ----
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
  const EXPORT_COLUMNS: ExportColumn[] = [
    { header: "Kode Barang", key: "kodeBarang" },
    { header: "Nama Barang", key: "namaBarang" },
    { header: "Merk", key: "merk" },
    { header: "Tipe", key: "tipe" },
    { header: "Warna", key: "warna" },
    { header: "Ukuran", key: "ukuran" },
    { header: "Kondisi", key: "kondisi" },
    { header: "Stok", key: "stok" },
    { header: "Dipinjam", key: "dipinjam" },
    { header: "Tersedia", key: "tersedia" },
  ];

const DataToolsManager = () => {
  const dispatch = useAppDispatch();
  const { mutate } = useSWRConfig();

  // Data tools dari Redux store
  const tools = useAppSelector((state) => state.inventoryTools.tools);
  const loadingTools = useAppSelector((state) => state.inventoryTools.loadingTools);
  const toolsError = useAppSelector((state) => state.inventoryTools.toolsError);

  // ---- State modal ----
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolItemType | null>(null);
  const [suggestedKodeBarang, setSuggestedKodeBarang] = useState("");

  // ---- State Keranjang Peminjaman ----
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ---- Animasi "fly to cart" ----
  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);

  // ---- Notifikasi ----
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Toolbar: pencarian ----
  const [searchTerm, setSearchTerm] = useState("");

  // ================= FETCH KERANJANG MENGGUNAKAN SWR & SERVICE =================
  const { data: dbCart } = useSWR("/peminjaman/antrean", fetchAntrean);

  // Sinkronisasi data dari Database ke State Frontend
  useEffect(() => {
    if (dbCart && Array.isArray(dbCart)) {
      const groupedCart = dbCart.reduce((acc: CartItemType[], item: AntreanItemResponse) => {
      const cartRecordId = item.id;
      const toolIdVal = item.tools_id;

      const existingItem = acc.find((c) => c.toolId === toolIdVal);

      if (existingItem) {
        existingItem.jumlah += item.qty ?? 1;
      } else {
        acc.push({
          cartId: cartRecordId,
          toolId: toolIdVal,
          namaBarang: item.nama_barang || "Nama Alat Tidak Ditemukan",
          kodeBarang: item.kode_barang || "-",
          jumlah: item.qty ?? 1,
          maxJumlah: item.max_jumlah ?? 99,
        });
      }
      return acc;
    }, []);

      setCart(groupedCart);
    }
  }, [dbCart]);

  // Data filter tabel
  const filteredTools = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return tools.filter((tool) => {
      return (
        keyword === "" ||
        tool.kodeBarang.toLowerCase().includes(keyword) ||
        tool.namaBarang.toLowerCase().includes(keyword) ||
        tool.merk.toLowerCase().includes(keyword) ||
        tool.tipe.toLowerCase().includes(keyword)
      );
    });
  }, [tools, searchTerm]);

  // ================= LOAD DATA DARI DATABASE =================
  useEffect(() => {
    dispatch(fetchTools());
  }, [dispatch]);

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

    const handleExportPDF = () => {
      const dataWithTersedia = filteredTools.map((t) => ({
        ...t,
        tersedia: t.stok - t.dipinjam,
      }));
      exportToPDF(dataWithTersedia as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-tools", "Data Tools");
    };

    const handleExportExcel = () => {
      const dataWithTersedia = filteredTools.map((t) => ({
        ...t,
        tersedia: t.stok - t.dipinjam,
      }));
      exportToExcel(dataWithTersedia as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-tools");
  };
  const openDeleteModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeTool) return;
    try {
      await dispatch(deleteToolThunk(activeTool.id)).unwrap();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus data";
      alert(message);
    } finally {
      setDeleteModalOpen(false);
      setActiveTool(null);
    }
  };

  // ================= KERANJANG PEMINJAMAN =================
  const handleAddToCart = async (tool: ToolItemType, event: React.MouseEvent<HTMLButtonElement>) => {
    const tersedia = tool.stok - tool.dipinjam;
    if (tersedia <= 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyAnimations((prev) => [
      ...prev, 
      { id: uuid(), startX: rect.left + rect.width / 2, startY: rect.top + rect.height / 2 }
    ]);

    try {
      await scanTool(tool.id, 1);
      mutate("/peminjaman/antrean");
    } catch (err) { 
      console.error("Gagal menambah ke keranjang DB", err); 
    }
  };
  
  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateQty = async (cartId: string | number, newJumlah: number) => {
    try {
      await updateCartItem(cartId, newJumlah);
      mutate("/peminjaman/antrean");
    } catch (err) {
      console.error("Gagal memperbarui jumlah item:", err);
    }
  };

  const handleRemoveFromCart = async (cartId: string | number) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));

    try {
      await removeCartItem(cartId);
      mutate("/peminjaman/antrean"); 
    } catch (err) {
      console.error("Gagal menghapus dari keranjang DB", err);
      mutate("/peminjaman/antrean"); 
    }
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

      // Mengirimkan ID pekerja (yang sekarang bersumber dari nomor kartu RFID langsung)
      await prosesPeminjamanApi({
        pemintaId: values.peminjamId, 
        dicatatOleh: dicatatOleh,
        areaKerja: values.areaKerja,
        spesifikasi: values.spesifikasi,
        keterangan: values.keterangan,
      });

      setCart([]);
      setLoanFormOpen(false);
      mutate("/peminjaman/antrean"); 

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
        cartItems: cart,
      }),
    [cart]
  );

  return (
    <div className="datatools-page">
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

      {/* ---- Page Header ---- */}
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
        {/* ---- Toolbar: Search ---- */}
      <div className="datatools-toolbar border-bottom">
        <Row className="g-2 align-items-center">
          <Col lg={5} md={6}>
            <InputGroup className="datatools-search">
              <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode, nama, merk, atau tipe..."
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
          <Col lg={4} md={3} className="text-md-end">
            <span className="text-secondary small">
              Menampilkan <span className="fw-semibold text-body">{filteredTools.length}</span> dari {tools.length} data
            </span>
          </Col>
          <Col lg={3} md={3} className="d-flex justify-content-md-end gap-2">
            <Button variant="outline-danger" size="sm" onClick={handleExportPDF}>
              Export PDF
            </Button>
            <Button variant="outline-success" size="sm" onClick={handleExportExcel}>
              Export Excel
            </Button>
          </Col>
        </Row>
      </div>

        <CardBody>
          {toolsError && <Alert variant="danger">{toolsError}</Alert>}
          {loadingTools ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : tools.length === 0 ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3"><IconTool size={32} /></div>
              <h5 className="mb-1">Belum ada data tools</h5>
              <p className="text-secondary mb-4">Mulai dengan menambahkan peralatan pertama ke Ruang Tools.</p>
              <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} /> Tambah Data
              </Button>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3"><IconMoodEmpty size={32} /></div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">Tidak ditemukan data yang cocok dengan pencarian.</p>
              <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm("")}>
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable data={filteredTools} columns={columns} pagination isSortable />
          )}
        </CardBody>
      </Card>

      {/* ---- Modals ---- */}
      <ToolFormModal show={formModalOpen} onClose={() => { setFormModalOpen(false); setActiveTool(null); }} onSubmit={handleFormSubmit} initialData={activeTool} suggestedKodeBarang={suggestedKodeBarang} />
      <ToolDetailModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} tool={activeTool} />
      <DeleteConfirmModal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} tool={activeTool} />

      {/* ---- Keranjang Peminjaman ---- */}
      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />
      <CartOffcanvas show={cartOpen} onClose={() => setCartOpen(false)} items={cart} onUpdateQty={handleUpdateQty} onRemove={handleRemoveFromCart} onProceed={handleProceedToLoanForm} />
      <AddToCartFlyEffect animations={flyAnimations} onAnimationEnd={handleAnimationEnd} />

      <LoanFormModal show={loanFormOpen} onClose={() => setLoanFormOpen(false)} onSubmit={handleLoanSubmit} cartItems={cart} submitting={submittingLoan} />
    </div>
  );
};

export default DataToolsManager;
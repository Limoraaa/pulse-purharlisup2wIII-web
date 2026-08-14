"use client";
// import node module libraries
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import { AntreanItemResponse } from "services/peminjamanService";
// Tambahkan useRef di sini
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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

import api from "lib/api";

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
import CartOffcanvas from "components/common/CartOffcanvas";
import LoanFormModal from "components/common/LoanFormModal";
import AddToCartFlyEffect, {
  FlyAnimationItem,
} from "components/ruangtools/datatools/AddToCartFlyEffect";

// Tipe gabungan untuk item keranjang (tools + consumable)
interface UnifiedCartItem extends Partial<CartItemType> {
  cartId?: string | number;
  id?: string | number;
  consumable_id?: string;
  jumlah: number;
  item_type?: "tool" | "consumable";
}

interface LoanSubmitValues {
  peminjamId?: string;
  pemintaId?: string;
  namaPeminjam?: string;
  namaPeminta?: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi?: string;
  keterangan?: string;
}

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
  const [cart, setCart] = useState<UnifiedCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ---- Timer untuk Debounce API ----
  const debounceTimers = useRef<Map<string | number, NodeJS.Timeout>>(new Map());

  // ---- Animasi "fly to cart" ----
  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);

  // ---- Notifikasi ----
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Toolbar: pencarian ----
  const [searchTerm, setSearchTerm] = useState("");

  // ================= FETCH KERANJANG MENGGUNAKAN SWR & SERVICE =================
  const { data: dbCart } = useSWR("/peminjaman/antrean", fetchAntrean);

  // Sinkronisasi data Tools dari Database + Gabungkan dengan data Consumable dari LocalStorage
  useEffect(() => {
    let groupedToolsCart: UnifiedCartItem[] = [];

    if (dbCart && Array.isArray(dbCart)) {
      groupedToolsCart = dbCart.reduce((acc: UnifiedCartItem[], item: AntreanItemResponse) => {
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
            item_type: "tool",
          });
        }
        return acc;
      }, []);
    }
    // Simpan tools ke localStorage agar halaman consumable bisa membacanya
    localStorage.setItem("global_shared_tools_cart", JSON.stringify(groupedToolsCart));

    // Ambil data consumable dari localStorage
    const savedConsumableCart = JSON.parse(localStorage.getItem("global_shared_consumable_cart") || "[]");

    // Gabungkan data tools dan consumable ke state cart utama
    setCart([...groupedToolsCart, ...savedConsumableCart]);
  }, [dbCart]);

  // Data filter tabel
  // Data filter tabel (Diperbarui untuk mencari di semua kolom & Null-Safety)
  const filteredTools = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    // Jika kolom pencarian kosong, langsung kembalikan semua data
    if (!keyword) return tools;

    return tools.filter((tool) => {
      // 1. Amankan teks dari nilai null/undefined (Null-Safety)
      const kodeBarang = (tool.kodeBarang || "").toLowerCase();
      const namaBarang = (tool.namaBarang || "").toLowerCase();
      const merk = (tool.merk || "").toLowerCase();
      const tipe = (tool.tipe || "").toLowerCase();
      const warna = (tool.warna || "").toLowerCase();
      const ukuran = (tool.ukuran || "").toLowerCase();
      const kondisi = (tool.kondisi || "").toLowerCase();

      // 2. Konversi tipe data angka menjadi teks agar bisa di-search
      const stok = String(tool.stok || 0);
      const dipinjam = String(tool.dipinjam || 0);
      const tersedia = String((tool.stok || 0) - (tool.dipinjam || 0));

      // 3. Cocokkan keyword dengan semua properti yang ada di tabel
      return (
        kodeBarang.includes(keyword) ||
        namaBarang.includes(keyword) ||
        merk.includes(keyword) ||
        tipe.includes(keyword) ||
        warna.includes(keyword) ||
        ukuran.includes(keyword) ||
        kondisi.includes(keyword) ||
        stok.includes(keyword) ||
        dipinjam.includes(keyword) ||
        tersedia.includes(keyword)
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
  const handleAddToCart = useCallback(async (tool: ToolItemType, event: React.MouseEvent<HTMLButtonElement>) => {
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
  }, [mutate]);
  
  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  // --- OPTIMISTIC UPDATE + DEBOUNCE: handleUpdateQty ---
  const handleUpdateQty = (cartId: string | number, newJumlah: number) => {
    if (newJumlah < 1) return;

    // 1. Update state lokal secara instan (UI merespons tanpa lag)
    setCart((prevCart) =>
      prevCart.map((c) =>
        c.cartId === cartId || c.id === cartId || c.consumable_id === cartId ? { ...c, jumlah: newJumlah } : c
      )
    );

    const targetItem = cart.find((c) => c.cartId === cartId || c.id === cartId || c.consumable_id === cartId);
    if (!targetItem) return;

    // 2. Simpan juga ke Local Storage seketika agar sinkron
    if (targetItem.item_type === "consumable") {
      const savedCons = JSON.parse(localStorage.getItem("global_shared_consumable_cart") || "[]");
      const updated = savedCons.map((c: any) => 
        c.id === cartId || c.consumable_id === cartId ? { ...c, jumlah: newJumlah } : c
      );
      localStorage.setItem("global_shared_consumable_cart", JSON.stringify(updated));
    } else {
      const savedTools = JSON.parse(localStorage.getItem("global_shared_tools_cart") || "[]");
      const updated = savedTools.map((c: any) =>
        c.cartId === cartId || c.id === cartId ? { ...c, jumlah: newJumlah } : c
      );
      localStorage.setItem("global_shared_tools_cart", JSON.stringify(updated));
    }

    // 3. Batalkan request API sebelumnya jika user masih asyik mengetik/ngeklik
    if (debounceTimers.current.has(cartId)) {
      clearTimeout(debounceTimers.current.get(cartId));
    }

    // 4. Jadwalkan pengiriman API setelah user berhenti 500ms
    const timer = setTimeout(async () => {
      try {
        if (targetItem.item_type === "consumable") {
          const token = localStorage.getItem("token");
          await api(`/consumable-keluar/cart/${targetItem.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ qty: newJumlah }),
          });
        } else {
          // Update item jenis Tool ke backend
          await updateCartItem(cartId, newJumlah);
        }

        debounceTimers.current.delete(cartId);
        
        // Mutate secara silent agar UI tidak jumpy, karena layar sudah benar angkanya
        mutate("/peminjaman/antrean"); // Sinkronisasi senyap tanpa mengosongkan layar
      } catch (err) {
        console.error("Gagal memperbarui jumlah item:", err);
        // Jika backend menolak (misal error server/stok limit), paksa ambil nilai asli dari database
        mutate("/peminjaman/antrean");
      }
    }, 500);

    debounceTimers.current.set(cartId, timer);
  };

  // --- PERBAIKAN BUG OPTIMISTIC UPDATE: handleRemoveFromCart ---
  const handleRemoveFromCart = async (cartId: string | number) => {
    const targetItem = cart.find((c) => c.cartId === cartId || c.id === cartId || c.consumable_id === cartId);
    if (!targetItem) return;

    // 1. Hapus secara instan dari state lokal
    setCart((prev) => prev.filter((c) => c.cartId !== cartId && c.id !== cartId && c.consumable_id !== cartId));

    // 2. Jika item tersebut adalah Consumable
    if (targetItem.item_type === "consumable") {
      const savedCons = JSON.parse(localStorage.getItem("global_shared_consumable_cart") || "[]");
      const updated = savedCons.filter((c: any) => c.id !== cartId && c.consumable_id !== cartId);
      localStorage.setItem("global_shared_consumable_cart", JSON.stringify(updated));
      return;
    }

    // 3. Jika item tersebut adalah Tool
    try {
      await removeCartItem(cartId);
      mutate("/peminjaman/antrean"); 
    } catch (err) {
      console.error("Gagal menghapus dari keranjang DB", err);
      mutate("/peminjaman/antrean"); // Revert jika gagal
    }
  };

  const handleProceedToLoanForm = () => {
    setCartOpen(false);
    setLoanFormOpen(true);
  };

  const handleLoanSubmit = async (values: LoanSubmitValues) => {
    setSubmittingLoan(true);
    setLoanError(null);

    try {
      const dicatatOleh = localStorage.getItem("userId"); 
      const token = localStorage.getItem("token");
      if (!dicatatOleh || !token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const pemintaIdValue = values.peminjamId || values.pemintaId;
      if (!pemintaIdValue) {
        throw new Error("Data peminjam tidak ditemukan. Silakan pilih peminjam terlebih dahulu.");
      }

      const hasToolItems = cart.some((c) => c.item_type === "tool" || !c.item_type);
      const hasConsumableItems = cart.some((c) => c.item_type === "consumable");

      const apiRequests = [];

      if (hasToolItems) {
        apiRequests.push(
          prosesPeminjamanApi({
            pemintaId: pemintaIdValue,
            dicatatOleh: dicatatOleh,
            namaPekerjaan: values.namaPekerjaan,
            areaKerja: values.areaKerja,
            spesifikasi: values.spesifikasi || "",
            keterangan: values.keterangan,
          })
        );
      }

      if (hasConsumableItems) {
        apiRequests.push(
          api("/consumable-keluar/proses", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              peminta_id: pemintaIdValue,
              nama_pekerjaan: values.namaPekerjaan,
              pekerjaan_area: values.areaKerja,
              keterangan: values.keterangan || "",
              dicatat_oleh: dicatatOleh,
            }),
          })
        );
      }

      if (apiRequests.length > 0) {
        await Promise.all(apiRequests);
      }

      localStorage.removeItem("global_shared_consumable_cart");
      localStorage.removeItem("global_shared_tools_cart");

      setCart([]);
      setLoanFormOpen(false);
      mutate("/peminjaman/antrean");
      dispatch(fetchTools());

      setSuccessMessage(
        `Peminjaman untuk ${values.namaPeminjam || values.namaPeminta} berhasil dibuat. Status: Sedang Dipinjam.`
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
        cartItems: cart
          .filter((c) => c.item_type !== "consumable")
          .map((c) => ({
            toolId: c.toolId ?? "",
            cartId: c.cartId,
            kodeBarang: c.kodeBarang ?? "-",
            namaBarang: c.namaBarang ?? "-",
            jumlah: c.jumlah,
            maxJumlah: c.maxJumlah ?? 99,
          })),
      }),
    [cart, handleAddToCart]
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
                  placeholder="Cari kode, nama, merk, ukuran, warna, kondisi..."
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
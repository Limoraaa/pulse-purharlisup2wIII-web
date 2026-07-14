"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Form, Spinner, Alert } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";

import {
  ToolItemType,
  ToolFormValues,
  ToolCondition,
  CartItemType,
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

import { getTools, createTool, updateTool, deleteTool } from "services/toolService";
import { submitPeminjaman } from "services/peminjamanService";

const KONDISI_FILTER_OPTIONS: (ToolCondition | "Semua")[] = ["Semua", "Baik", "Rusak"];

const DataToolsManager = () => {
  // ---- Data Tools ----
  const [tools, setTools] = useState<ToolItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kondisiFilter, setKondisiFilter] = useState<ToolCondition | "Semua">("Semua");

  // ---- Modal CRUD Tools ----
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolItemType | null>(null);

  // ---- Keranjang & Form Peminjaman ----
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ---- Notifikasi ----
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ================= LOAD DATA =================
  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTools();
      setTools(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data alat";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const filteredTools = useMemo(() => {
    if (kondisiFilter === "Semua") return tools;
    return tools.filter((t) => t.kondisi === kondisiFilter);
  }, [tools, kondisiFilter]);

  // ================= CRUD TOOLS =================
  const openAddModal = () => {
    setActiveTool(null);
    setFormModalOpen(true);
  };

  const openEditModal = (tool: ToolItemType) => {
    setActiveTool(tool);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (values: ToolFormValues) => {
    try {
      if (activeTool) {
        const updated = await updateTool(activeTool.id, values);
        setTools((prev) =>
          prev
            .map((t) => (t.id === updated.id ? updated : t))
            .sort((a, b) => a.kodeBarang.localeCompare(b.kodeBarang, undefined, { numeric: true }))
        );
      } else {
        const created = await createTool(values);
        setTools((prev) =>
          [created, ...prev].sort((a, b) =>
            a.kodeBarang.localeCompare(b.kodeBarang, undefined, { numeric: true })
          )
        );
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
      await deleteTool(activeTool.id);
      setTools((prev) => prev.filter((t) => t.id !== activeTool.id));
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
  const handleAddToCart = (tool: ToolItemType) => {
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
    setCartOpen(true);
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

  // ---- submit Form Peminjaman -> kirim ke API ----
  const handleLoanSubmit = async (values: LoanFormValues) => {
    setSubmittingLoan(true);
    setLoanError(null);

    try {
      // TODO: ganti cara ambil staff id ini sesuai skema auth yang sebenarnya
      const dicatatOleh = localStorage.getItem("userId");
      if (!dicatatOleh) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      await submitPeminjaman(cart, values.peminjamId, values.areaKerja, dicatatOleh);

      // ambil ulang data tools dari server, supaya kolom Dipinjam/Tersedia akurat
      const freshTools = await getTools();
      setTools(freshTools);

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
          {error && <Alert variant="danger">{error}</Alert>}

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

          {loading ? (
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
        onClose={() => {
          setFormModalOpen(false);
          setActiveTool(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeTool}
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
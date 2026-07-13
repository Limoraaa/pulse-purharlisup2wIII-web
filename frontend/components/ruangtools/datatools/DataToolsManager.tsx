"use client";
// import node module libraries
import { useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Form } from "react-bootstrap";
import { IconPlus } from "@tabler/icons-react";
import { v4 as uuid } from "uuid";

// import custom types
import { ToolItemType, ToolFormValues, ToolCondition } from "types/DataToolsTypes";

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getDataToolsColumns } from "components/ruangtools/datatools/ColumnDefination";
import ToolFormModal from "components/ruangtools/datatools/ToolFormModal";
import ToolDetailModal from "components/ruangtools/datatools/ToolDetailModal";
import DeleteConfirmModal from "components/ruangtools/datatools/DeleteConfirmModal";

// import required data files
import { DataToolsData } from "data/DataToolsData";

const KONDISI_FILTER_OPTIONS: (ToolCondition | "Semua")[] = [
  "Semua",
  "Baik",
  "Rusak Ringan",
  "Rusak Berat",
];

const DataToolsManager = () => {
  // Data utama — nanti ganti jadi hasil fetch API, struktur tipe tetap sama.
  const [tools, setTools] = useState<ToolItemType[]>(DataToolsData);

  // Filter "Kondisi" (dropdown custom, terpisah dari search bawaan TanstackTable)
  const [kondisiFilter, setKondisiFilter] = useState<ToolCondition | "Semua">(
    "Semua"
  );

  // State modal: Tambah/Edit, Detail, Hapus
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolItemType | null>(null);

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
      // mode Edit
      setTools((prev) =>
        prev.map((t) => (t.id === activeTool.id ? { ...t, ...values } : t))
      );
    } else {
      // mode Tambah
      setTools((prev) => [{ id: uuid(), ...values }, ...prev]);
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
      setTools((prev) => prev.filter((t) => t.id !== activeTool.id));
    }
    setDeleteModalOpen(false);
    setActiveTool(null);
  };

  const columns = useMemo(
    () =>
      getDataToolsColumns({
        onDetail: openDetailModal,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
  );

  return (
    <>
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

          {/* filter=true -> menampilkan search box + "Show N entries" bawaan TanstackTable
              pagination=true -> menampilkan pagination bawaan */}
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
    </>
  );
};

export default DataToolsManager;

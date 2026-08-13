"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
  InputGroup,
  Form,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconTruckDelivery,
  IconMoodEmpty,
} from "@tabler/icons-react";

import {
  ToolItemType,
  ToolMasukType,
  ToolMasukFormValues,
} from "types/DataToolsTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import { exportToExcel, exportToPDF, ExportColumn, getFilteredExportFileName } from "components/ruangtools/riwayat/common/exportUtils";
import { getToolMasukColumns } from "components/ruangtools/toolsmasuk/ColumnDefination";
import ToolMasukFormModal from "components/ruangtools/toolsmasuk/ToolMasukFormModal";
import DeleteConfirmModal from "components/ruangtools/toolsmasuk/DeleteConfirmModal";

import { getTools } from "services/toolService";
import {
  getToolMasuk,
  createToolMasuk,
  updateToolMasuk,
  deleteToolMasuk,
} from "services/toolMasukService";

// IMPORT INI UNTUK VALIDASI ROLE
import { getPemintaAktif } from "services/pemintaService";

const ToolMasukManager = () => {
  const [tools, setTools] = useState<ToolItemType[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  const [masukList, setMasukList] = useState<ToolMasukType[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ToolMasukType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Toolbar: pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");
  const [bulanFilter, setBulanFilter] = useState(0);
  const [tahunFilter, setTahunFilter] = useState(0);
  const [namaFilter, setNamaFilter] = useState("");

  const parseTanggal = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getNamaPencatat = (item: ToolMasukType) =>
    item.dicatatOleh?.name || "Tidak diketahui";

  const EXPORT_COLUMNS: ExportColumn[] = [
    { header: "Tanggal", key: "tanggal" }, { header: "Kode Barang", key: "kode_barang" },
    { header: "Nama Barang", key: "nama_barang" }, { header: "Jumlah Masuk", key: "jumlah_masuk" },
    { header: "Pencatat", key: "nama_pencatat" }, { header: "Keterangan", key: "keterangan" },
  ];

  // Data turunan untuk tampilan; sumber data (masukList) tidak diubah.
  const filteredMasukList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return masukList.filter((item) => {
      const date = parseTanggal(item.tanggal);
      const cocokPeriode = (!date || bulanFilter === 0 || date.getMonth() + 1 === bulanFilter) &&
        (!date || tahunFilter === 0 || date.getFullYear() === tahunFilter);
      const cocokNama = namaFilter === "" || getNamaPencatat(item) === namaFilter;
      const cocokKeyword =
        item.kode_barang.toLowerCase().includes(keyword) ||
        item.nama_barang.toLowerCase().includes(keyword) ||
        item.merk.toLowerCase().includes(keyword) ||
        item.tipe.toLowerCase().includes(keyword) ||
        getNamaPencatat(item).toLowerCase().includes(keyword);
      return cocokPeriode && cocokNama && (keyword === "" || cocokKeyword);
    });
  }, [masukList, searchTerm, bulanFilter, tahunFilter, namaFilter]);

  const tahunOptions = useMemo(() => Array.from(new Set(masukList.map((item) => parseTanggal(item.tanggal)?.getFullYear()).filter((year): year is number => Boolean(year)))).sort((a, b) => b - a), [masukList]);
  const namaOptions = useMemo(() => Array.from(new Set(masukList.map(getNamaPencatat))).sort(), [masukList]);
  const exportRows = useMemo(() => filteredMasukList.map((item) => ({
    ...item,
    nama_pencatat: getNamaPencatat(item),
  })), [filteredMasukList]);
  const getExportName = () => getFilteredExportFileName("Tools_Masuk", namaFilter);
  const handleExportPdf = () => exportToPDF(exportRows, EXPORT_COLUMNS, getExportName(), "Tools Masuk");
  const handleExportExcel = () => exportToExcel(exportRows, EXPORT_COLUMNS, getExportName(), "Tools Masuk");

  const loadTools = async () => {
    setLoadingTools(true);
    try {
      const data = await getTools();
      setTools(data);
    } catch {
      setErrorMsg("Gagal memuat data alat untuk pilihan Kode Barang.");
    } finally {
      setLoadingTools(false);
    }
  };

  const loadMasukList = async () => {
    setLoadingList(true);
    try {
      const data = await getToolMasuk();
      setMasukList(data);
    } catch {
      setErrorMsg("Gagal memuat riwayat alat masuk.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadTools();
    loadMasukList();
  }, []);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: ToolMasukType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeleteModal = (item: ToolMasukType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values: ToolMasukFormValues & { peminta_id?: string }) => {
    setFormError(null);
    try {
      if (activeItem) {
        const updated = await updateToolMasuk(activeItem.id, {
          tanggal: values.tanggal,
          jumlah_masuk: values.jumlah_masuk,
          keterangan: values.keterangan,
        });
        setMasukList((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
        await loadTools();
      } else {
        // 1. Pastikan id_card atau peminta_id terisi dari hasil tap kartu
        const idCardValue = values.peminta_id || values.id_card;
        if (!idCardValue) {
          throw new Error("ID Card wajib di-tap untuk verifikasi.");
        }

        // 2. VALIDASI ROLE SEBELUM SUBMIT
        const pegawaiAktif = await getPemintaAktif();
        const pegawaiTerkait = pegawaiAktif.find((p) => p.id === idCardValue);

        if (!pegawaiTerkait) {
          throw new Error("Pegawai dengan ID tersebut tidak ditemukan atau sedang tidak aktif.");
        }

        if (pegawaiTerkait.role !== "inventory man") {
          throw new Error("Akses Ditolak! Hanya Inventory Man yang boleh menginput stok Tools Masuk.");
        }

        // 3. Panggil fungsi create dengan memastikan peminta_id terkirim eksplisit
        const created = await createToolMasuk({
          ...values,
          peminta_id: idCardValue,
        });

        setMasukList((prev) => [created, ...prev]);

        // refresh Data Tools supaya stok yang tampil di halaman lain akurat
        await loadTools();

        setSuccessMessage(
          `Berhasil menambah ${values.jumlah_masuk} unit "${values.nama_barang}" ke Data Tools.`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
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
      await deleteToolMasuk(activeItem.id);
      setMasukList((prev) => prev.filter((m) => m.id !== activeItem.id));
      // stok Data Tools otomatis disesuaikan balik oleh backend,
      // refresh supaya halaman lain (Data Tools) tetap akurat
      await loadTools();
    } catch {
      setErrorMsg("Gagal menghapus data tools masuk.");
    } finally {
      setDeleteModalOpen(false);
      setActiveItem(null);
    }
  };

  const columns = useMemo(
    () =>
      getToolMasukColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
  );

  return (
    <div className="toolsmasuk-page">
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
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
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
              <h1 className="mb-2 h2">Tools Masuk</h1>
              <p className="text-secondary mb-0">
                Mencatat alat yang masuk.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingTools}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Toolbar: Search ---- */}
        <div className="riwayat-toolbar border-bottom">
          <div className="riwayat-toolbar-row">
            <InputGroup className="riwayat-search">
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode, nama, merk, atau tipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari tools masuk"
              />
              {searchTerm && (
                <Button
                  variant="link"
                  className="riwayat-search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Bersihkan pencarian"
                >
                  <IconX size={16} />
                </Button>
              )}
            </InputGroup>
            <span className="riwayat-info text-secondary small">
              Menampilkan{" "}
              <span className="fw-semibold text-body">{filteredMasukList.length}</span>{" "}
              dari {masukList.length} data
            </span>
          </div>
          <RiwayatFilterBar
            bulanFilter={bulanFilter}
            onBulanFilterChange={setBulanFilter}
            tahunFilter={tahunFilter}
            onTahunFilterChange={setTahunFilter}
            tahunOptions={tahunOptions}
            namaFilter={namaFilter}
            onNamaFilterChange={setNamaFilter}
            namaOptions={namaOptions}
            namaLabel="Pencatat"
            onExportPDF={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </div>

        <CardBody>
          {loadingList ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : masukList.length === 0 ? (
            /* Empty state: belum ada catatan */
            <div className="toolsmasuk-empty text-center py-6">
              <div className="toolsmasuk-empty-icon mb-3">
                <IconTruckDelivery size={32} />
              </div>
              <h5 className="mb-1">Belum ada catatan alat masuk</h5>
              <p className="text-secondary mb-4">
                Mulai mencatat penambahan stok alat dengan menekan tombol Tambah.
              </p>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingTools}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          ) : filteredMasukList.length === 0 ? (
            /* Empty state: hasil pencarian kosong */
            <div className="toolsmasuk-empty text-center py-6">
              <div className="toolsmasuk-empty-icon mb-3">
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
                <IconX size={18} />
                Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable
              data={filteredMasukList}
              columns={columns}
              pagination
              isSortable
            />
          )}
        </CardBody>
      </Card>

      <ToolMasukFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        toolOptions={tools}
        error={formError}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={activeItem}
      />

      {loadingTools && (
        <div
          className="position-fixed bottom-0 end-0 m-4 bg-white shadow rounded-3 px-3 py-2 d-flex align-items-center gap-2"
          style={{ zIndex: 1050 }}
        >
          <Spinner animation="border" size="sm" />
          <span className="small text-secondary">Memuat data alat...</span>
        </div>
      )}
    </div>
  );
};

export default ToolMasukManager;
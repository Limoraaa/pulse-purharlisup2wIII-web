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
  ConsumableItemType,
  ConsumableMasukType,
  ConsumableMasukFormValues,
} from "types/DataConsumableTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import { exportToExcel, exportToPDF, ExportColumn, getFilteredExportFileName } from "components/ruangtools/riwayat/common/exportUtils";
import { getConsumableMasukColumns } from "components/ruangtools/consumablemasuk/ColumnDefination";
import ConsumableMasukFormModal from "components/ruangtools/consumablemasuk/ConsumableMasukFormModal";
import DeleteConfirmModal from "components/ruangtools/consumablemasuk/DeleteConfirmModal";

import { getConsumables } from "services/consumableService";
import {
  getConsumableMasuk,
  createConsumableMasuk,
  updateConsumableMasuk,
  deleteConsumableMasuk,
} from "services/consumableMasukService";

// IMPORT INI UNTUK VALIDASI ROLE
import { getPemintaAktif } from "services/pemintaService"; 

const ConsumableMasukManager = () => {
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);
  const [loadingConsumables, setLoadingConsumables] = useState(true);

  const [masukList, setMasukList] = useState<ConsumableMasukType[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ConsumableMasukType | null>(null);
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

  const getNamaPencatat = (item: ConsumableMasukType) =>
    item.dicatatOleh?.nama || item.dicatatOleh?.name || "Tidak diketahui";

  const EXPORT_COLUMNS: ExportColumn[] = [
    { header: "Tanggal", key: "tanggal" }, { header: "Kode Barang", key: "kode_barang" },
    { header: "Nama Barang", key: "nama" }, { header: "Jumlah Masuk", key: "jumlah_masuk_export" },
    { header: "Pencatat", key: "nama_pencatat" }, { header: "Keterangan", key: "keterangan" },
  ];

  // Data turunan untuk tampilan; sumber data (masukList) tidak diubah.
  const filteredMasukList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    return masukList.filter((item) => {
      // 1. Filter periode (bulan/tahun)
      const date = parseTanggal(item.tanggal);
      const cocokPeriode = (!date || bulanFilter === 0 || date.getMonth() + 1 === bulanFilter) &&
        (!date || tahunFilter === 0 || date.getFullYear() === tahunFilter);
        
      // 2. Filter nama pencatat
      const cocokNama = namaFilter === "" || getNamaPencatat(item) === namaFilter;
      
      // 3. Filter pencarian teks (mencakup SEMUA kolom di tabel + Null-Safety)
      let cocokKeyword = true;
      if (keyword !== "") {
        const tanggalStr = (item.tanggal || "").toLowerCase();
        const kodeBarang = (item.kode_barang || "").toLowerCase();
        const namaBarang = (item.nama || "").toLowerCase();
        const merk = (item.merk || "").toLowerCase();
        const tipe = (item.tipe || "").toLowerCase();
        // Menggunakan (item as any) untuk properti bawaan dari relasi tabel
        const erE = ((item as any).er_e || "").toLowerCase();
        const ukuran = ((item as any).ukuran || "").toLowerCase();
        const satuan = ((item as any).satuan || "").toLowerCase(); // <-- Pencarian satuan
        const jumlahMasuk = String(item.jumlah_masuk ?? 0);
        const namaPencatat = getNamaPencatat(item).toLowerCase();
        const keterangan = (item.keterangan || "").toLowerCase();

        cocokKeyword =
          tanggalStr.includes(keyword) ||
          kodeBarang.includes(keyword) ||
          namaBarang.includes(keyword) ||
          merk.includes(keyword) ||
          tipe.includes(keyword) ||
          erE.includes(keyword) ||
          ukuran.includes(keyword) ||
          satuan.includes(keyword) || // <-- Pencarian satuan
          jumlahMasuk.includes(keyword) ||
          namaPencatat.includes(keyword) ||
          keterangan.includes(keyword);
      }

      return cocokPeriode && cocokNama && cocokKeyword;
    });
  }, [masukList, searchTerm, bulanFilter, tahunFilter, namaFilter]);

  const tahunOptions = useMemo(() => Array.from(new Set(masukList.map((item) => parseTanggal(item.tanggal)?.getFullYear()).filter((year): year is number => Boolean(year)))).sort((a, b) => b - a), [masukList]);
  const namaOptions = useMemo(() => Array.from(new Set(masukList.map(getNamaPencatat))).sort(), [masukList]);
  
  // Gabungkan jumlah dan satuan untuk Export
  const exportRows = useMemo(() => filteredMasukList.map((item) => ({
    ...item,
    nama_pencatat: getNamaPencatat(item),
    // Buat field khusus export agar rapi "+40 Pcs"
    jumlah_masuk_export: `+${item.jumlah_masuk} ${(item as any).satuan || ''}`.trim(),
  })), [filteredMasukList]);
  
  const getExportName = () => getFilteredExportFileName("Consumable_Masuk", namaFilter);
  const handleExportPdf = () => exportToPDF(exportRows, EXPORT_COLUMNS, getExportName(), "Consumable Masuk");
  const handleExportExcel = () => exportToExcel(exportRows, EXPORT_COLUMNS, getExportName(), "Consumable Masuk");

  const loadConsumables = async () => {
    setLoadingConsumables(true);
    try {
      const data = await getConsumables();
      setConsumables(data);
    } catch {
      setErrorMsg("Gagal memuat data consumable untuk pilihan Kode Barang.");
    }finally {
      setLoadingConsumables(false);
    }
  };

  const loadMasukList = async () => {
    setLoadingList(true);
    try {
      const data = await getConsumableMasuk();
      setMasukList(data);
    } catch {
      setErrorMsg("Gagal memuat riwayat barang masuk.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConsumables();
    loadMasukList();
  }, []);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: ConsumableMasukType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeleteModal = (item: ConsumableMasukType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values: ConsumableMasukFormValues & { peminta_id?: string }) => {
    setFormError(null);
    try {
      if (activeItem) {
          const updated = await (updateConsumableMasuk as any)(activeItem.id, {
            tanggal: values.tanggal,
            jumlah_masuk: values.jumlah_masuk,
            satuan: (values as any).satuan,
            keterangan: values.keterangan,
          });
          setMasukList((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
           await loadConsumables();
      } else {
        // 1. Pastikan id_card atau peminta_id terisi dari hasil tap kartu
        const idCardValue = values.peminta_id || values.id_card;
        if (!idCardValue) {
          throw new Error("ID Card wajib di-tap untuk verifikasi.");
        }

        // 2. VALIDASI ROLE SEBELUM SUBMIT
        // Kita periksa apakah pemilik kartu ini benar-benar punya role "inventory man"
        const pegawaiAktif = await getPemintaAktif();
        const pegawaiTerkait = pegawaiAktif.find((p) => p.id === idCardValue);

        if (!pegawaiTerkait) {
          throw new Error("Pegawai dengan ID tersebut tidak ditemukan atau sedang tidak aktif.");
        }

        if (pegawaiTerkait.role !== "inventory man") {
          throw new Error("Akses Ditolak! Hanya Inventory Man yang boleh menginput stok Consumable Masuk.");
        }

        // 3. Panggil fungsi create dengan memastikan peminta_id terkirim eksplisit
        const created = await createConsumableMasuk({
          ...values,
          peminta_id: idCardValue,
        });
        
        setMasukList((prev) => [created, ...prev]);

        // refresh Data Consumable supaya stok_awal yang tampil di halaman lain akurat
        await loadConsumables();

        setSuccessMessage(
          `Berhasil menambah ${values.jumlah_masuk} ${(values as any).satuan || 'unit'} "${values.nama}" ke Data Consumable.`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) {
      // Tangkap pesan error dari backend atau validasi role
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      setFormError(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteConsumableMasuk(activeItem.id);
      setMasukList((prev) => prev.filter((m) => m.id !== activeItem.id));
      // stok Data Consumable otomatis disesuaikan balik oleh backend,
      // refresh supaya halaman lain (Data Consumable) tetap akurat
      await loadConsumables();
    } catch {
      setErrorMsg("Gagal menghapus data consumable masuk.");
    } finally {
      setDeleteModalOpen(false);
      setActiveItem(null);
    }
  };

  const columns = useMemo(
    () =>
      getConsumableMasukColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
  );

  return (
    <div className="consumablemasuk-page">
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
              <h1 className="mb-2 h2">Consumable Masuk</h1>
              <p className="text-secondary mb-0">
                Mencatat barang Consumable yang masuk.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingConsumables}
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
                  placeholder="Cari kode, nama, er/e, ukuran, satuan, penginput, atau keterangan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari consumable masuk"
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
            <div className="consumablemasuk-empty text-center py-6">
              <div className="consumablemasuk-empty-icon mb-3">
                <IconTruckDelivery size={32} />
              </div>
              <h5 className="mb-1">Belum ada catatan barang masuk</h5>
              <p className="text-secondary mb-4">
                Mulai mencatat penambahan stok consumable dengan menekan tombol Tambah.
              </p>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingConsumables}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          ) : filteredMasukList.length === 0 ? (
            /* Empty state: hasil pencarian kosong */
            <div className="consumablemasuk-empty text-center py-6">
              <div className="consumablemasuk-empty-icon mb-3">
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

      <ConsumableMasukFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        consumableOptions={consumables}
        error={formError}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={activeItem}
      />

      {loadingConsumables && (
        <div
          className="position-fixed bottom-0 end-0 m-4 bg-white shadow rounded-3 px-3 py-2 d-flex align-items-center gap-2"
          style={{ zIndex: 1050 }}
        >
          <Spinner animation="border" size="sm" />
          <span className="small text-secondary">Memuat data consumable...</span>
        </div>
      )}
    </div>
  );
};

export default ConsumableMasukManager;
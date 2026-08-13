"use client";
// import node module libraries
import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  InputGroup,
  Form,
  Button,
} from "react-bootstrap";
import {
  IconCircleCheck,
  IconSearch,
  IconX,
  IconClipboardList,
  IconMoodEmpty,
} from "@tabler/icons-react";
import { createLaporanKerusakan } from "services/laporanKerusakanService";

// import custom types
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

// import services (langsung ke API, data ini tidak perlu dibagi ke halaman lain)
import { getPeminjamanAktif, tandaiDikembalikan } from "services/peminjamanService";

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getPeminjamanAktifColumns } from "components/ruangtools/peminjamanaktif/ColumnDefination";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import FormPengembalianModal, {
  PengembalianSubmitPayload,
} from "components/ruangtools/peminjamanaktif/FormPengembalianModal";

const PeminjamanAktifManager = () => {
  const [items, setItems] = useState<PeminjamanAktifItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PeminjamanAktifItemType | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
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

  const EXPORT_COLUMNS: ExportColumn[] = [
    { header: "Tanggal", key: "tanggal" }, { header: "Kode Barang", key: "kodeBarang" },
    { header: "Nama Barang", key: "namaBarang" }, { header: "Jumlah", key: "jumlah" },
    { header: "Nama Peminjam", key: "namaPeminjam" }, { header: "Divisi", key: "divisi" },
    { header: "Area Kerja", key: "areaKerja" },
  ];

  // Data turunan untuk tampilan; sumber data (items) tidak diubah.
  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const date = parseTanggal(item.tanggal);
      const cocokPeriode = (!date || bulanFilter === 0 || date.getMonth() + 1 === bulanFilter) &&
        (!date || tahunFilter === 0 || date.getFullYear() === tahunFilter);
      const cocokNama = namaFilter === "" || item.namaPeminjam === namaFilter;
      const cocokKeyword =
        item.kodeBarang.toLowerCase().includes(keyword) ||
        item.namaBarang.toLowerCase().includes(keyword) ||
        item.namaPeminjam.toLowerCase().includes(keyword) ||
        item.namaPekerjaan.toLowerCase().includes(keyword) ||
        item.areaKerja.toLowerCase().includes(keyword);
      return cocokPeriode && cocokNama && (keyword === "" || cocokKeyword);
    });
  }, [items, searchTerm, bulanFilter, tahunFilter, namaFilter]);

  const tahunOptions = useMemo(() => Array.from(new Set(items.map((item) => parseTanggal(item.tanggal)?.getFullYear()).filter((year): year is number => Boolean(year)))).sort((a, b) => b - a), [items]);
  const namaOptions = useMemo(() => Array.from(new Set(items.map((item) => item.namaPeminjam))).sort(), [items]);
  const exportRows = useMemo(() => filteredItems.map((item) => ({ ...item })), [filteredItems]);
  const handleExportPdf = () => exportToPDF(exportRows, EXPORT_COLUMNS, "peminjaman-aktif", "Peminjaman Aktif");
  const handleExportExcel = () => exportToExcel(exportRows, EXPORT_COLUMNS, "peminjaman-aktif", "Peminjaman Aktif");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeminjamanAktif();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data peminjaman aktif";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---- buka form pengembalian untuk 1 alat ----
  const handleOpenPengembalian = (item: PeminjamanAktifItemType) => {
    setActiveItem(item);
    setReturnModalOpen(true);
  };

  // ---- submit form pengembalian ----
  const handleReturnSubmit = async (payload: PengembalianSubmitPayload) => {
    if (!activeItem) return;

    setReturningId(activeItem.id);
    try {
      await tandaiDikembalikan(activeItem.id);

     if (payload.kerusakan.length > 0) {
        const dicatatOleh = localStorage.getItem("userId");
        if (!dicatatOleh) {
          throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
        }

        for (const entry of payload.kerusakan) {
          await createLaporanKerusakan({
            tanggal: new Date().toISOString(),
            tool_id: activeItem.toolId,
            peminjaman_id: activeItem.id,
            jumlah: entry.jumlah,
            keterangan: entry.catatan,
            status: entry.jenisKerusakan,
            dilaporkan_oleh: dicatatOleh,
          });
        }
      }
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      setReturnModalOpen(false);
      setActiveItem(null);

      const totalRusak = payload.kerusakan.reduce((sum, k) => sum + k.jumlah, 0);
      setSuccessMessage(
        `${activeItem.namaBarang} (${activeItem.kodeBarang}) berhasil ditandai dikembalikan${
          totalRusak > 0 ? ` (${totalRusak} unit rusak, stok dikurangi)` : ""
        }.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memproses pengembalian";
      alert(message);
    } finally {
      setReturningId(null);
    }
  };

  const columns = useMemo(
    () => getPeminjamanAktifColumns({ onOpenPengembalian: handleOpenPengembalian, returningId }),
    [returningId]
  );

  return (
    <div className="peminjamanaktif-page">
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
              <h1 className="mb-2 h2">Peminjaman Aktif</h1>
              <p className="text-secondary mb-0">
                Menampilkan seluruh alat yang masih dipinjam dan belum dikembalikan.
              </p>
              <DasherBreadcrumb />
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
                  placeholder="Cari peminjam, kode barang, nama barang, atau area kerja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari peminjaman aktif"
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
                <span className="fw-semibold text-body">{filteredItems.length}</span>{" "}
                dari {items.length} data
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
            namaLabel="Peminjam"
            onExportPDF={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : items.length === 0 ? (
            /* Empty state: tidak ada peminjaman aktif */
            <div className="peminjamanaktif-empty text-center py-6">
              <div className="peminjamanaktif-empty-icon mb-3">
                <IconClipboardList size={32} />
              </div>
              <h5 className="mb-1">Tidak ada peminjaman aktif</h5>
              <p className="text-secondary mb-0">
                Semua alat sudah dikembalikan. Peminjaman baru akan muncul di sini.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty state: hasil pencarian kosong */
            <div className="peminjamanaktif-empty text-center py-6">
              <div className="peminjamanaktif-empty-icon mb-3">
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
              data={filteredItems}
              columns={columns}
              pagination
              isSortable
            />
          )}
        </CardBody>
      </Card>

      <FormPengembalianModal
        show={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setActiveItem(null);
        }}
        item={activeItem}
        onSubmit={handleReturnSubmit}
        submitting={returningId !== null}
      />
    </div>
  );
};

export default PeminjamanAktifManager;

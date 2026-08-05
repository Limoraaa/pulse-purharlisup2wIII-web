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

  // Data turunan untuk tampilan; sumber data (items) tidak diubah.
  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (keyword === "") return items;
    return items.filter(
      (item) =>
        item.kodeBarang.toLowerCase().includes(keyword) ||
        item.namaBarang.toLowerCase().includes(keyword) ||
        item.namaPeminjam.toLowerCase().includes(keyword) ||
        item.namaPekerjaan.toLowerCase().includes(keyword) ||
        item.areaKerja.toLowerCase().includes(keyword)
    );
  }, [items, searchTerm]);

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
      // 1) tandai peminjaman ini selesai (semua unit fisik sudah kembali)
      await tandaiDikembalikan(activeItem.id);

      // 2) kalau ada unit yang rusak, kurangi stok alat permanen sejumlah itu.
      //    Catatan: teks "catatan" belum tersimpan permanen karena belum
      //    ada tabel riwayat kerusakan di backend -- baru pengurangan stoknya saja.
      if (payload.jumlahRusak > 0) {
      const dicatatOleh = localStorage.getItem("userId");
      if (!dicatatOleh) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      await createLaporanKerusakan({
        tanggal: new Date().toISOString(),
        tool_id: activeItem.toolId,
        peminjaman_id: activeItem.id,
        jumlah: payload.jumlahRusak,
        keterangan: payload.catatan,
        status: payload.jenisKerusakan as "bisa_diperbaiki" | "rusak_permanen",   // ← tambahkan
        dilaporkan_oleh: dicatatOleh,
      });
    }
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      setReturnModalOpen(false);
      setActiveItem(null);

      setSuccessMessage(
        `${activeItem.namaBarang} (${activeItem.kodeBarang}) berhasil ditandai dikembalikan${
          payload.jumlahRusak > 0 ? ` (${payload.jumlahRusak} unit rusak, stok dikurangi)` : ""
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
        <div className="peminjamanaktif-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={6} md={7}>
              <InputGroup className="peminjamanaktif-search">
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
                    className="peminjamanaktif-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Bersihkan pencarian"
                  >
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={6} md={5} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan{" "}
                <span className="fw-semibold text-body">{filteredItems.length}</span>{" "}
                dari {items.length} data
              </span>
            </Col>
          </Row>
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
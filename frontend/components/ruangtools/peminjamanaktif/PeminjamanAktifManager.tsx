"use client";
// import node module libraries
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Form, Alert, Spinner } from "react-bootstrap";
import { IconCircleCheck } from "@tabler/icons-react";

// import custom types
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

// import services (langsung ke API, data ini tidak perlu dibagi ke halaman lain)
import { getPeminjamanAktif, tandaiDikembalikan } from "services/peminjamanService";
import { kurangiStokTool } from "services/toolService";

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

  // Filter Divisi, opsinya diambil otomatis dari data yang ada
  const [divisiFilter, setDivisiFilter] = useState("Semua");
  const divisiOptions = useMemo(() => {
    const unique = Array.from(new Set(items.map((t) => t.divisi)));
    return ["Semua", ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (divisiFilter === "Semua") return items;
    return items.filter((t) => t.divisi === divisiFilter);
  }, [items, divisiFilter]);

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
        await kurangiStokTool(activeItem.toolId, payload.jumlahRusak);
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
        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="align-items-center g-3 mb-2">
            <Col md={4} sm={6}>
              <Form.Label className="mb-1 small text-secondary">Filter Divisi</Form.Label>
              <Form.Select
                size="sm"
                value={divisiFilter}
                onChange={(e) => setDivisiFilter(e.target.value)}
              >
                {divisiOptions.map((opt) => (
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
              data={filteredItems}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari nama peminjam / kode barang / area kerja..."
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
    </>
  );
};

export default PeminjamanAktifManager;
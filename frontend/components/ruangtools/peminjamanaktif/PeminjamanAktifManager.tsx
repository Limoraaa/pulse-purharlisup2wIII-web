"use client";
// import node module libraries
import { useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Form, Alert } from "react-bootstrap";
import { IconCircleCheck } from "@tabler/icons-react";

// import redux store
import { useAppDispatch, useAppSelector } from "store/store";

// Sesuaikan path ini dengan lokasi file Redux slice Anda
import { prosesPengembalian } from "store/slices/inventoryToolsSlice";
// import custom types
import {
  TransaksiPeminjamanType,
  PengembalianItemInput,
} from "types/DataToolsTypes";

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getPeminjamanAktifColumns } from "components/ruangtools/peminjamanaktif/ColumnDefination";
import DetailTransaksiModal from "components/ruangtools/peminjamanaktif/DetailTransaksiModal";
import FormPengembalianModal from "components/ruangtools/peminjamanaktif/FormPengembalianModal";

const PeminjamanAktifManager = () => {
  const dispatch = useAppDispatch();
  const transaksiList = useAppSelector(
    (state) => state.inventoryTools.transaksiList
  );

  // Halaman ini hanya menampilkan transaksi yang masih berstatus "Sedang Dipinjam"
  const activeTransaksi = useMemo(
    () => transaksiList.filter((t) => t.status === "Sedang Dipinjam"),
    [transaksiList]
  );

  // Filter Divisi, opsinya diambil otomatis dari data yang ada
  const [divisiFilter, setDivisiFilter] = useState("Semua");
  const divisiOptions = useMemo(() => {
    const unique = Array.from(new Set(activeTransaksi.map((t) => t.divisi)));
    return ["Semua", ...unique];
  }, [activeTransaksi]);

  const filteredTransaksi = useMemo(() => {
    if (divisiFilter === "Semua") return activeTransaksi;
    return activeTransaksi.filter((t) => t.divisi === divisiFilter);
  }, [activeTransaksi, divisiFilter]);

  // State modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [activeTransaksiItem, setActiveTransaksiItem] =
    useState<TransaksiPeminjamanType | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openDetailModal = (transaksi: TransaksiPeminjamanType) => {
    setActiveTransaksiItem(transaksi);
    setDetailModalOpen(true);
  };

  // ---- dari Detail Transaksi -> klik "Alat Dikembalikan" ----
  const handleOpenReturnForm = (transaksi: TransaksiPeminjamanType) => {
    setDetailModalOpen(false);
    setActiveTransaksiItem(transaksi);
    setReturnModalOpen(true);
  };

  // ---- submit Form Pengembalian ----
  const handleReturnSubmit = (returns: PengembalianItemInput[]) => {
    if (!activeTransaksiItem) return;

    dispatch(
      prosesPengembalian({ transaksiId: activeTransaksiItem.id, returns })
    );

    setReturnModalOpen(false);
    setActiveTransaksiItem(null);

    setSuccessMessage(
      "Pengembalian berhasil diproses. Data stok & tersedia sudah diperbarui."
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const columns = useMemo(
    () => getPeminjamanAktifColumns({ onDetail: openDetailModal }),
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
                Menampilkan seluruh alat yang masih dipinjam dan belum
                dikembalikan.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <CardBody>
          <Row className="align-items-center g-3 mb-2">
            <Col md={4} sm={6}>
              <Form.Label className="mb-1 small text-secondary">
                Filter Divisi
              </Form.Label>
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

          <TanstackTable
            data={filteredTransaksi}
            columns={columns}
            filter
            pagination
            isSortable
            filterPlaceholder="Cari nama peminjam / area kerja..."
          />
        </CardBody>
      </Card>

      <DetailTransaksiModal
        show={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        transaksi={activeTransaksiItem}
        onReturn={handleOpenReturnForm}
      />
      <FormPengembalianModal
        show={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        transaksi={activeTransaksiItem}
        onSubmit={handleReturnSubmit}
      />
    </>
  );
};

export default PeminjamanAktifManager;

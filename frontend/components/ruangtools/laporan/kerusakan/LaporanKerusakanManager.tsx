"use client";
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
import { IconAlertTriangle, IconSearch, IconX } from "@tabler/icons-react";

import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import {
  exportToExcel,
  exportToPDF,
  ExportColumn,
  getFilteredExportFileName,
} from "components/ruangtools/riwayat/common/exportUtils";
import { getLaporanKerusakanColumns } from "components/ruangtools/laporan/kerusakan/ColumnDefination";
import DetailLaporanModal from "components/ruangtools/laporan/kerusakan/DetailLaporanModal";
import ConfirmActionModal from "components/ruangtools/laporan/kerusakan/ConfirmActionModal";

import { getLaporanKerusakan, repairLaporanKerusakan, tandaiPermanenLaporanKerusakan } from "services/laporanKerusakanService";

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Tgl & Jam Pengembalian", key: "tanggal_pengembalian" },
  { header: "Kode Barang", key: "kode_barang" },
  { header: "Nama Barang", key: "nama_barang" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "Warna", key: "warna" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Jumlah Rusak", key: "jumlah_rusak" },
  { header: "Nama Peminjam", key: "nama_peminjam" },
  { header: "Divisi", key: "divisi" },
  { header: "Nama Pekerjaan", key: "nama_pekerjaan" },
  { header: "Area Kerja", key: "area_kerja" },
  { header: "Keterangan", key: "keterangan" },
];

   const STATUS_ORDER: Record<string, number> = {
    bisa_diperbaiki: 0,
    rusak_permanen: 1,
  };

const LaporanKerusakanManager = () => {
  const [laporanList, setLaporanList] = useState<LaporanKerusakanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLaporanKerusakan();
      setLaporanList(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat laporan kerusakan";
      setError(message);
    } finally {
      setLoading(false);
    }
  };
    const [confirmModal, setConfirmModal] = useState<{
      type: "repair" | "permanen";
      item: LaporanKerusakanType;
    } | null>(null);
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

        const [repairNote, setRepairNote] = useState("");

    const handleRepair = (item: LaporanKerusakanType) => {
      setRepairNote("");
      setConfirmModal({ type: "repair", item });
    };

    const handleTandaiPermanen = (item: LaporanKerusakanType) => {
      setConfirmModal({ type: "permanen", item });
    };

    const handleConfirmAction = async () => {
      if (!confirmModal) return;
      const { type, item } = confirmModal;
      setConfirmSubmitting(true);

      try {
        if (type === "repair") {
          await repairLaporanKerusakan(item.id, repairNote.trim() || undefined);
          // Item tetap ada di laporanList (status berubah jadi selesai_diperbaiki),
          // otomatis hilang dari tampilan lewat filteredList di atas.
          setLaporanList((prev) =>
            prev.map((l) => (l.id === item.id ? { ...l, status: "selesai_diperbaiki" as const } : l))
          );
          setSuccessMessage(`${item.nama_barang} berhasil ditandai selesai diperbaiki, stok telah dikembalikan.`);
        } else {
          await tandaiPermanenLaporanKerusakan(item.id);
          setLaporanList((prev) =>
            prev.map((l) => (l.id === item.id ? { ...l, status: "rusak_permanen" as const } : l))
          );
          setSuccessMessage(`${item.nama_barang} ditandai sebagai Rusak Permanen.`);
        }
        setTimeout(() => setSuccessMessage(null), 5000);
        setConfirmModal(null);
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : type === "repair"
            ? "Gagal memproses repair alat"
            : "Gagal menandai laporan sebagai rusak permanen"
        );
      } finally {
        setConfirmSubmitting(false);
      }
    };

  useEffect(() => {
    loadData();
  }, []);

  const [bulanFilter, setBulanFilter] = useState(0);
  const [tahunFilter, setTahunFilter] = useState(0);
  const [namaFilter, setNamaFilter] = useState("Semua");

  // ---- Pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");

  const parseTanggal = (str: string) => {
    const bulanMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
      Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
    };
    const match = str.match(/(\d{2}) (\w{3}) (\d{4})/);
    if (!match) return null;
    const [, day, bulanStr, year] = match;
    const month = bulanMap[bulanStr];
    if (month === undefined) return null;
    return new Date(Number(year), month, Number(day));
  };

  const tahunOptions = useMemo(() => {
    const tahunSet = new Set<number>();
    laporanList.forEach((r) => {
      const tanggal = parseTanggal(r.tanggal_pengembalian);
      if (tanggal) tahunSet.add(tanggal.getFullYear());
    });
    return Array.from(tahunSet).sort((a, b) => b - a);
  }, [laporanList]);

  const namaOptions = useMemo(() => {
    const namaSet = new Set(laporanList.map((r) => r.nama_peminjam));
    return Array.from(namaSet).sort();
  }, [laporanList]);

   const repairCountByKode = useMemo(() => {
    const map: Record<string, number> = {};
    laporanList.forEach((l) => {
      if (l.status === "selesai_diperbaiki") {
        map[l.kode_barang] = (map[l.kode_barang] ?? 0) + 1;
      }
    });
    return map;
  }, [laporanList]);

  const filteredList = useMemo(() => {
  const keyword = searchTerm.trim().toLowerCase();

  return laporanList
    .filter((r) => {
      // Halaman ini cuma untuk laporan yang masih perlu ditindaklanjuti.
      if (r.status === "selesai_diperbaiki") return false;

      if (bulanFilter !== 0 || tahunFilter !== 0) {
        const tanggal = parseTanggal(r.tanggal_pengembalian);

        if (tanggal) {
          if (bulanFilter !== 0 && tanggal.getMonth() + 1 !== bulanFilter)
            return false;

          if (tahunFilter !== 0 && tanggal.getFullYear() !== tahunFilter)
            return false;
        }
      }

      // Filter nama peminjam
      if (namaFilter !== "Semua" && r.nama_peminjam !== namaFilter)
        return false;

      // Filter pencarian
      if (keyword !== "") {
        const cocok =
          r.kode_barang.toLowerCase().includes(keyword) ||
          r.nama_barang.toLowerCase().includes(keyword) ||
          r.nama_peminjam.toLowerCase().includes(keyword);

        if (!cocok) return false;
      }

      return true;
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}, [
  laporanList,
  bulanFilter,
  tahunFilter,
  namaFilter,
  searchTerm,
]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<LaporanKerusakanType | null>(null);

  const openDetailModal = (item: LaporanKerusakanType) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Laporan_Kerusakan_Alat", namaFilter), "Laporan Kerusakan Alat");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Laporan_Kerusakan_Alat", namaFilter));

  const columns = getLaporanKerusakanColumns({
  onDetail: openDetailModal,
  onRepair: handleRepair,
  onTandaiPermanen: handleTandaiPermanen,   // ← tambahkan
});

  return (
    <div className="riwayat-page">
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Laporan Kerusakan Alat</h1>
              <p className="text-secondary mb-0">
                Menampilkan seluruh data alat yang mengalami kerusakan berdasarkan hasil pengembalian dari proses peminjaman.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <div className="riwayat-toolbar border-bottom">
          <div className="riwayat-toolbar-row">
            <InputGroup className="riwayat-search">
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode, nama barang, atau nama peminjam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari laporan kerusakan"
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
              <span className="fw-semibold text-body">{filteredList.length}</span>{" "}
              dari {laporanList.length} data
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
            namaLabel="Nama Peminjam"
            onExportPDF={handleExportPDF}
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
          ) : laporanList.length === 0 ? (
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconAlertTriangle size={32} />
              </div>
              <h5 className="mb-1">Belum ada laporan kerusakan</h5>
              <p className="text-secondary mb-0">
                Kerusakan alat yang tercatat saat pengembalian akan muncul di sini.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconAlertTriangle size={32} />
              </div>
              <h5 className="mb-1">Tidak ada data yang cocok</h5>
              <p className="text-secondary mb-0">
                Coba ubah kata kunci pencarian atau filter bulan/tahun.
              </p>
            </div>
          ) : (
            <TanstackTable
              data={filteredList}
              columns={columns}
              pagination
              isSortable
            />
          )}
        </CardBody>
      </Card>

     <DetailLaporanModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} item={activeItem} />

      {confirmModal && (
        <ConfirmActionModal
          show={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmAction}
          submitting={confirmSubmitting}
          variant={confirmModal.type === "repair" ? "success" : "danger"}
          title={
            confirmModal.type === "repair"
              ? "Tandai Sudah Diperbaiki?"
              : "Tandai Rusak Permanen?"
          }
          message={
            confirmModal.type === "repair"
              ? `"${confirmModal.item.nama_barang}" akan ditandai selesai diperbaiki dan stok alat otomatis dikembalikan. Riwayatnya bisa dilihat di menu Riwayat > Riwayat Perbaikan.`
              : `"${confirmModal.item.nama_barang}" tidak akan bisa diperbaiki lagi. Opsi Repair untuk laporan ini akan hilang.`
          }
                    confirmLabel={confirmModal.type === "repair" ? "Ya, Sudah Diperbaiki" : "Ya, Rusak Permanen"}
          showNoteInput={confirmModal.type === "repair"}
          noteValue={repairNote}
          onNoteChange={setRepairNote}
          warningText={
            confirmModal.type === "repair" && (repairCountByKode[confirmModal.item.kode_barang] ?? 0) >= 2
              ? `Alat ini sudah diperbaiki ${repairCountByKode[confirmModal.item.kode_barang]}x sebelumnya. Ini akan menjadi perbaikan ke-${
                  (repairCountByKode[confirmModal.item.kode_barang] ?? 0) + 1
                }. Untuk alat seperti mesin/gerinda yang umumnya hanya bisa diperbaiki maksimal 3x, pertimbangkan menandai Rusak Permanen jika kerusakan berulang.`
              : undefined
          }
        />
      )}
    </div>
  );
};

export default LaporanKerusakanManager;

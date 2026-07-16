"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Alert, Spinner } from "react-bootstrap";

import {
  RiwayatPeminjamanType,
  RiwayatPeminjamanFormValues,
} from "types/RiwayatTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import KeteranganModal from "components/ruangtools/riwayat/common/KeteranganModal";
import { getRiwayatPeminjamanColumns } from "components/ruangtools/riwayat/peminjaman/ColumnDefination";
import DetailTransaksiModal from "components/ruangtools/riwayat/peminjaman/DetailTransaksiModal";
import EditRiwayatModal from "components/ruangtools/riwayat/peminjaman/EditRiwayatModal";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";

import { getRiwayatPeminjaman } from "services/peminjamanService";

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Nomor Transaksi", key: "nomor_transaksi" },
  { header: "Tanggal Pinjam", key: "tanggal_pinjam" },
  { header: "Tanggal Kembali", key: "tanggal_kembali" },
  { header: "Kode Barang", key: "kode_barang" },
  { header: "Nama Barang", key: "nama_barang" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "Warna", key: "warna" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Nama Peminjam", key: "nama_peminjam" },
  { header: "Divisi", key: "divisi" },
  { header: "Area Kerja", key: "area_kerja" },
];

const RiwayatPeminjamanManager = () => {
  const [riwayatList, setRiwayatList] = useState<RiwayatPeminjamanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRiwayatPeminjaman();
      setRiwayatList(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat riwayat peminjaman";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---- Filter Bulan & Tahun ----
  const [bulanFilter, setBulanFilter] = useState(0);
  const [tahunFilter, setTahunFilter] = useState(0);

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
    riwayatList.forEach((r) => {
      const tanggal = parseTanggal(r.tanggal_pinjam);
      if (tanggal) tahunSet.add(tanggal.getFullYear());
    });
    return Array.from(tahunSet).sort((a, b) => b - a);
  }, [riwayatList]);

  const filteredList = useMemo(() => {
    return riwayatList.filter((r) => {
      if (bulanFilter === 0 && tahunFilter === 0) return true;
      const tanggal = parseTanggal(r.tanggal_pinjam);
      if (!tanggal) return true;
      if (bulanFilter !== 0 && tanggal.getMonth() + 1 !== bulanFilter) return false;
      if (tahunFilter !== 0 && tanggal.getFullYear() !== tahunFilter) return false;
      return true;
    });
  }, [riwayatList, bulanFilter, tahunFilter]);

  // ---- Modals ----
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [keteranganModalOpen, setKeteranganModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RiwayatPeminjamanType | null>(null);
  const [detailGroupItems, setDetailGroupItems] = useState<RiwayatPeminjamanType[]>([]);

  const openDetailModal = (item: RiwayatPeminjamanType) => {
    const group = riwayatList.filter(
      (r) => r.nomor_transaksi === item.nomor_transaksi
    );
    setDetailGroupItems(group);
    setDetailModalOpen(true);
  };

  const openEditModal = (item: RiwayatPeminjamanType) => {
    setActiveItem(item);
    setEditModalOpen(true);
  };

  const openKeteranganModal = (item: RiwayatPeminjamanType) => {
    setActiveItem(item);
    setKeteranganModalOpen(true);
  };

  // Catatan: form ini masih mengubah state lokal saja (belum PUT ke API),
  // karena field yang bisa diedit (area_kerja dll) belum dipetakan ke endpoint
  // update /peminjaman/{id}. Bisa disambungkan nanti kalau memang dibutuhkan.
  const handleEditSubmit = (values: RiwayatPeminjamanFormValues) => {
    if (activeItem) {
      setRiwayatList((prev) =>
        prev.map((r) => (r.id === activeItem.id ? { ...r, ...values } : r))
      );
    }
    setEditModalOpen(false);
    setActiveItem(null);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, "riwayat-peminjaman-tools", "Riwayat Peminjaman Tools");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, "riwayat-peminjaman-tools");

  const columns = getRiwayatPeminjamanColumns({
  onEdit: openEditModal,
  onDetail: openDetailModal,
  onLihatKeterangan: openKeteranganModal,
});

  return (
    <>
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Riwayat Peminjaman Tools</h1>
              <p className="text-secondary mb-0">
                Menampilkan riwayat seluruh transaksi peminjaman tools yang telah dikembalikan.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          <RiwayatFilterBar
            bulanFilter={bulanFilter}
            onBulanFilterChange={setBulanFilter}
            tahunFilter={tahunFilter}
            onTahunFilterChange={setTahunFilter}
            tahunOptions={tahunOptions}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : (
            <TanstackTable
              data={filteredList}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari nomor transaksi / nama barang..."
            />
          )}
        </CardBody>
      </Card>

      <DetailTransaksiModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} items={detailGroupItems} />
      <EditRiwayatModal
        show={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setActiveItem(null);
        }}
        onSubmit={handleEditSubmit}
        item={activeItem}
      />
      <KeteranganModal
        show={keteranganModalOpen}
        onClose={() => setKeteranganModalOpen(false)}
        title={`Keterangan — ${activeItem?.nama_barang ?? ""}`}
        keterangan={activeItem?.keterangan ?? ""}
      />
    </>
  );
};

export default RiwayatPeminjamanManager;
"use client";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Alert, Spinner } from "react-bootstrap";

import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import {
  exportToExcel,
  exportToPDF,
  ExportColumn,
} from "components/ruangtools/riwayat/common/exportUtils";
import { getLaporanKerusakanColumns } from "components/ruangtools/laporan/kerusakan/ColumnDefination";
import DetailLaporanModal from "components/ruangtools/laporan/kerusakan/DetailLaporanModal";

import { getLaporanKerusakan } from "services/laporanKerusakanService";

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
  { header: "Area Kerja", key: "area_kerja" },
  { header: "Keterangan", key: "keterangan" },
];

const LaporanKerusakanManager = () => {
  const [laporanList, setLaporanList] = useState<LaporanKerusakanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadData();
  }, []);

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
    laporanList.forEach((r) => {
      const tanggal = parseTanggal(r.tanggal_pengembalian);
      if (tanggal) tahunSet.add(tanggal.getFullYear());
    });
    return Array.from(tahunSet).sort((a, b) => b - a);
  }, [laporanList]);

  const filteredList = useMemo(() => {
    return laporanList.filter((r) => {
      if (bulanFilter === 0 && tahunFilter === 0) return true;
      const tanggal = parseTanggal(r.tanggal_pengembalian);
      if (!tanggal) return true;
      if (bulanFilter !== 0 && tanggal.getMonth() + 1 !== bulanFilter) return false;
      if (tahunFilter !== 0 && tanggal.getFullYear() !== tahunFilter) return false;
      return true;
    });
  }, [laporanList, bulanFilter, tahunFilter]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<LaporanKerusakanType | null>(null);

  const openDetailModal = (item: LaporanKerusakanType) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, "laporan-kerusakan-alat", "Laporan Kerusakan Alat");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, "laporan-kerusakan-alat");

  const columns = useMemo(() => getLaporanKerusakanColumns({ onDetail: openDetailModal }), []);

  return (
    <>
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
              filterPlaceholder="Cari kode / nama barang / nama peminjam..."
            />
          )}
        </CardBody>
      </Card>

      <DetailLaporanModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} item={activeItem} />
    </>
  );
};

export default LaporanKerusakanManager;
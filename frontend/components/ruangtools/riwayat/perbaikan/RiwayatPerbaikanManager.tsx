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
import { IconTools, IconSearch, IconX } from "@tabler/icons-react";

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
import { getRiwayatPerbaikanColumns } from "components/ruangtools/riwayat/perbaikan/ColumnDefination";
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
  { header: "Jumlah Diperbaiki", key: "jumlah_rusak" },
  { header: "Nama Peminjam", key: "nama_peminjam" },
  { header: "Divisi", key: "divisi" },
  { header: "Nama Pekerjaan", key: "nama_pekerjaan" },
  { header: "Area Kerja", key: "area_kerja" },
  { header: "Keterangan", key: "keterangan" },
];

const RiwayatPerbaikanManager = () => {
  const [riwayatList, setRiwayatList] = useState<LaporanKerusakanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLaporanKerusakan();
      // Halaman ini khusus yang statusnya sudah selesai diperbaiki.
      setRiwayatList(data.filter((item) => item.status === "selesai_diperbaiki"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat riwayat perbaikan";
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
  const [namaFilter, setNamaFilter] = useState("");
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
    riwayatList.forEach((r) => {
      const tanggal = parseTanggal(r.tanggal_pengembalian);
      if (tanggal) tahunSet.add(tanggal.getFullYear());
    });
    return Array.from(tahunSet).sort((a, b) => b - a);
  }, [riwayatList]);

  const namaOptions = useMemo(() => {
    const namaSet = new Set(riwayatList.map((r) => r.nama_peminjam));
    return Array.from(namaSet).sort();
  }, [riwayatList]);

  const filteredList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return riwayatList.filter((r) => {
      if (bulanFilter !== 0 || tahunFilter !== 0) {
        const tanggal = parseTanggal(r.tanggal_pengembalian);
        if (tanggal) {
          if (bulanFilter !== 0 && tanggal.getMonth() + 1 !== bulanFilter) return false;
          if (tahunFilter !== 0 && tanggal.getFullYear() !== tahunFilter) return false;
        }
      }

      if (namaFilter !== "" && r.nama_peminjam !== namaFilter) return false;

      if (keyword !== "") {
        const cocok =
          r.kode_barang.toLowerCase().includes(keyword) ||
          r.nama_barang.toLowerCase().includes(keyword) ||
          r.nama_peminjam.toLowerCase().includes(keyword);
        if (!cocok) return false;
      }

      return true;
    });
  }, [riwayatList, bulanFilter, tahunFilter, namaFilter, searchTerm]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<LaporanKerusakanType | null>(null);

  const openDetailModal = (item: LaporanKerusakanType) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Riwayat_Perbaikan_Alat", namaFilter), "Riwayat Perbaikan Alat");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Riwayat_Perbaikan_Alat", namaFilter));

  const columns = getRiwayatPerbaikanColumns({
    onDetail: openDetailModal,
  });

  return (
    <div className="riwayat-page">
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Riwayat Perbaikan Alat</h1>
              <p className="text-secondary mb-0">
                Menampilkan seluruh alat yang sudah selesai diperbaiki.
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
                aria-label="Cari riwayat perbaikan"
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
              dari {riwayatList.length} data
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
          ) : riwayatList.length === 0 ? (
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconTools size={32} />
              </div>
              <h5 className="mb-1">Belum ada riwayat perbaikan</h5>
              <p className="text-secondary mb-0">
                Alat yang selesai diperbaiki dari Laporan Kerusakan akan muncul di sini.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconTools size={32} />
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
    </div>
  );
};

export default RiwayatPerbaikanManager;
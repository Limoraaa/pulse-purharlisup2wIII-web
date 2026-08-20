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
import { IconHistory, IconSearch, IconX } from "@tabler/icons-react";

import {
  RiwayatConsumableKeluarType,
  RiwayatConsumableKeluarFormValues,
} from "types/RiwayatTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangtools/riwayat/common/RiwayatFilterBar";
import KeteranganModal from "components/ruangtools/riwayat/common/KeteranganModal";
import { getRiwayatConsumableKeluarColumns } from "components/ruangtools/riwayat/consumablekeluar/ColumnDefination";
import DetailTransaksiModal from "components/ruangtools/riwayat/consumablekeluar/DetailTransaksiModal";
import EditRiwayatModal from "components/ruangtools/riwayat/consumablekeluar/EditRiwayatModal";
import { exportToExcel, exportToPDF, ExportColumn, getFilteredExportFileName } from "components/ruangtools/riwayat/common/exportUtils";

import { getRiwayatConsumableKeluar } from "services/consumableKeluarService";

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Tanggal Pengambilan", key: "tanggal_pengambilan" },
  { header: "Kode Barang", key: "kode_barang" },
  { header: "Nama Barang", key: "nama_barang" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "ER/E", key: "er_e" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Nama Peminta", key: "nama_peminta" },
  { header: "Divisi", key: "divisi" },
  { header: "Nama Pekerjaan", key: "nama_pekerjaan" },
  { header: "Area Kerja", key: "area_kerja" },
  { header: "Keterangan", key: "keterangan" },
];

const RiwayatConsumableKeluarManager = () => {
  const [riwayatList, setRiwayatList] = useState<RiwayatConsumableKeluarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRiwayatConsumableKeluar();
      setRiwayatList(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat riwayat pengambilan bahan";
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
    riwayatList.forEach((r) => {
      const tanggal = parseTanggal(r.tanggal_pengambilan);
      if (tanggal) tahunSet.add(tanggal.getFullYear());
    });
    return Array.from(tahunSet).sort((a, b) => b - a);
  }, [riwayatList]);

  const namaOptions = useMemo(() => {
    const namaSet = new Set(riwayatList.map((r) => r.nama_peminta));
    return Array.from(namaSet).sort();
  }, [riwayatList]);

  const filteredList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    return riwayatList.filter((r) => {
      // 1. Filter periode (bulan/tahun)
      if (bulanFilter !== 0 || tahunFilter !== 0) {
        const tanggal = parseTanggal(r.tanggal_pengambilan);
        if (tanggal) {
          if (bulanFilter !== 0 && tanggal.getMonth() + 1 !== bulanFilter) return false;
          if (tahunFilter !== 0 && tanggal.getFullYear() !== tahunFilter) return false;
        }
      }
      
      // 2. Filter nama peminta (dari dropdown FilterBar)
      if (namaFilter !== "Semua" && r.nama_peminta !== namaFilter) return false;
      
      // 3. Filter pencarian teks (Diperluas ke SEMUA kolom tabel + Null-Safety)
      if (keyword !== "") {
        const tglPengambilan = (r.tanggal_pengambilan || "").toLowerCase();
        const noTransaksi = (r.nomor_transaksi || "").toLowerCase();
        const kodeBarang = (r.kode_barang || "").toLowerCase();
        const namaBarang = (r.nama_barang || "").toLowerCase();
        const merk = (r.merk || "").toLowerCase();
        const tipe = (r.tipe || "").toLowerCase();
        const erE = (r.er_e || "").toLowerCase();
        const ukuran = (r.ukuran || "").toLowerCase();
        const jumlah = String(r.jumlah ?? 0);
        const namaPeminta = (r.nama_peminta || "").toLowerCase();
        const divisi = (r.divisi || "").toLowerCase();
        const namaPekerjaan = (r.nama_pekerjaan || "").toLowerCase();
        const areaKerja = (r.area_kerja || "").toLowerCase();
        const keterangan = (r.keterangan || "").toLowerCase();

        const cocok =
          tglPengambilan.includes(keyword) ||
          noTransaksi.includes(keyword) ||
          kodeBarang.includes(keyword) ||
          namaBarang.includes(keyword) ||
          merk.includes(keyword) ||
          tipe.includes(keyword) ||
          erE.includes(keyword) ||
          ukuran.includes(keyword) ||
          jumlah.includes(keyword) ||
          namaPeminta.includes(keyword) ||
          divisi.includes(keyword) ||
          namaPekerjaan.includes(keyword) ||
          areaKerja.includes(keyword) ||
          keterangan.includes(keyword);

        if (!cocok) return false;
      }
      
      return true;
    });
  }, [riwayatList, bulanFilter, tahunFilter, namaFilter, searchTerm]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [keteranganModalOpen, setKeteranganModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RiwayatConsumableKeluarType | null>(null);
  const [detailGroupItems, setDetailGroupItems] = useState<RiwayatConsumableKeluarType[]>([]);

  const openDetailModal = (item: RiwayatConsumableKeluarType) => {
    const group = riwayatList.filter((r) => r.nomor_transaksi === item.nomor_transaksi);
    setDetailGroupItems(group);
    setDetailModalOpen(true);
  };


  const handleEditSubmit = (values: RiwayatConsumableKeluarFormValues) => {
    if (activeItem) {
      setRiwayatList((prev) =>
        prev.map((r) => (r.id === activeItem.id ? { ...r, ...values } : r))
      );
    }
    setEditModalOpen(false);
    setActiveItem(null);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Riwayat_Consumable_Keluar", namaFilter), "Riwayat Consumable Keluar");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Riwayat_Consumable_Keluar", namaFilter));

  const columns = getRiwayatConsumableKeluarColumns({
  onDetail: openDetailModal,
});
  
  return (
    <div className="riwayat-page">
      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Riwayat Consumable Keluar</h1>
              <p className="text-secondary mb-0">
                Menampilkan riwayat pengambilan barang consumable.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Toolbar: Search + Info (baris 1) & Filter + Export (baris 2) ---- */}
        <div className="riwayat-toolbar border-bottom">
          {/* Baris 1: Search (kiri) + Info jumlah data (kanan) */}
          <div className="riwayat-toolbar-row">
            <InputGroup className="riwayat-search">
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="kode barang, nama barang, atau peminta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari riwayat consumable keluar"
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

          {/* Baris 2: Filter Bulan/Tahun (kiri) + Export PDF/Excel (kanan) */}
          <RiwayatFilterBar
            bulanFilter={bulanFilter}
            onBulanFilterChange={setBulanFilter}
            tahunFilter={tahunFilter}
            onTahunFilterChange={setTahunFilter}
            tahunOptions={tahunOptions}
            namaFilter={namaFilter}
            onNamaFilterChange={setNamaFilter}
            namaOptions={namaOptions}
            namaLabel="Nama Peminta"
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
            /* Empty state: belum ada riwayat sama sekali */
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconHistory size={32} />
              </div>
              <h5 className="mb-1">Belum ada riwayat pengambilan</h5>
              <p className="text-secondary mb-0">
                Transaksi pengambilan consumable akan muncul di sini.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            /* Empty state: hasil pencarian / filter kosong */
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconHistory size={32} />
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
    </div>
  );
};

export default RiwayatConsumableKeluarManager;

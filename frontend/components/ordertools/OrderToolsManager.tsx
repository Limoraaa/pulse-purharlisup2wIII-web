'use client';
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Alert, Spinner, InputGroup, Form, Button } from "react-bootstrap";
import { IconCircleCheck, IconSearch, IconX, IconClipboardList, IconShoppingCart } from "@tabler/icons-react";
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import OrderToolsFormModal from './OrderToolsFormModal';
import { getOrderTools, updateOrderToolsStatus } from '/services/orderToolsService';

// IMPORT UTILITY EXPORT BAWAAN
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";

interface OrderData {
  id: number;
  peminta?: { nama: string };
  nama_barang: string;
  spesifikasi: string;
  merek: string;
  jumlah: number;
  satuan: string;
  harga: number;
  referensi_harga: string;
  tanggal_pengajuan: string;
  tanggal_kedatangan: string | null;
  status_pembelian: string;
}

// DEFINISI KOLOM UNTUK EXPORT
const EXPORT_COLUMNS_ORDER: ExportColumn[] = [
  { header: "No", key: "no" },
  { header: "Tgl Pengajuan", key: "tanggal_pengajuan" },
  { header: "Pengusul", key: "nama_pengusul" },
  { header: "Nama Barang", key: "nama_barang" },
  { header: "Spesifikasi", key: "spesifikasi" },
  { header: "Merek", key: "merek" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Satuan", key: "satuan" },
  { header: "Estimasi Harga", key: "harga" },
  { header: "Referensi Harga", key: "referensi_harga" },
  { header: "Status", key: "status_pembelian" },
  { header: "Tgl Kedatangan", key: "tanggal_kedatangan" },
];

export default function OrderToolsManager() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderTools();
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMarkAsBought = async (id: number) => {
    try {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');

      await updateOrderToolsStatus(id, 'sudah dibeli', localISOTime);
      setSuccessMessage("Barang telah ditandai sudah dibeli beserta waktu kedatangannya.");
      fetchOrders();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate status");
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((item) => {
      return (
        item.nama_barang.toLowerCase().includes(keyword) ||
        item.merek.toLowerCase().includes(keyword) ||
        (item.peminta?.nama || "").toLowerCase().includes(keyword)
      );
    });
  }, [orders, searchTerm]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- FUNGSI EXPORT PDF & EXCEL ---
  const handleExportPDF = () => {
    const dataToExport = filteredOrders.map((order, index) => ({
      ...order,
      no: index + 1,
      nama_pengusul: order.peminta?.nama || 'Data Terhapus',
      tanggal_pengajuan: formatDateTime(order.tanggal_pengajuan),
      tanggal_kedatangan: order.status_pembelian === 'sudah dibeli' ? formatDateTime(order.tanggal_kedatangan) : '-',
      harga: formatRupiah(order.harga),
      referensi_harga: order.referensi_harga || '-',
    }));

    exportToPDF(
      dataToExport as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS_ORDER,
      "data-order-tools",
      "Laporan Order Tools"
    );
  };

  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map((order, index) => ({
      ...order,
      no: index + 1,
      nama_pengusul: order.peminta?.nama || 'Data Terhapus',
      tanggal_pengajuan: formatDateTime(order.tanggal_pengajuan),
      tanggal_kedatangan: order.status_pembelian === 'sudah dibeli' ? formatDateTime(order.tanggal_kedatangan) : '-',
      harga: order.harga,
      referensi_harga: order.referensi_harga || '-',
    }));

    exportToExcel(
      dataToExport as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS_ORDER,
      "data-order-tools"
    );
  };

  const columns = useMemo(() => [
    {
      header: "No",
      id: "no",
      cell: ({ row }: any) => row.index + 1,
    },
    {
      header: "Pengusul",
      accessorKey: "peminta.nama",
      cell: ({ row }: any) => row.original.peminta?.nama || "Data Terhapus",
    },
    {
      header: "Nama Barang",
      accessorKey: "nama_barang",
      cell: ({ row }: any) => <span className="fw-semibold text-body">{row.original.nama_barang}</span>,
    },
    { header: "Spesifikasi", accessorKey: "spesifikasi" },
    { header: "Merk", accessorKey: "merek" },
    { header: "Jumlah", accessorKey: "jumlah" },
    { header: "Satuan", accessorKey: "satuan" },
    {
      header: "Harga",
      accessorKey: "harga",
      cell: ({ row }: any) => formatRupiah(row.original.harga),
    },
    {
      header: "Referensi Harga",
      accessorKey: "referensi_harga",
      cell: ({ row }: any) => row.original.referensi_harga || "-",
    },
    {
      header: "Status",
      accessorKey: "status_pembelian",
      cell: ({ row }: any) => {
        const status = row.original.status_pembelian;
        return (
          <span className={`badge ${status === 'sudah dibeli' ? 'bg-success' : 'bg-warning'}`}>
            {status}
          </span>
        );
      },
    },
    {
      header: "Tgl Pengajuan",
      accessorKey: "tanggal_pengajuan",
      cell: ({ row }: any) => formatDateTime(row.original.tanggal_pengajuan),
    },
    {
      header: "Tgl Kedatangan",
      accessorKey: "tanggal_kedatangan",
      cell: ({ row }: any) => {
        if (row.original.status_pembelian === 'sudah dibeli') {
          return formatDateTime(row.original.tanggal_kedatangan);
        }
        return <span className="text-secondary">-</span>;
      },
    },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }: any) => {
        const order = row.original;
        if (order.status_pembelian === 'belum dibeli') {
          return (
            <Button variant="success" size="sm" onClick={() => handleMarkAsBought(order.id)}>
              Tandai Dibeli
            </Button>
          );
        }
        return <span className="text-secondary small">-</span>;
      },
    },
  ], []);

  return (
    <div className="order-consumable-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} /> {successMessage}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row className="mb-4">
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Order Tools</h1>
              <p className="text-secondary mb-3">
                Kelola daftar pengajuan dan pemesanan alat tools baru.
              </p>
              <DasherBreadcrumb />
            </div>

            <div className="mt-3 mt-md-0">
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <IconShoppingCart size={18} />
                Buat Order
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <div className="riwayat-toolbar border-bottom p-3">
          <div className="riwayat-toolbar-row d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <InputGroup className="riwayat-search" style={{ maxWidth: "350px" }}>
              <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode barang, nama, merek, atau pengusul..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button variant="link" className="riwayat-search-clear" onClick={() => setSearchTerm("")}>
                  <IconX size={16} />
                </Button>
              )}
            </InputGroup>

            {/* AREA TOMBOL EXPORT DAN INFO DATA */}
            <div className="d-flex align-items-center gap-3">
              <span className="riwayat-info text-secondary small d-none d-sm-block">
                Menampilkan <span className="fw-semibold text-body">{filteredOrders.length}</span> dari {orders.length} data
              </span>
              <div className="d-flex gap-2">
                <Button variant="outline-danger" size="sm" onClick={handleExportPDF}>
                  Export PDF
                </Button>
                <Button variant="outline-success" size="sm" onClick={handleExportExcel}>
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-6">
              <IconClipboardList size={32} className="mb-3 text-secondary" />
              <h5 className="mb-1">Tidak ada data order</h5>
              <p className="text-secondary mb-0">Belum ada pengajuan order tools yang tercatat.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
              <TanstackTable data={filteredOrders} columns={columns} pagination isSortable />
            </div>
          )}
        </CardBody>
      </Card>

      <OrderToolsFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchOrders} />
    </div>
  );
}

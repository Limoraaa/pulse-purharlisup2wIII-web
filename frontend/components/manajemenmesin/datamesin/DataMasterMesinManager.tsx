"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Alert, Badge, Button, Card, CardBody, Col, Form, InputGroup, Row, Spinner } from "react-bootstrap";
import type { ColumnDef } from "@tanstack/react-table";
import { IconBox, IconEdit, IconPlayerPause, IconPlayerPlay, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import api from "lib/api";
import TanstackTable from "components/table/TanstackTable";
import { usePermission } from "hooks/usePermissions";
import { useFeedback } from "components/common/FeedbackProvider";
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangtools/riwayat/common/exportUtils";
import MesinFormModal, { MesinFormData } from "../MesinFormModal";

interface MesinItem extends MesinFormData {
  // Total catatan riwayat (log, kalibrasi, rencana, dokumen, dll); > 0 berarti tidak boleh dihapus permanen
  jumlah_riwayat: number;
}

const STATUS_BADGE: Record<string, string> = {
  Aktif: "success",
  Maintenance: "warning",
  Rusak: "danger",
  "Tidak Aktif": "secondary",
};

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Mesin", key: "kode_mesin" },
  { header: "Nama Mesin", key: "nama_mesin" },
  { header: "Lokasi / Ruang", key: "lokasi_ruang" },
  { header: "Status", key: "status" },
];

/**
 * Halaman master Data Mesin: satu-satunya tempat menambah, mengedit, menonaktifkan, dan menghapus mesin.
 * Halaman Catatan Aktivitas & Catatan Pemeliharaan hanya memilih mesin dari daftar ini.
 */
export default function DataMasterMesinManager() {
  const canManage = usePermission("manage_data_mesin");
  const { notify, confirm } = useFeedback();

  const { data: mesinList, error, isLoading, mutate } = useSWR<MesinItem[]>(
    "/mesin-produksi",
    async (url: string) => (await api<{ data: MesinItem[] }>(url)).data ?? []
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [mesinEdit, setMesinEdit] = useState<MesinItem | null>(null);
  const [prosesId, setProsesId] = useState<number | string | null>(null);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return (mesinList ?? []).filter(
      (m) =>
        (statusFilter === "semua" || m.status === statusFilter) &&
        (!keyword ||
          [m.kode_mesin, m.nama_mesin, m.lokasi_ruang].some((v) => (v || "").toLowerCase().includes(keyword)))
    );
  }, [mesinList, searchTerm, statusFilter]);

  const bukaTambah = () => {
    setMesinEdit(null);
    setFormOpen(true);
  };

  const bukaEdit = (mesin: MesinItem) => {
    setMesinEdit(mesin);
    setFormOpen(true);
  };

  const handleToggleStatus = async (mesin: MesinItem) => {
    const nonaktifkan = mesin.status !== "Tidak Aktif";
    const setuju = await confirm({
      title: nonaktifkan ? "Nonaktifkan Mesin" : "Aktifkan Mesin",
      message: nonaktifkan
        ? `Mesin "${mesin.nama_mesin}" tidak akan muncul lagi untuk pencatatan baru. Riwayatnya tetap tersimpan dan mesin bisa diaktifkan kembali kapan saja.`
        : `Aktifkan kembali mesin "${mesin.nama_mesin}"? Status mesin akan menjadi Aktif.`,
      confirmLabel: nonaktifkan ? "Ya, nonaktifkan" : "Ya, aktifkan",
      variant: nonaktifkan ? "warning" : "primary",
    });
    if (!setuju) return;

    setProsesId(mesin.id);
    try {
      const res = await api<{ message: string }>(`/mesin-produksi/${mesin.id}/toggle-status`, { method: "PATCH" });
      notify(res.message || "Status mesin berhasil diubah", "success");
      await mutate();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal mengubah status mesin");
    } finally {
      setProsesId(null);
    }
  };

  const handleHapus = async (mesin: MesinItem) => {
    const setuju = await confirm({
      title: "Hapus Mesin Permanen",
      message: `Hapus mesin "${mesin.nama_mesin}" (${mesin.kode_mesin}) secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Ya, hapus",
    });
    if (!setuju) return;

    setProsesId(mesin.id);
    try {
      await api(`/mesin-produksi/${mesin.id}`, { method: "DELETE" });
      notify("Data mesin berhasil dihapus", "success");
      await mutate();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal menghapus data mesin");
    } finally {
      setProsesId(null);
    }
  };

  const columns = useMemo<ColumnDef<MesinItem, unknown>[]>(() => {
    const kolom: ColumnDef<MesinItem, unknown>[] = [
      {
        header: "Foto",
        id: "foto",
        cell: ({ row }) => (
          <div
            className="position-relative rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden"
            style={{ width: 56, height: 42 }}
          >
            {row.original.foto_katalog ? (
              <Image src={row.original.foto_katalog} alt={row.original.nama_mesin} fill sizes="56px" style={{ objectFit: "cover" }} />
            ) : (
              <IconBox size={20} className="text-secondary opacity-50" />
            )}
          </div>
        ),
      },
      { header: "Kode", accessorKey: "kode_mesin", cell: ({ row }) => <span className="fw-semibold">{row.original.kode_mesin}</span> },
      { header: "Nama Mesin", accessorKey: "nama_mesin" },
      { header: "Lokasi / Ruang", accessorKey: "lokasi_ruang" },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <Badge bg={STATUS_BADGE[row.original.status] ?? "secondary"}>{row.original.status}</Badge>,
      },
      {
        header: "Riwayat",
        accessorKey: "jumlah_riwayat",
        cell: ({ row }) =>
          row.original.jumlah_riwayat > 0 ? (
            <span>{row.original.jumlah_riwayat} catatan</span>
          ) : (
            <span className="text-secondary">Belum ada</span>
          ),
      },
    ];

    if (canManage) {
      kolom.push({
        header: "Aksi",
        id: "aksi",
        cell: ({ row }) => {
          const m = row.original;
          const sibuk = prosesId === m.id;
          const nonaktif = m.status === "Tidak Aktif";
          const punyaRiwayat = m.jumlah_riwayat > 0;
          return (
            <div className="d-flex gap-1 flex-nowrap">
              <Button size="sm" variant="outline-primary" title="Edit" onClick={() => bukaEdit(m)} disabled={sibuk}>
                <IconEdit size={16} />
              </Button>
              <Button
                size="sm"
                variant={nonaktif ? "outline-success" : "outline-warning"}
                title={nonaktif ? "Aktifkan kembali" : "Nonaktifkan"}
                onClick={() => handleToggleStatus(m)}
                disabled={sibuk}
              >
                {nonaktif ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
              </Button>
              {/* Mesin yang sudah punya riwayat hanya bisa dinonaktifkan agar riwayatnya tidak ikut terhapus */}
              <span title={punyaRiwayat ? "Mesin yang sudah punya riwayat tidak bisa dihapus, gunakan Nonaktifkan" : "Hapus permanen"}>
                <Button size="sm" variant="outline-danger" onClick={() => handleHapus(m)} disabled={sibuk || punyaRiwayat}>
                  {sibuk ? <Spinner animation="border" size="sm" /> : <IconTrash size={16} />}
                </Button>
              </span>
            </div>
          );
        },
      });
    }
    return kolom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, prosesId]);

  return (
    <div>
      <Row className="mb-3">
        <Col>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="mb-2 h2">Data Mesin</h1>
              <p className="text-secondary mb-0">
                Kelola daftar mesin produksi. Mesin di sini dipakai pada Catatan Aktivitas, Catatan Pemeliharaan, Kalibrasi, dan Rencana.
              </p>
            </div>
            {canManage && (
              <Button variant="primary" className="d-flex align-items-center gap-1 text-nowrap" onClick={bukaTambah}>
                <IconPlus size={16} /> Tambah Mesin
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <div className="p-3 border-bottom">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-body">
                  <IconSearch size={16} className="text-secondary" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari kode, nama mesin, atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
                <option value="semua">Semua status</option>
                <option value="Aktif">Aktif</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Rusak">Rusak</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </Form.Select>
            </Col>
            <Col md={4} className="d-flex justify-content-md-end align-items-center gap-1">
              <span className="text-secondary small me-1">Export:</span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => exportToPDF(filtered as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-mesin-produksi", "Data Mesin Produksi")}
              >
                PDF
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => exportToExcel(filtered as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-mesin-produksi")}
              >
                Excel
              </Button>
            </Col>
          </Row>
        </div>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data mesin...
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3 d-flex justify-content-between align-items-center">
              <span>{error.message || "Data mesin gagal dimuat."}</span>
              <Button size="sm" variant="outline-danger" onClick={() => mutate()}>Muat ulang</Button>
            </Alert>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <IconBox size={40} className="text-muted mb-2" />
              <h6 className="mb-1">{(mesinList ?? []).length === 0 ? "Belum ada data mesin" : "Tidak ada hasil"}</h6>
              <p className="text-secondary small mb-0">
                {(mesinList ?? []).length === 0
                  ? canManage
                    ? "Klik Tambah Mesin untuk menambahkan mesin pertama."
                    : "Belum ada mesin yang ditambahkan."
                  : "Tidak ada mesin yang cocok dengan pencarian atau filter."}
              </p>
            </div>
          ) : (
            <TanstackTable data={filtered} columns={columns} pagination isSortable />
          )}
        </CardBody>
      </Card>

      {canManage && (
        <MesinFormModal
          show={formOpen}
          onHide={() => setFormOpen(false)}
          mesin={mesinEdit}
          onSuccess={() => {
            notify(mesinEdit ? "Data mesin berhasil diperbarui" : "Mesin berhasil ditambahkan", "success");
            mutate();
          }}
        />
      )}
    </div>
  );
}

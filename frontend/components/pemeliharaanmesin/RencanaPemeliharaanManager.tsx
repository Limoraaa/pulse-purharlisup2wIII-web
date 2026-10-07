"use client";
// components/pemeliharaan/rencana/RencanaPemeliharaanManager.tsx
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  ButtonGroup,
  Spinner,
  Alert,
  InputGroup,
  Form,
  Table,
  Badge,
} from "react-bootstrap";
import {
  IconPlus,
  IconCalendar,
  IconCalendarEvent,
  IconList,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
  IconSearch,
  IconX,
  IconMoodEmpty,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";

import { usePermission } from "hooks/usePermissions";
import {
  exportToExcel,
  exportToPDF,
  ExportColumn,
} from "components/ruangtools/riwayat/common/exportUtils";
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import {
  fetchRencana,
  fetchMesinOptions,
  createRencana,
  updateRencana,
  deleteRencana,
} from "services/rencanaPemeliharaanService";
import {
  MesinOption,
  RencanaFormValues,
  RencanaItem,
} from "types/RencanaPemeliharaanTypes";
import {
  ACTION_KEYS,
  ACTION_META,
  MONTHS_LONG,
  MONTHS_SHORT,
  STATUS_VARIANT,
  formatJadwal,
  formatRupiah,
  getStatusTampil,
} from "./RencanaHelpers";
import RencanaFormModal, { RencanaFormDefaults } from "./RencanaFormModal";

const EMPTY_RENCANA: RencanaItem[] = [];
const EMPTY_MESIN: MesinOption[] = [];
const WEEKS = [1, 2, 3, 4];

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Mesin", key: "kodeMesin" },
  { header: "Nama Mesin", key: "namaMesin" },
  { header: "Tindakan", key: "tindakan" },
  { header: "Jadwal", key: "jadwal" },
  { header: "Status", key: "status" },
  { header: "RAB", key: "rab" },
];

const stickyCell = (bg: string, zIndex: number): React.CSSProperties => ({
  position: "sticky",
  left: 0,
  zIndex,
  background: bg,
  minWidth: 260,
  maxWidth: 260,
});

interface StatCardProps {
  label: string;
  value: string | number;
  tone: "primary" | "warning" | "success" | "danger";
  icon: React.ReactNode;
}

const StatCard = ({ label, value, tone, icon }: StatCardProps) => (
  <Card className="h-100">
    <CardBody className="d-flex align-items-center gap-3">
      <div
        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
        style={{
          width: 48,
          height: 48,
          background: `rgba(var(--bs-${tone}-rgb), 0.12)`,
          color: `var(--bs-${tone})`,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-secondary small mb-0">{label}</p>
        <p className="h3 mb-0">{value}</p>
      </div>
    </CardBody>
  </Card>
);

const RencanaPemeliharaanManager = () => {
  const canManage = usePermission("manage_pemeliharaan_mesin");
  const canProcess = usePermission("process_pemeliharaan_mesin");

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();

  // ---- State tampilan ----
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
  const [searchTerm, setSearchTerm] = useState("");
  const [tahun, setTahun] = useState(currentYear);

  // ---- State modal ----
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RencanaItem | null>(null);
  const [formDefaults, setFormDefaults] = useState<RencanaFormDefaults | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ---- Notifikasi ----
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ================= DATA DARI API =================
  const {
    data: rencanaData,
    error: rencanaError,
    isLoading: loadingRencana,
    mutate: mutateRencana,
  } = useSWR(`/rencana-pemeliharaan?tahun=${tahun}`, () => fetchRencana(tahun));

  const { data: mesinData } = useSWR("/mesin-produksi/options", fetchMesinOptions);

  const rencana = rencanaData ?? EMPTY_RENCANA;
  const mesinList = mesinData ?? EMPTY_MESIN;

  // Semua tahun yang diterima backend (2000-2100)
  const yearOptions = useMemo(
    () => Array.from({ length: 101 }, (_, i) => 2000 + i),
    []
  );

  // ================= TURUNAN DATA =================
  // Baris matrix: semua mesin (agar sel kosong bisa diisi), ditambah mesin
  // yang punya rencana tetapi tidak ada di daftar mesin.
  const allRows = useMemo(() => {
    const map = new Map<string, { mesin: MesinOption; plans: RencanaItem[] }>();
    mesinList.forEach((m) => map.set(m.id, { mesin: m, plans: [] }));
    rencana.forEach((r) => {
      if (!map.has(r.mesinId)) {
        map.set(r.mesinId, {
          mesin: { id: r.mesinId, kodeMesin: r.kodeMesin, namaMesin: r.namaMesin },
          plans: [],
        });
      }
      map.get(r.mesinId)!.plans.push(r);
    });
    return Array.from(map.values());
  }, [mesinList, rencana]);

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return allRows;
    return allRows.filter(
      ({ mesin }) =>
        mesin.kodeMesin.toLowerCase().includes(keyword) ||
        mesin.namaMesin.toLowerCase().includes(keyword)
    );
  }, [allRows, searchTerm]);

  const filteredPlans = useMemo(
    () =>
      filteredRows
        .flatMap((r) => r.plans)
        .sort(
          (a, b) =>
            a.bulan - b.bulan ||
            a.minggu - b.minggu ||
            a.kodeMesin.localeCompare(b.kodeMesin)
        ),
    [filteredRows]
  );

  const stats = useMemo(() => {
    const selesai = rencana.filter((r) => r.status === "Selesai").length;
    const terlewat = rencana.filter((r) => getStatusTampil(r, today) === "Terlewat").length;
    const bulanIni =
      tahun === currentYear
        ? rencana.filter((r) => r.bulan === today.getMonth() + 1).length
        : null;
    return { total: rencana.length, selesai, terlewat, bulanIni };
  }, [rencana, tahun, today, currentYear]);

  // ================= AKSI MODAL =================
  const openAddModal = useCallback((defaults: RencanaFormDefaults | null = null) => {
    setActiveItem(null);
    setFormDefaults(defaults);
    setModalError(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((item: RencanaItem) => {
    setActiveItem(item);
    setFormDefaults(null);
    setModalError(null);
    setModalOpen(true);
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setActiveItem(null);
    setModalError(null);
  };

  const handleSubmit = async (values: RencanaFormValues) => {
    setSubmitting(true);
    setModalError(null);
    try {
      if (activeItem) {
        await updateRencana(activeItem.id, values);
      } else {
        await createRencana(values);
      }
      await mutateRencana();
      // Jika tahun diubah di form, pindahkan tampilan ke tahun tersebut
      // agar rencana yang baru disimpan langsung terlihat.
      if (values.tahun !== tahun) setTahun(values.tahun);
      flashSuccess(activeItem ? "Rencana berhasil diperbarui." : "Rencana berhasil ditambahkan.");
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Gagal menyimpan rencana");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: RencanaItem) => {
    setSubmitting(true);
    setModalError(null);
    try {
      await deleteRencana(item.id);
      await mutateRencana();
      flashSuccess("Rencana berhasil dihapus.");
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Gagal menghapus rencana");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= EXPORT =================
  const buildExportData = () =>
    filteredPlans.map((p) => ({
      kodeMesin: p.kodeMesin,
      namaMesin: p.namaMesin,
      tindakan: `${p.aksi} - ${ACTION_META[p.aksi].label}`,
      jadwal: formatJadwal(p),
      status: getStatusTampil(p, today),
      rab: formatRupiah(p.rab),
    }));

  const handleExportPDF = () =>
    exportToPDF(
      buildExportData() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS,
      `rencana-pemeliharaan-${tahun}`,
      `Rencana Pemeliharaan ${tahun}`
    );

  const handleExportExcel = () =>
    exportToExcel(
      buildExportData() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS,
      `rencana-pemeliharaan-${tahun}`
    );

  // ================= KOLOM TABEL LIST =================
  const listColumns = useMemo<ColumnDef<RencanaItem>[]>(
    () => [
      {
        id: "mesin",
        header: "Mesin",
        accessorKey: "kodeMesin",
        enableSorting: true,
        enableSortingRemoval: false,
        cell: ({ row }) => (
          <div>
            <div className="fw-semibold">{row.original.kodeMesin}</div>
            <div className="text-secondary small">{row.original.namaMesin}</div>
          </div>
        ),
      },
      {
        id: "tindakan",
        header: "Tindakan",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = ACTION_META[row.original.aksi];
          return (
            <span
              className="d-inline-flex align-items-center gap-2"
              title={meta.label}
            >
              <span
                className="d-inline-flex align-items-center justify-content-center rounded fw-bold"
                style={{ width: 24, height: 24, fontSize: 12, background: meta.color, color: meta.textColor }}
              >
                {row.original.aksi}
              </span>
              <span className="small">{meta.label}</span>
            </span>
          );
        },
      },
      {
        id: "jadwal",
        header: "Jadwal",
        enableSorting: false,
        cell: ({ row }) => formatJadwal(row.original),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const status = getStatusTampil(row.original, today);
          return (
            <Badge pill bg={STATUS_VARIANT[status]}>
              {status}
            </Badge>
          );
        },
      },
      {
        id: "rab",
        header: "RAB",
        enableSorting: false,
        cell: ({ row }) => formatRupiah(row.original.rab),
      },
      {
        id: "aksiRow",
        header: "Aksi",
        enableSorting: false,
        cell: ({ row }) => (
          <Button variant="link" size="sm" className="p-0" onClick={() => openEditModal(row.original)}>
            {canManage ? "Edit" : "Detail"}
          </Button>
        ),
      },
    ],
    [today, canManage, openEditModal]
  );

  // ================= RENDER =================
  const hasData = rencana.length > 0;
  const noResults =
    hasData &&
    (viewMode === "matrix" ? filteredRows.length === 0 : filteredPlans.length === 0);

  const countText =
    viewMode === "matrix" ? (
      <>
        Menampilkan <span className="fw-semibold text-body">{filteredRows.length}</span> dari{" "}
        {allRows.length} mesin
      </>
    ) : (
      <>
        Menampilkan <span className="fw-semibold text-body">{filteredPlans.length}</span> dari{" "}
        {rencana.length} rencana
      </>
    );

  return (
    <div className="datatools-page">
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
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Rencana Pemeliharaan</h1>
              <p className="text-secondary mb-0">
                Mengelola jadwal pemeliharaan mesin produksi per minggu sepanjang tahun.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              {canManage && (
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2"
                  onClick={() => openAddModal()}
                >
                  <IconPlus size={18} />
                  Tambah Rencana
                </Button>
              )}
            </div>
          </Flex>
        </Col>
      </Row>

      {/* ---- Statistik ---- */}
      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <StatCard label={`Total Rencana ${tahun}`} value={stats.total} tone="primary" icon={<IconCalendar size={24} />} />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            label={stats.bulanIni === null ? "Bulan Ini" : `Bulan Ini (${MONTHS_LONG[today.getMonth()]})`}
            value={stats.bulanIni === null ? "-" : stats.bulanIni}
            tone="warning"
            icon={<IconClock size={24} />}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard label="Selesai" value={stats.selesai} tone="success" icon={<IconCircleCheck size={24} />} />
        </Col>
        <Col xl={3} md={6}>
          <StatCard label="Terlewat" value={stats.terlewat} tone="danger" icon={<IconAlertCircle size={24} />} />
        </Col>
      </Row>

      <Card className="card-lg mb-4">
        {/* ---- Toolbar ---- */}
        <div className="datatools-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={4} md={6}>
              <InputGroup className="datatools-search">
                <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode atau nama mesin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg="auto" md={6} className="d-flex gap-2">
              <Form.Select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                aria-label="Tahun rencana"
                style={{ width: 100 }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Form.Select>
              <ButtonGroup aria-label="Mode tampilan">
                <Button
                  variant={viewMode === "matrix" ? "primary" : "outline-secondary"}
                  className="d-flex align-items-center gap-1"
                  onClick={() => setViewMode("matrix")}
                >
                  <IconCalendar size={16} /> <span className="d-none d-sm-inline">Matrix</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "outline-secondary"}
                  className="d-flex align-items-center gap-1"
                  onClick={() => setViewMode("list")}
                >
                  <IconList size={16} /> <span className="d-none d-sm-inline">List</span>
                </Button>
              </ButtonGroup>
            </Col>
            <Col className="text-lg-end">
              <span className="text-secondary small">{countText}</span>
            </Col>
            <Col lg="auto" className="d-flex justify-content-lg-end gap-2">
              <Button variant="outline-danger" size="sm" onClick={handleExportPDF} disabled={!hasData}>
                Export PDF
              </Button>
              <Button variant="outline-success" size="sm" onClick={handleExportExcel} disabled={!hasData}>
                Export Excel
              </Button>
            </Col>
          </Row>
        </div>

        <CardBody className={viewMode === "matrix" && hasData && !noResults && !loadingRencana ? "p-0" : undefined}>
          {rencanaError && (
            <Alert variant="danger" className={viewMode === "matrix" ? "m-3" : undefined}>
              {rencanaError instanceof Error ? rencanaError.message : "Gagal memuat rencana pemeliharaan"}
            </Alert>
          )}

          {loadingRencana ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : !hasData ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3"><IconCalendarEvent size={32} /></div>
              <h5 className="mb-1">Belum ada rencana untuk {tahun}</h5>
              <p className="text-secondary mb-4">
                Mulai dengan menjadwalkan pemeliharaan pertama untuk mesin produksi.
              </p>
              {canManage && (
                <Button
                  variant="primary"
                  className="d-inline-flex align-items-center gap-2"
                  onClick={() => openAddModal()}
                >
                  <IconPlus size={18} /> Tambah Rencana
                </Button>
              )}
            </div>
          ) : noResults ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3"><IconMoodEmpty size={32} /></div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">Tidak ditemukan mesin yang cocok dengan pencarian.</p>
              <Button
                variant="outline-secondary"
                className="d-inline-flex align-items-center gap-2"
                onClick={() => setSearchTerm("")}
              >
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : viewMode === "matrix" ? (
            <div className="table-responsive">
              <Table className="mb-0 align-middle text-nowrap" size="sm">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="px-4 py-3"
                      style={stickyCell("var(--bs-tertiary-bg, #f8f9fa)", 3)}
                    >
                      Kode &amp; Nama Mesin
                    </th>
                    {MONTHS_SHORT.map((m) => (
                      <th key={m} colSpan={4} className="text-center border-start">{m}</th>
                    ))}
                    <th rowSpan={2} className="text-end px-4 border-start">RAB (Rp)</th>
                  </tr>
                  <tr>
                    {MONTHS_SHORT.map((m) =>
                      WEEKS.map((w) => (
                        <th
                          key={`${m}-${w}`}
                          className={`text-center fw-normal text-secondary p-1 ${w === 1 ? "border-start" : ""}`}
                          style={{ fontSize: 10 }}
                        >
                          W{w}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(({ mesin, plans }) => {
                    const totalRab = plans.reduce((sum, p) => sum + p.rab, 0);
                    return (
                      <tr key={mesin.id}>
                        <td className="px-4 py-2" style={stickyCell("var(--bs-body-bg, #fff)", 2)}>
                          <div className="fw-semibold">{mesin.kodeMesin}</div>
                          <div
                            className="text-secondary small text-truncate"
                            style={{ maxWidth: 220 }}
                            title={mesin.namaMesin}
                          >
                            {mesin.namaMesin}
                          </div>
                        </td>
                        {MONTHS_SHORT.map((_, mIdx) =>
                          WEEKS.map((w) => {
                            const cellPlans = plans.filter(
                              (p) => p.bulan === mIdx + 1 && p.minggu === w
                            );
                            const plan = cellPlans[0];
                            const status = plan ? getStatusTampil(plan, today) : null;
                            const meta = plan ? ACTION_META[plan.aksi] : null;
                            const done = status === "Selesai";
                            return (
                              <td
                                key={`${mesin.id}-${mIdx}-${w}`}
                                className={`text-center p-1 ${w === 1 ? "border-start" : ""}`}
                                style={{ minWidth: 32 }}
                              >
                                {plan && meta ? (
                                  <button
                                    type="button"
                                    className="border rounded d-inline-flex align-items-center justify-content-center fw-bold position-relative p-0"
                                    style={{
                                      width: 24,
                                      height: 24,
                                      fontSize: 12,
                                      cursor: "pointer",
                                      background: done ? meta.color : "var(--bs-body-bg, #fff)",
                                      color: done ? meta.textColor : meta.color,
                                      borderColor: meta.color,
                                      boxShadow:
                                        status === "Terlewat" ? "0 0 0 2px var(--bs-danger)" : undefined,
                                    }}
                                    title={cellPlans
                                      .map((p) => `${p.aksi} - ${ACTION_META[p.aksi].label} (${getStatusTampil(p, today)})`)
                                      .join("\n")}
                                    onClick={() => openEditModal(plan)}
                                  >
                                    {plan.aksi}
                                    {cellPlans.length > 1 && (
                                      <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark"
                                        style={{ fontSize: 9, padding: "2px 4px" }}
                                      >
                                        +{cellPlans.length - 1}
                                      </span>
                                    )}
                                  </button>
                                ) : canManage ? (
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="rencana-cell-empty rounded mx-auto"
                                    style={{ width: 24, height: 24, cursor: "pointer" }}
                                    title={`Tambah rencana ${mesin.kodeMesin} - Minggu ${w}, ${MONTHS_SHORT[mIdx]}`}
                                    onClick={() => openAddModal({ mesinId: mesin.id, bulan: mIdx + 1, minggu: w })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openAddModal({ mesinId: mesin.id, bulan: mIdx + 1, minggu: w });
                                      }
                                    }}
                                  />
                                ) : (
                                  <div style={{ width: 24, height: 24 }} />
                                )}
                              </td>
                            );
                          })
                        )}
                        <td className="text-end px-4 fw-medium">{formatRupiah(totalRab)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <TanstackTable data={filteredPlans} columns={listColumns} pagination isSortable />
          )}
        </CardBody>
      </Card>

      {/* ---- Keterangan ---- */}
      <Card className="mb-6">
        <CardBody className="d-flex flex-wrap align-items-center gap-4 small">
          <span className="fw-semibold">Keterangan:</span>
          {ACTION_KEYS.map((k) => (
            <span key={k} className="d-inline-flex align-items-center gap-2">
              <span
                className="d-inline-block rounded"
                style={{ width: 16, height: 16, background: ACTION_META[k].color }}
              />
              {k} ({ACTION_META[k].label})
            </span>
          ))}
          <span className="vr d-none d-md-block" />
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className="d-inline-block rounded bg-body border border-secondary"
              style={{ width: 16, height: 16 }}
            />
            Terjadwal
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span className="d-inline-block rounded bg-secondary" style={{ width: 16, height: 16 }} />
            Selesai
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className="d-inline-block rounded bg-body border border-secondary"
              style={{ width: 16, height: 16, boxShadow: "0 0 0 2px var(--bs-danger)" }}
            />
            Terlewat
          </span>
        </CardBody>
      </Card>

      {/* ---- Modal ---- */}
      <RencanaFormModal
        show={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        initialData={activeItem}
        defaults={formDefaults}
        tahun={tahun}
        mesinOptions={allRows.map((r) => r.mesin)}
        submitting={submitting}
        error={modalError}
        canManage={canManage}
        canProcess={canProcess}
      />
    </div>
  );
};

export default RencanaPemeliharaanManager;
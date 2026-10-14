"use client";
// components/pemeliharaan/rencana/RencanaPemeliharaanManager.tsx
import React, { useCallback, useMemo, useState } from "react";
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
  Dropdown,
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
  IconDownload,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";

// Library untuk Custom Export Matrix (PDF & Styled Excel)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// @ts-ignore - menggunakan xlsx-js-style agar support warna, border, dan alignment
import XLSX from "xlsx-js-style";

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

// Kolom untuk Export bentuk List standar
const EXPORT_COLUMNS_LIST: ExportColumn[] = [
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
  minWidth: 200,
  maxWidth: 200,
  borderRight: "1px solid var(--bs-border-color)",
});

// Helper konversi warna Hex (#198754 -> 198754) untuk Excel
const cleanHex = (hex?: string, fallback = "000000") => {
  if (!hex || !hex.startsWith("#")) return fallback;
  return hex.replace("#", "").toUpperCase();
};

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

  const yearOptions = useMemo(
    () => Array.from({ length: 101 }, (_, i) => 2000 + i),
    []
  );

  // ================= TURUNAN DATA =================
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

  // ================= 1. EXPORT FORMAT LIST =================
  const buildExportDataList = () =>
    filteredPlans.map((p) => ({
      kodeMesin: p.kodeMesin,
      namaMesin: p.namaMesin,
      tindakan: `${p.aksi} - ${ACTION_META[p.aksi].label}`,
      jadwal: formatJadwal(p),
      status: getStatusTampil(p, today),
      rab: formatRupiah(p.rab),
    }));

  const handleExportPDFList = () =>
    exportToPDF(
      buildExportDataList() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS_LIST,
      `rencana-pemeliharaan-list-${tahun}`,
      `Rencana Pemeliharaan Mesin (List) - Tahun ${tahun}`
    );

  const handleExportExcelList = () =>
    exportToExcel(
      buildExportDataList() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS_LIST,
      `rencana-pemeliharaan-list-${tahun}`
    );

  // ================= 2. EXPORT PDF FORMAT MATRIX (PERSIS UI) =================
  const handleExportPDFMatrix = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`RENCANA PEMELIHARAAN MESIN - TAHUN ${tahun}`, 10, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Kelola dan pantau jadwal preventive maintenance mesin (Matriks Tahunan W1 - W4)", 10, 17);

    const headRow1: any[] = [
      { content: "KODE & NAMA MESIN", rowSpan: 2, styles: { valign: "middle", halign: "left" } },
    ];
    MONTHS_SHORT.forEach((m) => {
      headRow1.push({
        content: m.toUpperCase(),
        colSpan: 4,
        styles: { halign: "center", valign: "middle" },
      });
    });
    headRow1.push({
      content: "RAB (RP)",
      rowSpan: 2,
      styles: { valign: "middle", halign: "right" },
    });

    const headRow2: any[] = [];
    MONTHS_SHORT.forEach(() => {
      WEEKS.forEach((w) => {
        headRow2.push({
          content: `W${w}`,
          styles: { halign: "center", fontSize: 5.5, textColor: [100, 100, 100] },
        });
      });
    });

    const bodyRows: any[] = filteredRows.map(({ mesin, plans }) => {
      const totalRab = plans.reduce((sum, p) => sum + p.rab, 0);
      const rowData: any[] = [
        {
          content: `${mesin.kodeMesin}\n${mesin.namaMesin}`,
          styles: { fontStyle: "bold", halign: "left", fontSize: 6.5 },
        },
      ];

      MONTHS_SHORT.forEach((_, mIdx) => {
        WEEKS.forEach((w) => {
          const cellPlans = plans.filter((p) => p.bulan === mIdx + 1 && p.minggu === w);
          const plan = cellPlans[0];

          if (plan) {
            const status = getStatusTampil(plan, today);
            let fillColor: [number, number, number] = [255, 255, 255];
            let textColor: [number, number, number] = [33, 37, 41];

            if (status === "Selesai") {
              fillColor = [25, 135, 84]; // Hijau (#198754)
              textColor = [255, 255, 255];
            } else if (status === "Terlewat") {
              fillColor = [220, 53, 69]; // Merah (#dc3545)
              textColor = [255, 255, 255];
            }

            const label = cellPlans.length > 1 ? `${plan.aksi}+` : plan.aksi;

            rowData.push({
              content: label,
              styles: {
                halign: "center",
                valign: "middle",
                fontStyle: "bold",
                fillColor,
                textColor,
              },
            });
          } else {
            rowData.push({ content: "", styles: { halign: "center" } });
          }
        });
      });

      rowData.push({
        content: formatRupiah(totalRab),
        styles: { halign: "right", valign: "middle", fontStyle: "bold", fontSize: 6.5 },
      });

      return rowData;
    });

    autoTable(doc, {
      startY: 21,
      head: [headRow1, headRow2],
      body: bodyRows,
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1,
        lineColor: [215, 215, 215],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [33, 37, 41],
        fontStyle: "bold",
        fontSize: 6.5,
      },
      columnStyles: {
        0: { cellWidth: 34 },
        49: { cellWidth: 22 },
      },
      margin: { left: 8, right: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Keterangan Tindakan:", 10, finalY);

    doc.setFont("helvetica", "normal");
    const keteranganTindakan = ACTION_KEYS.map((k) => `${k} (${ACTION_META[k].label})`).join("   |   ");
    doc.text(keteranganTindakan, 42, finalY);

    doc.setFont("helvetica", "bold");
    doc.text("Status Warna:", 10, finalY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Putih = Terjadwal     |     Hijau = Selesai     |     Merah = Terlewat",
      32,
      finalY + 5
    );

    doc.save(`rencana-pemeliharaan-matrix-${tahun}.pdf`);
  };

  // ================= 3. EXPORT EXCEL FORMAT MATRIX (FULL UI/UX STYLING) =================
  const handleExportExcelMatrix = () => {
    const borderThin = {
      top: { style: "thin", color: { rgb: "DEE2E6" } },
      bottom: { style: "thin", color: { rgb: "DEE2E6" } },
      left: { style: "thin", color: { rgb: "DEE2E6" } },
      right: { style: "thin", color: { rgb: "DEE2E6" } },
    };

    const headerStyle = {
      font: { name: "Arial", sz: 9, bold: true, color: { rgb: "495057" } },
      fill: { fgColor: { rgb: "F8F9FA" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderThin,
    };

    const subHeaderStyle = {
      font: { name: "Arial", sz: 8, color: { rgb: "6C757D" } },
      fill: { fgColor: { rgb: "F8F9FA" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderThin,
    };

    // Baris 0: Judul Laporan di Excel
    const titleRow: any[] = [
      {
        v: `RENCANA PEMELIHARAAN MESIN - TAHUN ${tahun}`,
        t: "s",
        s: {
          font: { name: "Arial", sz: 14, bold: true, color: { rgb: "212529" } },
          alignment: { vertical: "center" },
        },
      },
    ];

    // Baris 1: Subjudul
    const subTitleRow: any[] = [
      {
        v: `Kelola dan pantau jadwal preventive maintenance mesin | Total Rencana: ${stats.total} | Selesai: ${stats.selesai} | Terlewat: ${stats.terlewat}`,
        t: "s",
        s: {
          font: { name: "Arial", sz: 10, italic: true, color: { rgb: "6C757D" } },
          alignment: { vertical: "center" },
        },
      },
    ];

    // Baris 3: Header Tabel Utama (Kode & Nama Mesin + 12 Bulan + RAB)
    const headRow1: any[] = [
      {
        v: "KODE & NAMA MESIN",
        t: "s",
        s: { ...headerStyle, alignment: { horizontal: "left", vertical: "center" } },
      },
    ];
    MONTHS_SHORT.forEach((m) => {
      headRow1.push(
        { v: m.toUpperCase(), t: "s", s: headerStyle },
        { v: "", t: "s", s: headerStyle },
        { v: "", t: "s", s: headerStyle },
        { v: "", t: "s", s: headerStyle }
      );
    });
    headRow1.push({
      v: "RAB (RP)",
      t: "s",
      s: { ...headerStyle, alignment: { horizontal: "right", vertical: "center" } },
    });

    // Baris 4: Sub-Header Minggu (W1 - W4)
    const headRow2: any[] = [{ v: "", t: "s", s: headerStyle }];
    MONTHS_SHORT.forEach(() => {
      WEEKS.forEach((w) => {
        headRow2.push({ v: `W${w}`, t: "s", s: subHeaderStyle });
      });
    });
    headRow2.push({ v: "", t: "s", s: headerStyle });

    // Baris Data Mesin (Mulai Baris 5)
    const dataRows: any[][] = filteredRows.map(({ mesin, plans }) => {
      const row: any[] = [
        {
          v: `${mesin.kodeMesin}\n${mesin.namaMesin}`,
          t: "s",
          s: {
            font: { name: "Arial", sz: 9, bold: true, color: { rgb: "212529" } },
            fill: { fgColor: { rgb: "FFFFFF" } },
            alignment: { horizontal: "left", vertical: "center", wrapText: true },
            border: borderThin,
          },
        },
      ];

      MONTHS_SHORT.forEach((_, mIdx) => {
        WEEKS.forEach((w) => {
          const cellPlans = plans.filter((p) => p.bulan === mIdx + 1 && p.minggu === w);
          const plan = cellPlans[0];

          if (plan) {
            const status = getStatusTampil(plan, today);
            const meta = ACTION_META[plan.aksi];
            const label = cellPlans.length > 1 ? `${plan.aksi} (+${cellPlans.length - 1})` : plan.aksi;

            // Default Terjadwal: Putih dengan Teks Berwarna sesuai Aksi
            let bgRgb = "FFFFFF";
            let textRgb = cleanHex(meta?.color, "212529");
            let cellBorder = {
              top: { style: "medium", color: { rgb: cleanHex(meta?.color, "ADB5BD") } },
              bottom: { style: "medium", color: { rgb: cleanHex(meta?.color, "ADB5BD") } },
              left: { style: "medium", color: { rgb: cleanHex(meta?.color, "ADB5BD") } },
              right: { style: "medium", color: { rgb: cleanHex(meta?.color, "ADB5BD") } },
            };

            if (status === "Selesai") {
              bgRgb = "198754"; // Hijau Sukses persis UI
              textRgb = "FFFFFF";
              cellBorder = borderThin;
            } else if (status === "Terlewat") {
              bgRgb = "DC3545"; // Merah Terlewat persis UI
              textRgb = "FFFFFF";
              cellBorder = borderThin;
            }

            row.push({
              v: label,
              t: "s",
              s: {
                font: { name: "Arial", sz: 9, bold: true, color: { rgb: textRgb } },
                fill: { fgColor: { rgb: bgRgb } },
                alignment: { horizontal: "center", vertical: "center" },
                border: cellBorder,
              },
            });
          } else {
            row.push({
              v: "",
              t: "s",
              s: {
                fill: { fgColor: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: borderThin,
              },
            });
          }
        });
      });

      const totalRab = plans.reduce((sum, p) => sum + p.rab, 0);
      row.push({
        v: formatRupiah(totalRab),
        t: "s",
        s: {
          font: { name: "Arial", sz: 9, bold: true, color: { rgb: "212529" } },
          fill: { fgColor: { rgb: "FFFFFF" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: borderThin,
        },
      });

      return row;
    });

    // Baris Legenda Keterangan di Bawah Tabel (Persis UI Card Keterangan)
    const legendActionRow: any[] = [
      {
        v: "Keterangan Tindakan:",
        t: "s",
        s: { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "212529" } } },
      },
    ];
    ACTION_KEYS.forEach((k) => {
      const meta = ACTION_META[k];
      legendActionRow.push(
        {
          v: k,
          t: "s",
          s: {
            font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: cleanHex(meta.color, "0D6EFD") } },
            alignment: { horizontal: "center", vertical: "center" },
            border: borderThin,
          },
        },
        {
          v: meta.label,
          t: "s",
          s: {
            font: { name: "Arial", sz: 9, color: { rgb: "212529" } },
            alignment: { horizontal: "left", vertical: "center" },
          },
        },
        { v: "", t: "s" },
        { v: "", t: "s" },
        { v: "", t: "s" }
      );
    });

    const legendStatusRow: any[] = [
      {
        v: "Status Warna:",
        t: "s",
        s: { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "212529" } } },
      },
      {
        v: "M",
        t: "s",
        s: {
          font: { name: "Arial", sz: 9, bold: true, color: { rgb: "212529" } },
          fill: { fgColor: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderThin,
        },
      },
      {
        v: "Terjadwal (Putih)",
        t: "s",
        s: { font: { name: "Arial", sz: 9 }, alignment: { vertical: "center" } },
      },
      { v: "", t: "s" },
      { v: "", t: "s" },
      {
        v: "M",
        t: "s",
        s: {
          font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "198754" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderThin,
        },
      },
      {
        v: "Selesai (Hijau)",
        t: "s",
        s: { font: { name: "Arial", sz: 9 }, alignment: { vertical: "center" } },
      },
      { v: "", t: "s" },
      { v: "", t: "s" },
      {
        v: "M",
        t: "s",
        s: {
          font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "DC3545" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderThin,
        },
      },
      {
        v: "Terlewat (Merah)",
        t: "s",
        s: { font: { name: "Arial", sz: 9 }, alignment: { vertical: "center" } },
      },
    ];

    const worksheetData = [
      titleRow,
      subTitleRow,
      [], // Baris Kosong (Row index 2)
      headRow1, // Row index 3
      headRow2, // Row index 4
      ...dataRows, // Mulai Row index 5
      [],
      legendActionRow,
      legendStatusRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge Cells untuk Judul, Kode/Nama Mesin, 12 Bulan (4 kolom per bulan), dan RAB
    const merges: any[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } }, // Merge Judul
      { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } }, // Merge Subjudul
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // Merge Header Kode & Nama Mesin
      { s: { r: 3, c: 49 }, e: { r: 4, c: 49 } }, // Merge Header RAB (RP)
    ];

    MONTHS_SHORT.forEach((_, mIdx) => {
      const startCol = 1 + mIdx * 4;
      merges.push({
        s: { r: 3, c: startCol },
        e: { r: 3, c: startCol + 3 },
      });
    });

    ws["!merges"] = merges;

    // Lebar Kolom Proporsional seperti UI (Kolom W1-W4 dibuat kotak kecil)
    const colWidths: any[] = [{ wch: 30 }]; // Kolom 0: Kode & Nama Mesin
    for (let i = 0; i < 48; i++) {
      colWidths.push({ wch: 4.5 }); // 48 Kolom Minggu dibuat kotak compact
    }
    colWidths.push({ wch: 18 }); // Kolom 49: RAB (Rp)
    ws["!cols"] = colWidths;

    // Tinggi Baris agar lega seperti UI Web
    const rowHeights: any[] = [
      { hpt: 24 }, // Title
      { hpt: 18 }, // Subtitle
      { hpt: 10 }, // Spacer
      { hpt: 22 }, // Header Bulan
      { hpt: 18 }, // Header W1-W4
    ];
    filteredRows.forEach(() => {
      rowHeights.push({ hpt: 32 }); // Tinggi baris tiap mesin (2 baris teks: kode + nama)
    });
    rowHeights.push({ hpt: 12 }, { hpt: 22 }, { hpt: 22 });
    ws["!rows"] = rowHeights;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Matrix ${tahun}`);
    XLSX.writeFile(wb, `rencana-pemeliharaan-matrix-${tahun}.xlsx`);
  };

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
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 12,
                  background: meta.color,
                  color: meta.textColor,
                }}
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
          <Button
            variant="link"
            size="sm"
            className="p-0"
            onClick={() => openEditModal(row.original)}
          >
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
    (viewMode === "matrix"
      ? filteredRows.length === 0
      : filteredPlans.length === 0);

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
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <DasherBreadcrumb />
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
          <StatCard
            label={`Total Rencana ${tahun}`}
            value={stats.total}
            tone="primary"
            icon={<IconCalendar size={24} />}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            label={
              stats.bulanIni === null
                ? "Bulan Ini"
                : `Bulan Ini (${MONTHS_LONG[today.getMonth()]})`
            }
            value={stats.bulanIni === null ? "-" : stats.bulanIni}
            tone="warning"
            icon={<IconClock size={24} />}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            label="Selesai"
            value={stats.selesai}
            tone="success"
            icon={<IconCircleCheck size={24} />}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            label="Terlewat"
            value={stats.terlewat}
            tone="danger"
            icon={<IconAlertCircle size={24} />}
          />
        </Col>
      </Row>

      <Card className="card-lg mb-4">
        {/* ---- Toolbar ---- */}
        <div className="datatools-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={4} md={6}>
              <InputGroup className="datatools-search">
                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode atau nama mesin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="datatools-search-clear"
                    onClick={() => setSearchTerm("")}
                  >
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
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Form.Select>
              <ButtonGroup aria-label="Mode tampilan">
                <Button
                  variant={viewMode === "matrix" ? "primary" : "outline-secondary"}
                  className="d-flex align-items-center gap-1"
                  onClick={() => setViewMode("matrix")}
                >
                  <IconCalendar size={16} />{" "}
                  <span className="d-none d-sm-inline">Matrix</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "outline-secondary"}
                  className="d-flex align-items-center gap-1"
                  onClick={() => setViewMode("list")}
                >
                  <IconList size={16} />{" "}
                  <span className="d-none d-sm-inline">List</span>
                </Button>
              </ButtonGroup>
            </Col>
            <Col className="text-lg-end">
              <span className="text-secondary small">{countText}</span>
            </Col>
            <Col lg="auto" className="d-flex justify-content-lg-end gap-2">
              {/* Dropdown Export PDF */}
              <Dropdown>
                <Dropdown.Toggle
                  variant="danger"
                  size="sm"
                  id="dropdown-export-pdf"
                  disabled={!hasData}
                  className="d-flex align-items-center gap-1"
                >
                  <IconDownload size={14} /> Export PDF
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-sm border-0 small">
                  <Dropdown.Item onClick={handleExportPDFMatrix}>
                    Format Matrix (Persis Tabel UI)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleExportPDFList}>
                    Format List (Daftar Rencana)
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* Dropdown Export Excel */}
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-success"
                  size="sm"
                  id="dropdown-export-excel"
                  disabled={!hasData}
                  className="d-flex align-items-center gap-1"
                >
                  <IconDownload size={14} /> Export Excel
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-sm border-0 small">
                  <Dropdown.Item onClick={handleExportExcelMatrix}>
                    Format Matrix (Berwarna Persis UI)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleExportExcelList}>
                    Format List (Daftar Rencana)
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </div>

        <CardBody
          className={
            viewMode === "matrix" && hasData && !noResults && !loadingRencana
              ? "p-0"
              : undefined
          }
        >
          {rencanaError && (
            <Alert
              variant="warning"
              className={`d-flex align-items-center justify-content-between gap-3 flex-wrap ${
                viewMode === "matrix" ? "m-3" : ""
              }`}
            >
              <div className="d-flex align-items-center gap-2">
                <IconAlertCircle size={20} />
                <span>
                  Gagal memuat rencana pemeliharaan. Koneksi ke server sempat
                  terputus.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline-dark"
                onClick={() => mutateRencana()}
              >
                Coba lagi
              </Button>
            </Alert>
          )}

          {loadingRencana ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat
              data...
            </div>
          ) : !hasData ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3">
                <IconCalendarEvent size={32} />
              </div>
              <h5 className="mb-1">Belum ada rencana untuk {tahun}</h5>
              <p className="text-secondary mb-4">
                Mulai dengan menjadwalkan pemeliharaan pertama untuk mesin
                produksi.
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
              <div className="datatools-empty-icon mb-3">
                <IconMoodEmpty size={32} />
              </div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">
                Tidak ditemukan mesin yang cocok dengan pencarian.
              </p>
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
                      className="px-3 py-3"
                      style={stickyCell("var(--bs-tertiary-bg, #f8f9fa)", 3)}
                    >
                      Kode &amp; Nama Mesin
                    </th>
                    {MONTHS_SHORT.map((m) => (
                      <th key={m} colSpan={4} className="text-center border-start">
                        {m}
                      </th>
                    ))}
                    <th rowSpan={2} className="text-end px-4 border-start">
                      RAB (Rp)
                    </th>
                  </tr>
                  <tr>
                    {MONTHS_SHORT.map((m) =>
                      WEEKS.map((w) => (
                        <th
                          key={`${m}-${w}`}
                          className={`text-center fw-normal text-secondary p-1 ${
                            w === 1 ? "border-start" : ""
                          }`}
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
                        <td
                          className="px-3 py-2"
                          style={stickyCell("var(--bs-body-bg, #fff)", 2)}
                        >
                          <div className="fw-semibold">{mesin.kodeMesin}</div>
                          <div
                            className="text-secondary small text-truncate"
                            style={{ maxWidth: 168 }}
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
                            const status = plan
                              ? getStatusTampil(plan, today)
                              : null;
                            const meta = plan ? ACTION_META[plan.aksi] : null;

                            let cellBg = "var(--bs-body-bg, #fff)";
                            let cellColor = meta ? meta.color : "#000";
                            let cellBorderColor = meta
                              ? meta.color
                              : "var(--bs-border-color)";

                            if (plan) {
                              if (status === "Selesai") {
                                cellBg = "#198754";
                                cellColor = "#fff";
                                cellBorderColor = "#198754";
                              } else if (status === "Terlewat") {
                                cellBg = "#dc3545";
                                cellColor = "#fff";
                                cellBorderColor = "#dc3545";
                              } else {
                                cellBg = "var(--bs-body-bg, #fff)";
                                cellColor = meta ? meta.color : "#000";
                                cellBorderColor = meta
                                  ? meta.color
                                  : "var(--bs-border-color)";
                              }
                            }

                            return (
                              <td
                                key={`${mesin.id}-${mIdx}-${w}`}
                                className={`text-center p-1 ${
                                  w === 1 ? "border-start" : ""
                                }`}
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
                                      background: cellBg,
                                      color: cellColor,
                                      borderColor: cellBorderColor,
                                    }}
                                    title={cellPlans
                                      .map(
                                        (p) =>
                                          `${p.aksi}\n${
                                            ACTION_META[p.aksi].label
                                          } (${getStatusTampil(p, today)})`
                                      )
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
                                    style={{
                                      width: 24,
                                      height: 24,
                                      cursor: "pointer",
                                    }}
                                    title={`Tambah rencana ${mesin.kodeMesin} Minggu ${w}, ${MONTHS_SHORT[mIdx]}`}
                                    onClick={() =>
                                      openAddModal({
                                        mesinId: mesin.id,
                                        bulan: mIdx + 1,
                                        minggu: w,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openAddModal({
                                          mesinId: mesin.id,
                                          bulan: mIdx + 1,
                                          minggu: w,
                                        });
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
                        <td className="text-end px-4 fw-medium">
                          {formatRupiah(totalRab)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <TanstackTable
              data={filteredPlans}
              columns={listColumns}
              pagination
              isSortable
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Keterangan ---- */}
      <Card className="mb-6">
        <CardBody className="d-flex flex-wrap align-items-center gap-4 small">
          <span className="fw-semibold">Keterangan Tindakan:</span>
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
          <span className="fw-semibold">Status:</span>
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className="d-inline-block rounded bg-body border border-secondary"
              style={{ width: 16, height: 16 }}
            />
            Terjadwal (Putih)
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className="d-inline-block rounded"
              style={{ width: 16, height: 16, background: "#198754" }}
            />
            Selesai (Hijau)
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className="d-inline-block rounded"
              style={{ width: 16, height: 16, background: "#dc3545" }}
            />
            Terlewat (Merah)
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
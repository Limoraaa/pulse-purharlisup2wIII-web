"use client";
// import node module libraries
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DateFilterValue, formatDateFilter } from "components/ruangtools/common/dateUtils";

export interface ExportColumn {
  header: string; // judul kolom yang tampil di file export
  key: string; // nama field pada object data (top-level)
}

// Satu baris pada blok info di bawah kop (mis. "Jenis Laporan : Data Tools")
export interface ExportInfoRow {
  label: string;
  value: string | number;
}

// Isi blok info di bawah kop, disesuaikan per halaman yang meng-export.
// Baris bawaan selalu ada: kiri = Nama Sistem & Jenis Laporan,
// kanan = Tanggal Cetak, Dicetak Oleh & Jumlah Data. `kiri`/`kanan` ditambahkan setelahnya.
export interface ExportInfo {
  kiri?: ExportInfoRow[];
  kanan?: ExportInfoRow[];
}

// ---- Identitas kop surat (sama untuk semua export) ----
const KOP_BARIS = [
  "PT PLN (PERSERO) PUSHARLIS",
  "UNIT PELAKSANA PRODUKSI DAN WORKSHOP III",
  "Jl. Banten No. 10 Bandung 40272",
  "Telp (022) 7236791, 7236792, 7236793 Faks (022) 7236794 | e-mail: pusharlis@pln.co.id",
];
const NAMA_SISTEM = "PULSE PUSHARLIS";

// Path logo PLN -- taruh file logo di folder public/ project kamu,
// sesuaikan path ini kalau nama/lokasi filenya beda.
const LOGO_PATH = "/images/brand/Logo-PLN-polos.png";
const LOGO_RASIO = 2480 / 3397; // lebar : tinggi file logo

// Ambil logo sekali saja lalu di-cache, supaya tidak fetch berulang
// setiap kali tombol Export ditekan.
let cachedLogoBuffer: ArrayBuffer | null = null;
async function getLogoBuffer(): Promise<ArrayBuffer | null> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    cachedLogoBuffer = await res.arrayBuffer();
    return cachedLogoBuffer;
  } catch {
    return null; // logo tidak ketemu -> export tetap jalan tanpa logo
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// "Data Tools" -> "LAPORAN DATA TOOLS"; judul yang sudah diawali "Laporan" tidak digandakan
function judulLaporan(title: string): string {
  const upper = title.trim().toUpperCase();
  return upper.startsWith("LAPORAN") ? upper : `LAPORAN ${upper}`;
}

// Gabungkan baris bawaan dengan baris khusus dari halaman pemanggil
function susunInfo(title: string, jumlahData: number, info?: ExportInfo) {
  let dicetakOleh = "-";
  try {
    dicetakOleh = localStorage.getItem("userName") || "-";
  } catch {
    // localStorage tidak tersedia -> biarkan "-"
  }
  const kiri: ExportInfoRow[] = [
    { label: "Nama Sistem", value: NAMA_SISTEM },
    { label: "Jenis Laporan", value: title },
    ...(info?.kiri ?? []),
  ];
  const kanan: ExportInfoRow[] = [
    {
      label: "Tanggal Cetak",
      value: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    },
    { label: "Dicetak Oleh", value: dicetakOleh },
    { label: "Jumlah Data", value: `${jumlahData} data` },
    ...(info?.kanan ?? []),
  ];
  return { kiri, kanan };
}

// ---- Helper isi blok info yang sering dipakai ----

// Hitung jumlah per status, mis. "Aktif: 10  |  Rusak: 2"
export function ringkasStatus<T extends Record<string, unknown>>(
  data: T[],
  key: keyof T & string,
  label?: (value: string) => string
): string {
  const hitung = new Map<string, number>();
  data.forEach((row) => {
    const v = String(row[key] ?? "").trim() || "-";
    hitung.set(v, (hitung.get(v) ?? 0) + 1);
  });
  if (hitung.size === 0) return "-";
  return Array.from(hitung.entries())
    .map(([v, n]) => `${label ? label(v) : v}: ${n}`)
    .join("  |  ");
}

// Baris "Periode" & "Nama" dari filter yang sedang aktif di halaman riwayat
export function infoFilter(
  tanggalFilter: DateFilterValue | null,
  namaFilter?: string,
  labelNama = "Nama"
): ExportInfoRow[] {
  return [
    { label: "Periode", value: formatDateFilter(tanggalFilter) || "Semua tanggal" },
    { label: labelNama, value: namaFilter && namaFilter !== "Semua" ? namaFilter : "Semua" },
  ];
}

// ---- Kop PDF: logo + identitas, judul, blok info. Mengembalikan posisi Y untuk tabel ----
export async function drawPdfKop(
  doc: jsPDF,
  title: string,
  jumlahData: number,
  info?: ExportInfo,
  margin = 14
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - margin;
  const { kiri, kanan } = susunInfo(title, jumlahData, info);

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Logo + 4 baris identitas
  const logoH = 21;
  const logoW = logoH * LOGO_RASIO;
  let textX = margin;
  const logoBuffer = await getLogoBuffer();
  if (logoBuffer) {
    doc.addImage(
      `data:image/png;base64,${arrayBufferToBase64(logoBuffer)}`,
      "PNG",
      margin,
      8,
      logoW,
      logoH,
      "LOGO",
      "FAST"
    );
    textX = margin + logoW + 4;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(KOP_BARIS[0], textX, 12.5);
  doc.setFontSize(9);
  doc.text(KOP_BARIS[1], textX, 17.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(KOP_BARIS[2], textX, 22.5);
  doc.text(KOP_BARIS[3], textX, 27);

  // Garis ganda pemisah kop
  doc.setLineWidth(0.8);
  doc.line(margin, 31, right, 31);
  doc.setLineWidth(0.2);
  doc.line(margin, 32.2, right, 32.2);

  // Judul laporan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(judulLaporan(title), pageWidth / 2, 38.5, { align: "center" });
  doc.setLineWidth(0.2);
  doc.line(margin, 41, right, 41);

  // Blok info dua kolom
  const half = (right - margin) / 2;
  const kolom = [
    { rows: kiri, labelX: margin, valueX: margin + 32 },
    { rows: kanan, labelX: margin + half + 6, valueX: margin + half + 38 },
  ];
  const STEP = 4.5;
  let y = 45.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  kolom.forEach(({ rows, labelX, valueX }) => {
    const maxW = (labelX === margin ? margin + half : right) - valueX - 2;
    rows.forEach((r, i) => {
      const lines = doc.splitTextToSize(`: ${r.value}`, maxW) as string[];
      const value = lines.length > 1 ? `${lines[0].replace(/\s+\S*$/, "")}…` : lines[0];
      doc.text(r.label, labelX, y + i * STEP);
      doc.text(value, valueX, y + i * STEP);
    });
  });
  const lastY = y + (Math.max(kiri.length, kanan.length) - 1) * STEP;
  doc.line(margin, lastY + 2.5, right, lastY + 2.5);
  y = lastY + 6;
  return y;
}

// ---- Kop Excel: logo + identitas, judul, blok info. Mengembalikan nomor baris berikutnya ----
// Lebar kolom sheet sebaiknya sudah diatur sebelum memanggil ini (dipakai untuk menata blok info).
export async function addExcelKop(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  title: string,
  jumlahData: number,
  lastCol: number,
  info?: ExportInfo
): Promise<number> {
  const { kiri, kanan } = susunInfo(title, jumlahData, info);
  const font = { name: "Calibri" };
  const thin: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FF000000" } };

  // Logo + 4 baris identitas (baris 1-4)
  const logoBuffer = await getLogoBuffer();
  if (logoBuffer) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: 0.2, row: 0.15 },
      ext: { width: Math.round(70 * LOGO_RASIO), height: 70 },
    });
  }
  const kopFont = [
    { size: 12, bold: true },
    { size: 10, bold: true },
    { size: 9 },
    { size: 9 },
  ];
  KOP_BARIS.forEach((teks, i) => {
    const row = sheet.getRow(i + 1);
    row.height = 18;
    const cell = row.getCell(2);
    cell.value = teks;
    cell.font = { ...font, ...kopFont[i] };
    cell.alignment = { vertical: "middle" };
  });
  for (let c = 1; c <= lastCol; c++) {
    sheet.getCell(4, c).border = { bottom: { style: "double", color: { argb: "FF000000" } } };
  }

  // Judul laporan (baris 5)
  sheet.mergeCells(5, 1, 5, lastCol);
  const titleCell = sheet.getCell(5, 1);
  titleCell.value = judulLaporan(title);
  titleCell.font = { ...font, size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = { bottom: thin };
  sheet.getRow(5).height = 24;

  // Blok info dua kolom. Label digabung beberapa kolom kalau kolomnya sempit
  // (mis. kolom minggu di matriks), supaya teks label tidak terpotong.
  const lebar = (c: number) => sheet.getColumn(c).width ?? 9;
  const spanUntuk = (start: number, minChars: number, batas: number) => {
    let end = start;
    let total = lebar(start);
    while (total < minChars && end + 1 < batas) {
      end += 1;
      total += lebar(end);
    }
    return end;
  };
  const tengah = Math.floor(lastCol / 2) + 1;
  const tulisKolom = (rows: ExportInfoRow[], startCol: number, endCol: number, rowStart: number) => {
    rows.forEach((r, i) => {
      const rowNo = rowStart + i;
      const labelEnd = spanUntuk(startCol, 14, endCol);
      if (labelEnd > startCol) sheet.mergeCells(rowNo, startCol, rowNo, labelEnd);
      const valueStart = labelEnd + 1;
      if (endCol > valueStart) sheet.mergeCells(rowNo, valueStart, rowNo, endCol);
      const labelCell = sheet.getCell(rowNo, startCol);
      labelCell.value = r.label;
      labelCell.font = { ...font, size: 9 };
      const valueCell = sheet.getCell(rowNo, valueStart);
      valueCell.value = `: ${r.value}`;
      valueCell.font = { ...font, size: 9 };
    });
  };
  const infoStart = 6;
  tulisKolom(kiri, 1, tengah - 1, infoStart);
  tulisKolom(kanan, tengah, lastCol, infoStart);
  const infoEnd = infoStart + Math.max(kiri.length, kanan.length) - 1;
  for (let c = 1; c <= lastCol; c++) {
    const cell = sheet.getCell(infoEnd, c);
    cell.border = { ...cell.border, bottom: thin };
  }

  return infoEnd + 2; // satu baris kosong sebelum tabel
}

export async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---- Export ke Excel (.xlsx) via ExcelJS -- dengan kop PLN ----
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title: string,
  info?: ExportInfo
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data");

  // Lebar kolom otomatis mengikuti panjang header (minimal 15)
  columns.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = Math.max(col.header.length + 4, 15);
  });

  // Kop selebar tabel, supaya semua isi kop masuk area cetak
  const lastCol = Math.max(columns.length, 4);
  let currentRow = await addExcelKop(workbook, sheet, title, data.length, lastCol, info);

  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFBFBFBF" } },
    bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
    left: { style: "thin", color: { argb: "FFBFBFBF" } },
    right: { style: "thin", color: { argb: "FFBFBFBF" } },
  };

  // ---- Header kolom ----
  const headerRow = sheet.getRow(currentRow);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D6EFD" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = border;
  });
  currentRow += 1;

  // ---- Baris data ----
  data.forEach((row) => {
    const dataRow = sheet.getRow(currentRow);
    columns.forEach((col, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = (row[col.key] as string | number | null | undefined) ?? "";
      cell.border = border;
      cell.alignment = { vertical: "top", wrapText: true };
    });
    currentRow += 1;
  });

  await downloadWorkbook(workbook, fileName);
}

// ---- Export ke PDF -- dengan kop PLN ----
export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title: string,
  info?: ExportInfo
) {
  const doc = new jsPDF({ orientation: "landscape", compress: true });

  const startY = await drawPdfKop(doc, title, data.length, info);

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => String(row[c.key] ?? ""))),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [13, 110, 253] },
  });

  doc.save(`${fileName}.pdf`);
}

// ---- Helper: Generate Nama File Export Dinamis ----
export function getFilteredExportFileName(baseName: string, filterName?: string): string {
  // Ambil tanggal hari ini (Format: YYYY-MM-DD)
  const dateStr = new Date().toISOString().split("T")[0];
  let fileName = baseName;

  // Jika ada filter nama dan bukan "Semua", tambahkan nama tersebut ke file
  if (filterName && filterName !== "Semua") {
    // Ganti spasi dengan underscore agar nama file rapi
    const sanitizedFilter = filterName.replace(/\s+/g, "_");
    fileName += `_${sanitizedFilter}`;
  }

  // Gabungkan semua menjadi: BaseName_NamaPeminjam_Tanggal
  return `${fileName}_${dateStr}`;
}

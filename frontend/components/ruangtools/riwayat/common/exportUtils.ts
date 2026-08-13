"use client";
// import node module libraries
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string; // judul kolom yang tampil di file export
  key: string; // nama field pada object data (top-level)
}

// Tambahkan nama filter ke filename hanya bila user memilih nama tertentu.
// Karakter ilegal untuk nama file dihapus dan spasi dijadikan underscore.
export function getFilteredExportFileName(baseName: string, selectedName?: string): string {
  const name = selectedName?.trim();
  if (!name || name === "Semua" || /^semua\s/i.test(name)) return baseName;

  const safeName = name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

  return safeName ? `${baseName}_${safeName}` : baseName;
}

// Path logo PLN -- taruh file logo di folder public/ project kamu,
// sesuaikan path ini kalau nama/lokasi filenya beda.
const LOGO_PATH = "/images/brand/Logo-PLN-polos.png";

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

// ---- Export ke Excel (.xlsx) via ExcelJS -- mendukung logo gambar ----
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title?: string
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data");

  let currentRow = 1;

  // ---- Kop: logo PLN ----
  const logoBuffer = await getLogoBuffer();
  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 70, height: 70 }, // sesuaikan kalau logo terlihat gepeng/kekecilan
    });
    sheet.getRow(1).height = 55;
    currentRow = 3; // beri jarak baris kosong setelah logo
  }

  // ---- Judul laporan ----
  if (title) {
    sheet.mergeCells(currentRow, 1, currentRow, Math.max(columns.length, 1));
    const titleCell = sheet.getCell(currentRow, 1);
    titleCell.value = title;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };
    currentRow += 2;
  }

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
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  currentRow += 1;

  // ---- Baris data ----
  data.forEach((row) => {
    const dataRow = sheet.getRow(currentRow);
    columns.forEach((col, idx) => {
      dataRow.getCell(idx + 1).value =
        (row[col.key] as string | number | null | undefined) ?? "";
    });
    currentRow += 1;
  });

  // Lebar kolom otomatis mengikuti panjang header (minimal 15)
  columns.forEach((col, idx) => {
    const excelCol = sheet.getColumn(idx + 1);
    excelCol.width = Math.max(col.header.length + 4, 15);
  });

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

// ---- Export ke PDF -- mendukung logo gambar ----
export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title: string
) {
  const doc = new jsPDF({ orientation: "landscape" });

  let startY = 15;
  const logoBuffer = await getLogoBuffer();

  if (logoBuffer) {
    const base64 = arrayBufferToBase64(logoBuffer);
    // posisi & ukuran logo -- sesuaikan angkanya kalau logo terlihat
    // gepeng/kekecilan/kebesaran (satuan: mm, karena default unit jsPDF)
    doc.addImage(`data:image/png;base64,${base64}`, "PNG", 14, 8, 20, 20);
    doc.setFontSize(14);
    doc.text(title, 40, 20);
    startY = 34;
  } else {
    doc.setFontSize(14);
    doc.text(title, 14, 15);
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => String(row[c.key] ?? ""))),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [13, 110, 253] },
  });

  doc.save(`${fileName}.pdf`);
}

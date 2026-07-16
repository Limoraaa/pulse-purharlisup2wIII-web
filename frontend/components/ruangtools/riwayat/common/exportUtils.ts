"use client";
// import node module libraries
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string; // judul kolom yang tampil di file export
  key: string; // nama field pada object data (top-level)
}

// ---- Export ke Excel (.xlsx) ----
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string
) {
  const rows = data.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col) => {
      obj[col.header] = row[col.key];
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// ---- Export ke PDF ----
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title: string
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(title, 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [columns.map((c) => c.header)],
    body: data.map((row) =>
      columns.map((c) => String(row[c.key] ?? ""))
    ),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [13, 110, 253] },
  });

  doc.save(`${fileName}.pdf`);
}

"use client";
import { IconArrowDown, IconArrowUp, IconSelector } from "@tabler/icons-react";

interface KodeBarangSortHeaderProps {
  label: string;
  sortState: false | "asc" | "desc";
}

/**
 * Header interaktif khusus kolom Kode Barang (Data Tools & Data Consumable).
 * Menampilkan 3 kondisi: neutral (↕, redup), ascending (↑, kontras),
 * descending (↓, kontras). Klik ditangani oleh <th> TanstackTable,
 * jadi komponen ini tidak punya onClick sendiri (anti double-toggle).
 */
export default function KodeBarangSortHeader({
  label,
  sortState,
}: KodeBarangSortHeaderProps) {
  return (
    <span className="kode-sort-header">
      <span>{label}</span>
      {sortState === "asc" ? (
        <IconArrowUp size={16} className="kode-sort-icon is-active" />
      ) : sortState === "desc" ? (
        <IconArrowDown size={16} className="kode-sort-icon is-active" />
      ) : (
        <IconSelector size={16} className="kode-sort-icon" />
      )}
    </span>
  );
}

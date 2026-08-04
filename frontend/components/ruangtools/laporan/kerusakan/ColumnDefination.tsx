"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onDetail: (item: LaporanKerusakanType) => void;
  onRepair: (item: LaporanKerusakanType) => void;
}


export const getLaporanKerusakanColumns = ({
  onDetail,
  onRepair,
}: ColumnHandlers): ColumnDef<LaporanKerusakanType>[] => [
  {
    accessorKey: "tanggal_pengembalian",
    header: "Tgl & Jam Pengembalian",
  },
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.kode_barang}</span>
    ),
  },
  {
    accessorKey: "nama_barang",
    header: "Nama Barang",
  },
  {
    accessorKey: "merk",
    header: "Merk",
  },
  {
    accessorKey: "tipe",
    header: "Tipe",
  },
  {
    accessorKey: "warna",
    header: "Warna",
  },
  {
    accessorKey: "ukuran",
    header: "Ukuran",
  },
  {
    accessorKey: "jumlah_rusak",
    header: "Jumlah Rusak",
    cell: ({ row }) => (
      <span className="d-flex justify-content-center">
        <Badge bg="danger-subtle" text="danger-emphasis" className="fw-semibold">
          {row.original.jumlah_rusak}
        </Badge>
      </span>
    ),
  },
  {
    accessorKey: "nama_peminjam",
    header: "Nama Peminjam",
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
  },
  {
    accessorKey: "nama_pekerjaan",
    header: "Nama Pekerjaan",
  },
  {
    accessorKey: "area_kerja",
    header: "Area Kerja",
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const text = row.original.keterangan;
      const truncated = text.length > 30 ? `${text.slice(0, 30)}...` : text;
      return <span className="text-secondary small">{truncated || "-"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        bg={row.original.status === "diperbaiki" ? "success-subtle" : "danger-subtle"}
        text={row.original.status === "diperbaiki" ? "success-emphasis" : "danger-emphasis"}
        className="fw-semibold"
      >
        {row.original.status === "diperbaiki" ? "Diperbaiki" : "Rusak"}
      </Badge>
    ),
  },
  {
  id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      const sudahDiperbaiki = item.status === "diperbaiki";

      return (
        <ActionMenu
          toggleButton={<IconDotsVertical size={20} />}
          className="btn btn-ghost btn-icon btn-sm rounded-circle"
          drop="start"
          align="start"
        >
          <Dropdown.Item onClick={() => onDetail(item)}>
            Detail Laporan
          </Dropdown.Item>
          {!sudahDiperbaiki && (
            <Dropdown.Item className="text-success" onClick={() => onRepair(item)}>
              Repair Alat
            </Dropdown.Item>
          )}
        </ActionMenu>
      );
    },
  },
];

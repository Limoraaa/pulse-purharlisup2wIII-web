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
}

export const getRiwayatPerbaikanColumns = ({
  onDetail,
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
    header: "Jumlah Diperbaiki",
    cell: ({ row }) => (
      <span className="d-flex justify-content-center">
        <Badge bg="success-subtle" text="success-emphasis" className="fw-semibold">
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
    id: "status",
    header: "Status",
    cell: () => (
      <Badge bg="success-subtle" text="success-emphasis" className="fw-semibold">
        Sudah Diperbaiki
      </Badge>
    ),
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => (
      <ActionMenu
        toggleButton={<IconDotsVertical size={20} />}
        className="btn btn-ghost btn-icon btn-sm rounded-circle"
        drop="start"
        align="start"
      >
        <Dropdown.Item onClick={() => onDetail(row.original)}>
          Detail Laporan
        </Dropdown.Item>
      </ActionMenu>
    ),
  },
];
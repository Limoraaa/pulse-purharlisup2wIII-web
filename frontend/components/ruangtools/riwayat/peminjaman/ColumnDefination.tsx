"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { RiwayatPeminjamanType } from "types/RiwayatTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onDetail: (item: RiwayatPeminjamanType) => void;
}

export const getRiwayatPeminjamanColumns = ({
  onDetail,
}: ColumnHandlers): ColumnDef<RiwayatPeminjamanType>[] => [
  {
    accessorKey: "tanggal_pinjam",
    header: "Tanggal & Waktu Pinjam",
  },
  {
    accessorKey: "tanggal_kembali",
    header: "Tanggal & Waktu Kembali",
  },
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
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
    accessorKey: "jumlah",
    header: "Jumlah",
    cell: ({ row }) => (
      <span className="d-flex justify-content-center">
        <Badge bg="primary-subtle" text="primary-emphasis" className="fw-semibold">
          {row.original.jumlah}
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
    accessorKey: "area_kerja",
    header: "Area Kerja",
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
          Detail Transaksi
        </Dropdown.Item>
      </ActionMenu>
    ),
  },
];

"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { ToolMasukType } from "types/DataToolsTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onEdit: (item: ToolMasukType) => void;
  onDelete: (item: ToolMasukType) => void;
}

const formatTanggal = (raw: string): string => {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;

  const tanggal = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const jam = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${tanggal}, ${jam}`;
};

export const getToolMasukColumns = ({
  onEdit,
  onDelete,
}: ColumnHandlers): ColumnDef<ToolMasukType>[] => [
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => formatTanggal(row.original.tanggal),
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
    accessorKey: "jumlah_masuk",
    header: "Jumlah Masuk",
    cell: ({ row }) => (
      <span className="d-flex justify-content-center">
        <Badge bg="success-subtle" text="success-emphasis" className="fw-semibold">
          +{row.original.jumlah_masuk}
        </Badge>
      </span>
    ),
  },
  {
    id: "penginput",
    header: "Penginput",
    cell: ({ row }) => {
      const penginput = row.original.dicatatOleh;
      const userName = penginput?.name || "Tidak Diketahui";
      return <span className="fw-medium text-gray-700">{userName}</span>;
    },
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
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
        <Dropdown.Item onClick={() => onEdit(row.original)}>
          Edit Data
        </Dropdown.Item>
        <Dropdown.Item
          className="text-danger"
          onClick={() => onDelete(row.original)}
        >
          Hapus Data
        </Dropdown.Item>
      </ActionMenu>
    ),
  },
];
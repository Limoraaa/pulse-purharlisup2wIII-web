"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { ConsumableMasukType } from "types/DataConsumableTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onEdit: (item: ConsumableMasukType) => void;
  onDelete: (item: ConsumableMasukType) => void;
}

export const getConsumableMasukColumns = ({
  onEdit,
  onDelete,
}: ColumnHandlers): ColumnDef<ConsumableMasukType>[] => [
  {
    accessorKey: "tanggal",
    header: "Tanggal",
  },
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.kode_barang}</span>
    ),
  },
  {
    accessorKey: "nama",
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
    accessorKey: "er_e",
    header: "ER/E",
  },
  {
    accessorKey: "ukuran",
    header: "Ukuran",
  },
  {
    accessorKey: "jumlah_masuk",
    header: "Jumlah Masuk",
    cell: ({ row }) => (
      <span className="text-center d-block fw-bold text-success">
        +{row.original.jumlah_masuk}
      </span>
    ),
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

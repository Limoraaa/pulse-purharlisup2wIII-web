"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "react-bootstrap";
import { IconDotsVertical, IconShoppingCartPlus } from "@tabler/icons-react";

// import custom types
import { ConsumableItemType } from "types/DataConsumableTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onDetail: (consumable: ConsumableItemType) => void;
  onEdit: (consumable: ConsumableItemType) => void;
  onDelete: (consumable: ConsumableItemType) => void;
  onStockIn: (consumable: ConsumableItemType) => void;  // Restock
  onStockOut: (consumable: ConsumableItemType) => void; // Pengambilan
}

export const getConsumableColumns = ({
  onDetail,
  onEdit,
  onDelete,
  onStockIn,
  onStockOut,
}: ColumnHandlers): ColumnDef<ConsumableItemType>[] => [
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.kode_barang}</span>
    ),
  },
  {
    accessorKey: "nama",
    header: "Nama Consumable",
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
    accessorKey: "stok_awal",
    header: "Stok Tersedia",
    cell: ({ row }) => (
      <span className="text-center d-block fw-bold text-blue-600">
        {row.original.stok_awal}
      </span>
    ),
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const isHabis = row.original.stok_awal <= 0;
      return (
        <div className="d-flex align-items-center gap-2">
          {/* Tombol Utama: Ambil Bahan */}
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            disabled={isHabis}
            title={isHabis ? "Stok habis" : "Ambil bahan"}
            onClick={() => onStockOut(row.original)}
          >
            <IconShoppingCartPlus size={16} />
            Ambil Bahan
          </button>

          {/* Menu Aksi Lainnya */}
          <ActionMenu
            toggleButton={<IconDotsVertical size={20} />}
            className="btn btn-ghost btn-icon btn-sm rounded-circle"
            drop="start"
            align="start"
          >
            <Dropdown.Item onClick={() => onStockIn(row.original)}>
              Tambah Stok
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onDetail(row.original)}>
              Detail Bahan
            </Dropdown.Item>
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
        </div>
      );
    },
  },
];

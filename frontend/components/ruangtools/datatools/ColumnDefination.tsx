// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Dropdown } from "react-bootstrap";
import { IconDotsVertical, IconShoppingCartPlus } from "@tabler/icons-react";

// import custom types
import { ToolItemType, ToolCondition } from "types/DataToolsTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

// warna badge sesuai kondisi alat
const kondisiVariant = (kondisi: ToolCondition) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak":
      return { bg: "danger-subtle", text: "danger-emphasis" };
  }
};

interface ColumnHandlers {
  onDetail: (tool: ToolItemType) => void;
  onEdit: (tool: ToolItemType) => void;
  onDelete: (tool: ToolItemType) => void;
  onAddToCart: (tool: ToolItemType) => void;
}

// Dibuat sebagai function (bukan array statis) karena kolom "Aksi" butuh
// akses ke handler dari komponen induk (buka modal detail/edit/hapus/keranjang).
export const getDataToolsColumns = ({
  onDetail,
  onEdit,
  onDelete,
  onAddToCart,
}: ColumnHandlers): ColumnDef<ToolItemType>[] => [
  {
    accessorKey: "kodeBarang",
    header: "Kode Barang",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.kodeBarang}</span>
    ),
  },
  {
    accessorKey: "namaBarang",
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
    accessorKey: "kondisi",
    header: "Kondisi",
    cell: ({ row }) => {
      const { bg, text } = kondisiVariant(row.original.kondisi);
      return (
        <Badge bg={bg} text={text}>
          {row.original.kondisi}
        </Badge>
      );
    },
  },
  {
    accessorKey: "stok",
    header: "Stok",
    cell: ({ row }) => (
      <span className="text-center d-block">{row.original.stok}</span>
    ),
  },
  {
    accessorKey: "dipinjam",
    header: "Dipinjam",
    cell: ({ row }) => (
      <span className="text-center d-block">{row.original.dipinjam}</span>
    ),
  },
  {
    id: "tersedia",
    header: "Tersedia",
    cell: ({ row }) => {
      const tersedia = row.original.stok - row.original.dipinjam;
      return (
        <span
          className={`text-center d-block fw-semibold ${
            tersedia <= 0 ? "text-danger" : "text-success"
          }`}
        >
          {tersedia}
        </span>
      );
    },
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const tersedia = row.original.stok - row.original.dipinjam;
      const habis = tersedia <= 0;
      return (
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            disabled={habis}
            title={habis ? "Stok tidak tersedia" : "Tambah ke Peminjaman"}
            onClick={() => onAddToCart(row.original)}
          >
            <IconShoppingCartPlus size={16} />
            Tambah ke Peminjaman
          </button>
          <ActionMenu
            toggleButton={<IconDotsVertical size={20} />}
            className="btn btn-ghost btn-icon btn-sm rounded-circle"
            drop="start"
            align="start"
          >
            <Dropdown.Item onClick={() => onDetail(row.original)}>
              Detail Alat
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

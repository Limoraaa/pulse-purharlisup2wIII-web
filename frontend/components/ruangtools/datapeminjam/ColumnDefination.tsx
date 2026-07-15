// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { PeminjamType } from "types/DataToolsTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onEdit: (peminjam: PeminjamType) => void;
  onDelete: (peminjam: PeminjamType) => void;
}

export const getDataPeminjamColumns = ({
  onEdit,
  onDelete,
}: ColumnHandlers): ColumnDef<PeminjamType>[] => [
  {
    accessorKey: "nama",
    header: "Nama Pegawai",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.nama}</span>
    ),
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
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

"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge, Spinner } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

import { PeminjamType } from "types/DataToolsTypes";
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onEdit: (item: PeminjamType) => void;
  onDelete: (item: PeminjamType) => void; // nonaktifkan
  onAktifkan: (item: PeminjamType) => void;
  togglingId?: string | null; // id yang sedang diproses aktifkan/nonaktifkan
}

export const getPeminjamColumns = ({
  onEdit,
  onDelete,
  onAktifkan,
  togglingId,
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
    accessorKey: "aktif",
    header: "Status",
    cell: ({ row }) => {
      const aktif = row.original.aktif;
      return (
        <Badge bg={aktif ? "success-subtle" : "secondary-subtle"} text={aktif ? "success-emphasis" : "secondary-emphasis"}>
          {aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      );
    },
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      const isToggling = togglingId === item.id;

      return (
        <ActionMenu
          toggleButton={
            isToggling ? <Spinner animation="border" size="sm" /> : <IconDotsVertical size={20} />
          }
          className="btn btn-ghost btn-icon btn-sm rounded-circle"
          drop="start"
          align="start"
        >
          <Dropdown.Item onClick={() => onEdit(item)}>
            Edit Data
          </Dropdown.Item>
          {item.aktif ? (
            <Dropdown.Item
              className="text-danger"
              onClick={() => onDelete(item)}
              disabled={isToggling}
            >
              Nonaktifkan
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              className="text-success"
              onClick={() => onAktifkan(item)}
              disabled={isToggling}
            >
              Aktifkan Kembali
            </Dropdown.Item>
          )}
        </ActionMenu>
      );
    },
  },
];
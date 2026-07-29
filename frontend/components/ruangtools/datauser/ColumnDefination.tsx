"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

import { UserItemType } from "types/DataUserTypes";
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  isAdmin: boolean;
  onEdit: (item: UserItemType) => void;
  onDelete: (item: UserItemType) => void;
  onResetPassword: (item: UserItemType) => void;
}

export const getDataUserColumns = ({
  isAdmin,
  onEdit,
  onDelete,
  onResetPassword,
}: ColumnHandlers): ColumnDef<UserItemType>[] => [
  {
    accessorKey: "full_name",
    header: "Nama Lengkap",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge
        bg={row.original.role === "super_admin" ? "primary-subtle" : "success-subtle"}
        text={row.original.role === "super_admin" ? "primary-emphasis" : "success-emphasis"}
      >
        {row.original.role === "super_admin" ? "Super Admin" : "Staff"}
      </Badge>
    ),
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
    cell: ({ row }) => row.original.divisi || "-",
  },
  {
    accessorKey: "no_hp",
    header: "Nomor HP",
    cell: ({ row }) => row.original.no_hp || "-",
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const target = row.original;

      // Staff tidak boleh edit user ber-role admin (kecuali dirinya sendiri, tapi staff selalu ber-role staff jadi ini otomatis aman)
        const canEdit = isAdmin;
        const canDelete = isAdmin;
        const canResetPassword = isAdmin;

      // Kalau staff tidak bisa lakukan apa-apa ke baris ini, jangan render menu kosong
      if (!canEdit && !canDelete && !canResetPassword) {
        return <span className="text-secondary small">-</span>;
      }

      return (
        <ActionMenu
          toggleButton={<IconDotsVertical size={20} />}
          className="btn btn-ghost btn-icon btn-sm rounded-circle"
          drop="start"
          align="start"
        >
          {canEdit && (
            <Dropdown.Item onClick={() => onEdit(target)}>Edit</Dropdown.Item>
          )}
          {canResetPassword && (
            <Dropdown.Item onClick={() => onResetPassword(target)}>
              Reset Password
            </Dropdown.Item>
          )}
          {canDelete && (
            <Dropdown.Item className="text-danger" onClick={() => onDelete(target)}>
              Hapus
            </Dropdown.Item>
          )}
        </ActionMenu>
      );
    },
  },
];
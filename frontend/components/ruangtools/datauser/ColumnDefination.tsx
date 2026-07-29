"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

import { UserItemType } from "types/DataUserTypes";
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  isAdmin: boolean;
  onEdit: (item: UserItemType) => void;
  onDeactivate: (item: UserItemType) => void;
  onActivate: (item: UserItemType) => void;
  onResetPassword: (item: UserItemType) => void;
}

export const getDataUserColumns = ({
  isAdmin,
  onEdit,
  onDeactivate,
  onActivate,
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
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        bg={row.original.is_active ? "success-subtle" : "secondary-subtle"}
        text={row.original.is_active ? "success-emphasis" : "secondary-emphasis"}
      >
        {row.original.is_active ? "Aktif" : "Nonaktif"}
      </Badge>
    ),
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const target = row.original;

      const canEdit = isAdmin;
      const canToggleActive = isAdmin;
      const canResetPassword = isAdmin;

      if (!canEdit && !canToggleActive && !canResetPassword) {
        return <span className="text-secondary small">-</span>;
      }

      return (
        <ActionMenu
          toggleButton={<IconDotsVertical size={20} />}
          className="btn btn-ghost btn-icon btn-sm rounded-circle"
          drop="start"
          align="start"
        >
          {canEdit && <Dropdown.Item onClick={() => onEdit(target)}>Edit</Dropdown.Item>}
          {canResetPassword && (
            <Dropdown.Item onClick={() => onResetPassword(target)}>Reset Password</Dropdown.Item>
          )}
          {canToggleActive && target.is_active && (
            <Dropdown.Item className="text-danger" onClick={() => onDeactivate(target)}>
              Nonaktifkan
            </Dropdown.Item>
          )}
          {canToggleActive && !target.is_active && (
            <Dropdown.Item className="text-success" onClick={() => onActivate(target)}>
              Aktifkan
            </Dropdown.Item>
          )}
        </ActionMenu>
      );
    },
  },
];
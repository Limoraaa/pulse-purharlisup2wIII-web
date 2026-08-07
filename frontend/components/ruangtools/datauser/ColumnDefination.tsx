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
}: ColumnHandlers): ColumnDef<UserItemType>[] => {
  const baseColumns: ColumnDef<UserItemType>[] = [
    {
      accessorKey: "full_name",
      header: "Nama Lengkap",
    },
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "-",
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
  ];

  // Kolom "Aksi" cuma ditambahkan kalau yang login Admin -- staff tidak melihat kolom ini sama sekali
  if (!isAdmin) {
    return baseColumns;
  }

  return [
    ...baseColumns,
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => {
        const target = row.original;

        return (
          <ActionMenu
            toggleButton={<IconDotsVertical size={20} />}
            className="btn btn-ghost btn-icon btn-sm rounded-circle"
            drop="start"
            align="start"
          >
            <Dropdown.Item onClick={() => onEdit(target)}>Edit</Dropdown.Item>
            <Dropdown.Item onClick={() => onResetPassword(target)}>Reset Password</Dropdown.Item>
            {target.is_active && (
              <Dropdown.Item className="text-danger" onClick={() => onDeactivate(target)}>
                Nonaktifkan
              </Dropdown.Item>
            )}
            {!target.is_active && (
              <Dropdown.Item className="text-success" onClick={() => onActivate(target)}>
                Aktifkan
              </Dropdown.Item>
            )}
          </ActionMenu>
        );
      },
    },
  ];
};
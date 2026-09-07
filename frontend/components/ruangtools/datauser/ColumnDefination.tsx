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

// Fungsi pembantu untuk memetakan warna badge dan label berdasarkan Role
const getRoleBadgeStyle = (role: string) => {
  // Ubah ke huruf kecil untuk menangani sisa-sisa data lama di database
  const normalizedRole = role?.toLowerCase() || "";

  if (normalizedRole === "super admin" || normalizedRole === "super_admin" || normalizedRole === "superadmin") {
    return { bg: "danger-subtle", text: "danger-emphasis", label: "Super Admin" }; // Merah
  }
  if (normalizedRole === "admin") {
    return { bg: "primary-subtle", text: "primary-emphasis", label: "Admin" }; // Biru
  }
  if (normalizedRole === "team leader") {
    return { bg: "warning-subtle", text: "warning-emphasis", label: "Team Leader" }; // Kuning
  }
  if (normalizedRole === "pegawai") {
    return { bg: "info-subtle", text: "info-emphasis", label: "Pegawai" }; // Biru Muda/Cyan
  }
  
  // Default (Staff atau tidak dikenal)
  return { bg: "success-subtle", text: "success-emphasis", label: "Staff" }; // Hijau
};

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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        // Panggil fungsi pembantu di atas
        const badgeStyle = getRoleBadgeStyle(row.original.role);
        return (
          <Badge bg={badgeStyle.bg} text={badgeStyle.text}>
            {badgeStyle.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "divisi",
      header: "Divisi",
      cell: ({ row }) => row.original.divisi || "-",
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
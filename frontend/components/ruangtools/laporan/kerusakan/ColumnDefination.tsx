"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onDetail: (item: LaporanKerusakanType) => void;
  onRepair: (item: LaporanKerusakanType) => void;
  onTandaiPermanen: (item: LaporanKerusakanType) => void; 
}


export const getLaporanKerusakanColumns = ({
  onDetail,
  onRepair,
  onTandaiPermanen,
}: ColumnHandlers): ColumnDef<LaporanKerusakanType>[] => [
  {
    accessorKey: "tanggal_pengembalian",
    header: "Tgl & Jam Pengembalian",
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
    accessorKey: "jumlah_rusak",
    header: "Jumlah Rusak",
    cell: ({ row }) => (
      <span className="d-flex justify-content-center">
        <Badge bg="danger-subtle" text="danger-emphasis" className="fw-semibold">
          {row.original.jumlah_rusak}
        </Badge>
      </span>
    ),
  },
  {
    accessorKey: "nama_peminjam",
    header: "Nama Peminjam",
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
  },
  {
    accessorKey: "nama_pekerjaan",
    header: "Nama Pekerjaan",
  },
  {
    accessorKey: "area_kerja",
    header: "Area Kerja",
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const text = row.original.keterangan;
      const truncated = text.length > 30 ? `${text.slice(0, 30)}...` : text;
      return <span className="text-secondary small">{truncated || "-"}</span>;
    },
  },
   {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = {
        bisa_diperbaiki: { bg: "warning-subtle", text: "warning-emphasis", label: "Bisa Diperbaiki" },
        rusak_permanen: { bg: "danger-subtle", text: "danger-emphasis", label: "Rusak Permanen" },
        selesai_diperbaiki: { bg: "success-subtle", text: "success-emphasis", label: "Sudah Diperbaiki" },
        rusak: { bg: "danger-subtle", text: "danger-emphasis", label: "Rusak Permanen" },
      }[status] ?? { bg: "secondary-subtle", text: "secondary-emphasis", label: status };

      return (
        <Badge bg={config.bg} text={config.text} className="fw-semibold">
          {config.label}
        </Badge>
      );
    },
  },
   {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      const bisaDiperbaiki = item.status === "bisa_diperbaiki";

      return (
        <ActionMenu
          toggleButton={<IconDotsVertical size={20} />}
          className="btn btn-ghost btn-icon btn-sm rounded-circle"
          drop="start"
          align="start"
        >
           <Dropdown.Item onClick={() => onDetail(item)}>
            Detail Laporan
          </Dropdown.Item>
          {bisaDiperbaiki && (
            <>
              <Dropdown.Item className="text-success" onClick={() => onRepair(item)}>
                Repair Alat
              </Dropdown.Item>
              <Dropdown.Item className="text-danger" onClick={() => onTandaiPermanen(item)}>
                Tandai Rusak Permanen
              </Dropdown.Item>
            </>
          )}
        </ActionMenu>
      );
    },
  },
];

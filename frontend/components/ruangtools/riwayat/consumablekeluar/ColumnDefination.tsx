"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { RiwayatConsumableKeluarType } from "types/RiwayatTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onDetail: (item: RiwayatConsumableKeluarType) => void;
}

const truncate = (text: string, max = 30) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

export const getRiwayatConsumableKeluarColumns = ({
  onDetail,
}: ColumnHandlers): ColumnDef<RiwayatConsumableKeluarType>[] => [
  {
    accessorKey: "tanggal_pengambilan",
    header: "Tanggal & Waktu Pengambilan",
  },
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
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
    accessorKey: "er_e",
    header: "ER/E",
  },
  {
    accessorKey: "ukuran",
    header: "Ukuran",
  },
  {
    accessorKey: "jumlah",
    header: "Jumlah",
    cell: ({ row }) => (
      <span className="text-center d-block">{row.original.jumlah}</span>
    ),
  },
  {
    accessorKey: "nama_peminta",
    header: "Nama Peminta",
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
    cell: ({ row }) => (
      <span className="text-secondary small">
        {row.original.keterangan ? truncate(row.original.keterangan) : "-"}
      </span>
    ),
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
        <Dropdown.Item onClick={() => onDetail(row.original)}>
          Detail Transaksi
        </Dropdown.Item>
      </ActionMenu>
    ),
  },
];
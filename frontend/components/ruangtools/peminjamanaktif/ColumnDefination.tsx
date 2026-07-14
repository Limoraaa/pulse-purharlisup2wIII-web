// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "react-bootstrap";
import { IconEye } from "@tabler/icons-react";

// import custom types
import { TransaksiPeminjamanType } from "types/DataToolsTypes";

interface ColumnHandlers {
  onDetail: (transaksi: TransaksiPeminjamanType) => void;
}

export const getPeminjamanAktifColumns = ({
  onDetail,
}: ColumnHandlers): ColumnDef<TransaksiPeminjamanType>[] => [
  {
    accessorKey: "namaPeminjam",
    header: "Nama Peminjam",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.namaPeminjam}</span>
    ),
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
  },
  {
    accessorKey: "areaKerja",
    header: "Area Kerja",
  },
  {
    id: "jumlahJenisBarang",
    header: "Jumlah Jenis Barang",
    cell: ({ row }) => (
      <span className="text-center d-block">{row.original.items.length}</span>
    ),
  },
  {
    id: "totalBarang",
    header: "Total Barang",
    cell: ({ row }) => {
      const total = row.original.items.reduce((sum, it) => sum + it.jumlah, 0);
      return <span className="text-center d-block">{total}</span>;
    },
  },
  {
    accessorKey: "tanggalPeminjaman",
    header: "Tanggal Pinjam",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const colorCode = status === "Sedang Dipinjam" ? "primary" : "success";
      return (
        <Badge bg={`${colorCode}-subtle`} text={`${colorCode}-emphasis`}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => (
      <Button
        size="sm"
        variant="outline-primary"
        className="d-flex align-items-center gap-1"
        onClick={() => onDetail(row.original)}
      >
        <IconEye size={16} />
        Detail Transaksi
      </Button>
    ),
  },
];

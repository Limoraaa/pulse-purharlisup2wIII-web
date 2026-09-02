// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "react-bootstrap";

// import custom types
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

// Ubah timestamp mentah dari database (ISO string, mis. "2026-07-15T01:27:41.000000Z")
// jadi format tanggal + jam yang enak dibaca (mis. "15 Jul 2026, 08:27")
const formatTanggal = (raw: string): string => {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw; // fallback kalau formatnya tidak dikenali

  const tanggal = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const jam = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${tanggal}, ${jam}`;
};

export const getPeminjamanAktifColumns = (): ColumnDef<PeminjamanAktifItemType>[] => [
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => formatTanggal(row.original.tanggal),
  },
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
    header: "Merk Barang",
  },
  {
    accessorKey: "tipe",
    header: "Type",
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
    accessorKey: "jumlah",
    header: "Jumlah",
    cell: ({ row }) => (
      <span className="d-flex justify-content-center">
        <Badge bg="primary-subtle" text="primary-emphasis" className="fw-semibold">
          {row.original.jumlah}
        </Badge>
      </span>
    ),
  },
  {
    accessorKey: "namaPeminjam",
    header: "Peminjam",
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
  },
  {
    accessorKey: "namaPekerjaan",
    header: "Nama Pekerjaan",
  },
  {
    accessorKey: "areaKerja",
    header: "Area Pekerjaan",
  },
  {
    accessorKey: "spesifikasi",
    header: "Spesifikasi",
  },
    {
    accessorKey: "keterangan",
    header: "Keterangan",
  },
];

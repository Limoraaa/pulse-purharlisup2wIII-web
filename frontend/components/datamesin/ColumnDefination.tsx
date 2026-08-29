import { useMemo } from "react";
import { Button } from "react-bootstrap";
import { IconClipboardList, IconActivity } from "@tabler/icons-react";
import Link from "next/link";

export const useMesinColumns = () => {
  return useMemo(
    () => [
      { header: "No", cell: (info: any) => info.row.index + 1 },
      { accessorKey: "kode_mesin", header: "Kode Mesin" },
      { accessorKey: "nama_mesin", header: "Nama Mesin" },
      { accessorKey: "lokasi_ruang", header: "Lokasi / Ruang" },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info: any) => {
          const val = info.getValue();
          const badgeClass =
            val === "Aktif"
              ? "bg-success text-white px-2 py-1 rounded small"
              : val === "Maintenance"
              ? "bg-warning text-dark px-2 py-1 rounded small"
              : "bg-danger text-white px-2 py-1 rounded small";
          return <span className={badgeClass}>{val}</span>;
        },
      },
      {
        id: "aksi",
        header: "Aksi Log",
        cell: (info: any) => {
          const mesin = info.row.original;
          return (
            <div className="d-flex gap-2">
              <Link href={`/pemeliharaan/mesin/${mesin.id}`}>
                <Button variant="outline-primary" size="sm" className="d-flex align-items-center gap-1">
                  <IconClipboardList size={14} /> Pemeliharaan
                </Button>
              </Link>
              <Link href={`/pemeliharaan/aktivitas-mesin?id=${mesin.id}`}>
                <Button variant="outline-success" size="sm" className="d-flex align-items-center gap-1">
                  <IconActivity size={14} /> Aktivitas
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );
};
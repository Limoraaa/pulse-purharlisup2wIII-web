import { useMemo } from "react";
import { Button } from "react-bootstrap";
import { IconClipboardList, IconActivity } from "@tabler/icons-react";
import Link from "next/link";

// Tambahkan interface untuk menerima fungsi dari komponen induk (Manager)
interface UseMesinColumnsProps {
  onToggleStatus: (id: number | string) => void;
  onOpenDetail: (mesin: any) => void; // Tambahan untuk membuka panel detail log
}

export const useMesinColumns = ({ onToggleStatus, onOpenDetail }: UseMesinColumnsProps) => {
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
          const id = info.row.original.id; // Ambil ID mesin untuk di-toggle
          
          // Logika disesuaikan dengan DB baru: Aktif (Hijau), Tidak Aktif (Merah)
          const badgeClass =
            val === "Aktif"
              ? "bg-success text-white px-3 py-2 rounded small fw-semibold"
              : "bg-danger text-white px-3 py-2 rounded small fw-semibold";
              
          return (
            <span 
              className={badgeClass} 
              style={{ cursor: "pointer", userSelect: "none", transition: "0.2s" }}
              title="Klik untuk ubah status Aktif / Tidak Aktif"
              onClick={() => onToggleStatus(id)}
            >
              {val}
            </span>
          );
        },
      },
      {
        id: "aksi",
        header: "Aksi Log",
        cell: (info: any) => {
          const mesin = info.row.original;
          return (
            <div className="d-flex gap-2">
              {/* Gunakan fungsi onOpenDetail untuk beralih viewMode */}
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="d-flex align-items-center gap-1"
                onClick={() => onOpenDetail(mesin)}
              >
                <IconClipboardList size={14} /> Pemeliharaan
              </Button>
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
    [onToggleStatus, onOpenDetail] // Dependency agar React terus memantau fungsi ini
  );
};
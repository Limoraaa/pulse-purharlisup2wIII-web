import { useMemo } from "react";
import { Button } from "react-bootstrap";
import { IconClipboardList, IconActivity, IconQrcode } from "@tabler/icons-react";
import Link from "next/link";

// Tambahkan interface untuk menerima fungsi dari komponen induk (Manager)
interface UseMesinColumnsProps {
  onToggleStatus: (id: number | string) => void;
  onOpenDetail: (mesin: any) => void; // Tambahan untuk membuka panel detail log
}

export const useMesinColumns = ({ onToggleStatus, onOpenDetail }: UseMesinColumnsProps) => {
  
  // Fungsi untuk mendownload QR Code berdasarkan kode mesin
  const handleDownloadQR = async (mesin: any) => {
    try {
      // Teks yang akan disimpan di dalam QR Code
      const qrText = `MESIN-${mesin.kode_mesin}`; 
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

      // Ambil gambar QR sebagai blob agar bisa di-download oleh browser
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      
      // Buat link unduhan virtual
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QR-Code-${mesin.kode_mesin}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Bersihkan DOM
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Gagal mendownload QR Code");
    }
  };

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
            <div className="d-flex flex-wrap gap-2 align-items-center">
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

              {/* Tombol Download QR Code */}
              <Button
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-1"
                title="Download QR Code Mesin"
                onClick={() => handleDownloadQR(mesin)}
              >
                <IconQrcode size={14} /> QR
              </Button>
            </div>
          );
        },
      },
    ],
    [onToggleStatus, onOpenDetail] // Dependency agar React terus memantau fungsi ini
  );
};
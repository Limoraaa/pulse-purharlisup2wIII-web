import { useMemo } from "react";
import { Button } from "react-bootstrap";
import { IconClipboardList, IconQrcode } from "@tabler/icons-react";

// Disesuaikan dengan atribut fillable pada Model MotorKonversi Laravel
export interface MotorKonversiItemType {
  id: number | string;
  nomor_polisi: string;
  nama_motor: string;
  merek: string;
  warna: string;
  lokasi_penempatan: string;
  status: 'Aktif' | 'Dalam Perbaikan' | 'Nonaktif' | string;
}

interface UseMotorKonversiColumnsProps {
  onToggleStatus: (id: number | string) => void;
  onOpenDetail: (motor: MotorKonversiItemType) => void;
}

export const useMotorKonversiColumns = ({ onToggleStatus, onOpenDetail }: UseMotorKonversiColumnsProps) => {
  
  const handleDownloadQR = async (motor: MotorKonversiItemType) => {
    try {
      const qrText = `MOTOR-KONVERSI-${motor.nomor_polisi}`; 
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

      const response = await fetch(qrApiUrl);
      
      if (!response.ok) {
        throw new Error("Gagal mengambil gambar QR Code dari server.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.href = blobUrl;
      link.download = `QR-Code-${motor.nomor_polisi.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mendownload QR Code.");
    }
  };

  return useMemo(
    () => [
      { 
        id: "index", 
        header: "No", 
        cell: (info: any) => info.row.index + 1 
      },
      { accessorKey: "nomor_polisi", header: "Nomor Polisi" },
      { accessorKey: "nama_motor", header: "Nama Motor" },
      { accessorKey: "merek", header: "Merek" },
      { accessorKey: "lokasi_penempatan", header: "Lokasi Penempatan" },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info: any) => {
          const val = info.getValue() as string;
          const id = info.row.original.id; 
          
          let badgeClass = "bg-secondary text-white px-3 py-2 rounded small fw-semibold";
          if (val === "Aktif") {
            badgeClass = "bg-success text-white px-3 py-2 rounded small fw-semibold";
          } else if (val === "Dalam Perbaikan") {
            badgeClass = "bg-warning text-dark px-3 py-2 rounded small fw-semibold";
          } else if (val === "Nonaktif") {
            badgeClass = "bg-danger text-white px-3 py-2 rounded small fw-semibold";
          }
              
          return (
            <span 
              className={badgeClass} 
              style={{ cursor: "pointer", userSelect: "none", transition: "0.2s" }}
              title="Klik untuk ubah status motor"
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
          const motor = info.row.original as MotorKonversiItemType;
          
          return (
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="d-flex align-items-center gap-1"
                onClick={() => onOpenDetail(motor)}
              >
                <IconClipboardList size={14} /> Pemeliharaan
              </Button>

              <Button
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-1"
                title="Download QR Code Motor Konversi"
                onClick={() => handleDownloadQR(motor)}
              >
                <IconQrcode size={14} /> QR
              </Button>
            </div>
          );
        },
      },
    ],
    [onToggleStatus, onOpenDetail] 
  );
};
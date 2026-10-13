import { useMemo } from "react";
import { Button, Dropdown } from "react-bootstrap";
import { IconClipboardList, IconActivity, IconQrcode, IconFileDescription } from "@tabler/icons-react";
import Link from "next/link";
import DasherTippy from "components/common/DasherTippy";

interface UseMesinColumnsProps {
  onToggleStatus: (id: number | string) => void;
  onOpenDetail: (mesin: any) => void;
}

// Helper download QR dipakai ulang oleh tampilan tabel (desktop)
// dan card view (mobile). Logic tidak berubah.
export const downloadMesinQR = async (mesin: any) => {
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

export const useMesinColumns = ({ onToggleStatus, onOpenDetail }: UseMesinColumnsProps) => {

  // Fungsi untuk mendownload QR Code berdasarkan kode mesin
  const handleDownloadQR = downloadMesinQR;

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
          const id = info.row.original.id;
          
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
        header: "Aksi Log & Dokumen",
        cell: (info: any) => {
          const mesin = info.row.original;
          return (
            <div className="d-flex gap-1 align-items-center justify-content-center">
              {/* Gunakan fungsi onOpenDetail untuk beralih viewMode */}
              <DasherTippy content="Pemeliharaan">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="d-inline-flex align-items-center justify-content-center p-0"
                  style={{ width: "32px", height: "32px" }}
                  onClick={() => onOpenDetail(mesin)}
                >
                  <IconClipboardList size={16} />
                </Button>
              </DasherTippy>

              <DasherTippy content="Aktivitas">
                <Link href={`/pemeliharaan/aktivitas-mesin?id=${mesin.id}`}>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="d-inline-flex align-items-center justify-content-center p-0"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <IconActivity size={16} />
                  </Button>
                </Link>
              </DasherTippy>

              {/* Dropdown Menu untuk Instruksi Kerja (IK) & QR Code */}
              <Dropdown>
                <Dropdown.Toggle 
                  variant="outline-secondary" 
                  size="sm" 
                  className="d-inline-flex align-items-center justify-content-center p-0"
                  style={{ width: "32px", height: "32px" }}
                >
                  <IconFileDescription size={16} />
                </Dropdown.Toggle>

                <Dropdown.Menu
                    className="shadow-sm"
                    align="end"
                    renderOnMount
                    popperConfig={{ strategy: "fixed" }}
                  >
                  <Dropdown.Header className="small text-muted fw-bold">INSTRUKSI KERJA (IK)</Dropdown.Header>
                  <Dropdown.Item href={`/pemeliharaan/ik-operasional?id=${mesin.id}`}>
                    IK Operasional
                  </Dropdown.Item>
                  <Dropdown.Item href={`/pemeliharaan/ik-pemeliharaan?id=${mesin.id}`}>
                    IK Pemeliharaan
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => handleDownloadQR(mesin)} className="d-flex align-items-center gap-2">
                    <IconQrcode size={14} /> Download QR Code
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          );
        },
      },
    ],
     [onToggleStatus, onOpenDetail, handleDownloadQR]
  );
};
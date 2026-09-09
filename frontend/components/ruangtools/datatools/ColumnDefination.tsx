// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Dropdown } from "react-bootstrap";
import { IconDotsVertical, IconShoppingCartPlus } from "@tabler/icons-react";
import QRCode from "qrcode"; 

// import custom types
import { ToolItemType, ToolCondition, CartItemType } from "types/DataToolsTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

// warna badge sesuai kondisi alat
const kondisiVariant = (kondisi: ToolCondition) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak":
      return { bg: "danger-subtle", text: "danger-emphasis" };
  }
};

interface ColumnHandlers {
  onDetail: (tool: ToolItemType) => void;
  onEdit: (tool: ToolItemType) => void;
  onDelete: (tool: ToolItemType) => void;
  onAddToCart: (tool: ToolItemType, event: React.MouseEvent<HTMLButtonElement>) => void;
  cartItems?: CartItemType[];
}

export const getDataToolsColumns = ({
  onDetail,
  onEdit,
  onDelete,
  onAddToCart,
  cartItems = [],
}: ColumnHandlers): ColumnDef<ToolItemType>[] => [
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
    accessorKey: "kondisi",
    header: "Kondisi",
    cell: ({ row }) => {
      const { bg, text } = kondisiVariant(row.original.kondisi);
      return (
        <Badge bg={bg} text={text}>
          {row.original.kondisi}
        </Badge>
      );
    },
  },
  {
    accessorKey: "stok",
    header: "Stok",
    cell: ({ row }) => (
      <span className="text-center d-block">{row.original.stok}</span>
    ),
  },
  {
    accessorKey: "dipinjam",
    header: "Dipinjam",
    cell: ({ row }) => (
      <span className="text-center d-block">{row.original.dipinjam}</span>
    ),
  },
  {
    id: "tersedia",
    header: "Tersedia",
    cell: ({ row }) => {
      const tool = row.original;
      
      // Cari apakah alat ini sudah ada di cart dan berapa jumlahnya
      const cartItem = cartItems.find((c) => c.toolId === tool.id);
      const qtyDiCart = cartItem ? cartItem.jumlah : 0;

      // Sisa stok riil = Total Stok - Sedang Dipinjam - Yang sudah masuk Cart
      const sisaStokReal = tool.stok - tool.dipinjam - qtyDiCart;
      const habis = sisaStokReal <= 0;

      return (
        <span className="d-flex justify-content-center">
          <Badge
            bg={habis ? "danger-subtle" : "success-subtle"}
            text={habis ? "danger-emphasis" : "success-emphasis"}
            className="fw-semibold"
          >
            {sisaStokReal >= 0 ? sisaStokReal : 0}
          </Badge>
        </span>
      );
    },
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const tool = row.original;

      // Cari jumlah di cart untuk alat ini
      const cartItem = cartItems.find((c) => c.toolId === tool.id);
      const qtyDiCart = cartItem ? cartItem.jumlah : 0;

      // Hitung sisa stok aktual
      const sisaStokReal = tool.stok - tool.dipinjam - qtyDiCart;
      const habis = sisaStokReal <= 0;

      // <-- Fungsi untuk mendownload QR Code versi In-Memory Canvas (Trik Persegi Panjang) -->
      const handleDownloadQR = async () => {
        try {
          const namaBarang = tool.namaBarang || "Tool";
          const merkBarang = tool.merk || "Unknown";
          const kodeBarang = tool.kodeBarang || "-"; // Ambil kode barang untuk teks visual
          
          // Format nama file: NamaBarang_Merk.png
          const fileName = `${namaBarang}_${merkBarang}`.replace(/[^a-zA-Z0-9_-]/g, "_") + ".png";

          // 1. Generate QR murni jadi Base64 (Isi data tetap ID)
          const qrDataUrl = await QRCode.toDataURL(String(tool.id), {
            width: 500,
            margin: 2,
            errorCorrectionLevel: 'H'
          });

          // 2. Ubah jadi gambar statis di memori
          const qrImage = new Image();
          qrImage.src = qrDataUrl;
          
          qrImage.onload = () => {
            const finalCanvas = document.createElement("canvas");
            const ctx = finalCanvas.getContext("2d");
            if (!ctx) return;

            // Kunci ukuran jadi Persegi Panjang
            const QR_SIZE = 500;
            const TEXT_AREA = 100;

            finalCanvas.width = QR_SIZE;
            finalCanvas.height = QR_SIZE + TEXT_AREA;

            // Background putih
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // Tempel QR Code di atas
            ctx.drawImage(qrImage, 0, 0, QR_SIZE, QR_SIZE);

            // Tempel Teks Kode Barang di bawah
            ctx.fillStyle = "#000000";    
            ctx.font = "bold 40px Arial, sans-serif"; 
            ctx.textAlign = "center";     
            ctx.textBaseline = "middle";  
            
            ctx.fillText(kodeBarang, QR_SIZE / 2, QR_SIZE + (TEXT_AREA / 2)); 

            // Eksekusi otomatis download
            const link = document.createElement("a");
            link.download = fileName; 
            link.href = finalCanvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

        } catch (err) {
          console.error("Gagal membuat QR Code", err);
        }
      };

      return (
        <div className="datatools-action-cell">
          <div className="datatools-action-main">
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              disabled={habis} 
              title={habis ? "Stok habis (sudah masuk keranjang/dipinjam)" : "Tambah ke Peminjaman"}
              onClick={(e) => onAddToCart(tool, e)}
            >
              <IconShoppingCartPlus size={16} />
              <span className="d-none d-lg-inline">
                {habis ? "Stok Habis" : "Tambah ke Peminjaman"}
              </span>
            </button>
          </div>
          <div className="datatools-action-menu">
            <ActionMenu
              toggleButton={<IconDotsVertical size={20} />}
              className="btn btn-ghost btn-icon btn-sm rounded-circle"
              drop="start"
              align="start"
              closeOnScroll
            >
            <Dropdown.Item onClick={() => onDetail(tool)}>
              Detail Alat
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onEdit(tool)}>
              Edit Data
            </Dropdown.Item>
            <Dropdown.Item
              className="text-danger"
              onClick={() => onDelete(tool)}
            >
              Hapus Data
            </Dropdown.Item>

            {/* <-- Tambahan Menu Download QR --> */}
            <Dropdown.Item onClick={handleDownloadQR}>
              Download QR
            </Dropdown.Item>

            </ActionMenu>
          </div>
        </div>
      );
    },
  },
];
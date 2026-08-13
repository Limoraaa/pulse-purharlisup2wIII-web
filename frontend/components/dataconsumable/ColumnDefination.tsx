"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical, IconShoppingCartPlus } from "@tabler/icons-react";
import QRCode from "qrcode"; // <-- Tambahkan import QRCode

// import custom types
import { ConsumableItemType } from "types/DataConsumableTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  onDetail: (consumable: ConsumableItemType) => void;
  onEdit: (consumable: ConsumableItemType) => void;
  onDelete: (consumable: ConsumableItemType) => void;
  onStockOut: (
    consumable: ConsumableItemType,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void; // Pengambilan
}

export const getConsumableColumns = ({
  onDetail,
  onEdit,
  onDelete,
  onStockOut,
}: ColumnHandlers): ColumnDef<ConsumableItemType>[] => [
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
    cell: ({ row }) => (
      <span className="fw-semibold">{row.original.kode_barang}</span>
    ),
  },
  {
    accessorKey: "nama",
    header: "Nama Consumable",
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
  accessorKey: "stok_awal_asli",
  header: "Stok Awal",
  cell: ({ row }) => (
    <span className="text-center d-block">{row.original.stok_awal_asli}</span>
  ),
},
{
  accessorKey: "total_masuk",
  header: "Masuk",
  cell: ({ row }) => (
    <span className="text-center d-block text-success fw-semibold">
      {row.original.total_masuk}
    </span>
  ),
},
{
  accessorKey: "total_keluar",
  header: "Keluar",
  cell: ({ row }) => (
    <span className="text-center d-block text-danger fw-semibold">
      {row.original.total_keluar}
    </span>
  ),
},
  {
    accessorKey: "stok_awal",
    header: "Stok Tersedia",
    cell: ({ row }) => {
      const stok = row.original.stok_awal;
      const perluRestock = stok < 5;

      return (
        <div className="d-flex flex-column align-items-center gap-1">
          <span className={`fw-bold ${perluRestock ? "text-danger" : "text-success"}`}>
            {stok}
          </span>
          <Badge
            bg={perluRestock ? "danger-subtle" : "success-subtle"}
            text={perluRestock ? "danger-emphasis" : "success-emphasis"}
            className="fw-semibold"
          >
            {perluRestock ? "Perlu Restock" : "Cukup"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const consumable = row.original;
      const isHabis = consumable.stok_awal <= 0;

      // <-- Fungsi untuk mendownload QR Code -->
      const handleDownloadQR = async () => {
        try {
          // Ambil properti nama dan merk dari consumable
          const namaBarang = consumable.nama || "Consumable";
          const merkBarang = consumable.merk || "Unknown";
          
          // Format nama file: NamaBarang_Merk.png (karakter ilegal akan diubah jadi underscore)
          const fileName = `${namaBarang}_${merkBarang}`.replace(/[^a-zA-Z0-9_-]/g, "_");

          // Buat elemen canvas sementara
          const canvas = document.createElement("canvas");
          
          // Render UUID (consumable.id) ke dalam QR Code
          // Pastikan properti consumable.id sesuai dengan nama primary key/UUID di type kamu
          await QRCode.toCanvas(canvas, String(consumable.id), { width: 300 });

          // Proses download
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (err) {
          console.error("Gagal membuat QR Code", err);
        }
      };

      return (
        <div className="dataconsumable-action-cell">
          <div className="dataconsumable-action-main">
          {/* Tombol Utama: Ambil Bahan */}
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            disabled={isHabis}
            title={isHabis ? "Stok habis" : "Ambil bahan"}
            onClick={(e) => onStockOut(consumable, e)}
          >
            <IconShoppingCartPlus size={16} />
            {/* teks disembunyikan di layar < lg (992px), sisa ikon saja
                supaya kolom Aksi (sticky di mobile) tidak makan banyak ruang.
                title di atas tetap kasih tooltip + aksesibilitas. */}
            <span className="d-none d-lg-inline">Ambil Bahan</span>
          </button>
          </div>

          {/* Menu Aksi Lainnya */}
          <div className="dataconsumable-action-menu">
            <ActionMenu
              toggleButton={<IconDotsVertical size={20} />}
              className="btn btn-ghost btn-icon btn-sm rounded-circle"
              drop="start"
              align="start"
              closeOnScroll
            >
            <Dropdown.Item onClick={() => onDetail(consumable)}>
              Detail Bahan
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onEdit(consumable)}>
              Edit Data
            </Dropdown.Item>
            <Dropdown.Item
              className="text-danger"
              onClick={() => onDelete(consumable)}
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

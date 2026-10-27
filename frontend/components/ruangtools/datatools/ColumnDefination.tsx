// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Dropdown } from "react-bootstrap";
import { IconDotsVertical, IconShoppingCartPlus } from "@tabler/icons-react";
import { downloadQrDenganLabel } from "components/common/downloadQrLabel";

// import custom types
import { ToolItemType, ToolCondition, CartItemType } from "types/DataToolsTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";
import { kodeBarangSortingFn } from "components/table/kodeBarangSort";
import KodeBarangSortHeader from "components/table/KodeBarangSortHeader";

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
  canManage?: boolean;
  onDetail: (tool: ToolItemType) => void;
  onEdit: (tool: ToolItemType) => void;
  onDelete: (tool: ToolItemType) => void;
  onAddToCart: (tool: ToolItemType, event: React.MouseEvent<HTMLButtonElement>) => void;
  cartItems?: CartItemType[];
}

export const getDataToolsColumns = ({
  canManage = false,
  onDetail,
  onEdit,
  onDelete,
  onAddToCart,
  cartItems = [],
}: ColumnHandlers): ColumnDef<ToolItemType>[] => [
  {
    accessorKey: "kodeBarang",
    header: ({ column }) => (
      <KodeBarangSortHeader label="Kode Barang" sortState={column.getIsSorted()} />
    ),
    meta: { hideDefaultSortIcon: true },
    sortingFn: kodeBarangSortingFn,
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
      <span className="text-center d-block">
        {row.original.stok.toLocaleString("id-ID")}
      </span>
    ),
  },
  {
    accessorKey: "dipinjam",
    header: "Dipinjam",
    cell: ({ row }) => (
      <span className="text-center d-block">
        {row.original.dipinjam.toLocaleString("id-ID")}
      </span>
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
            {(sisaStokReal >= 0 ? sisaStokReal : 0).toLocaleString("id-ID")}
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
          await downloadQrDenganLabel({
            data: String(tool.id), // isi QR tetap ID agar sistem scan bekerja
            kodeBarang: tool.kodeBarang || "-",
            namaBarang: tool.namaBarang || "",
            // Format nama file: NamaBarang_Merk.png
            fileName: `${namaBarang}_${merkBarang}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
          });
        } catch (err) {
          console.error("Gagal membuat QR Code", err);
        }
      };

      return (
        <div className="datatools-action-cell">
          {canManage && (
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
          )}
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
            {canManage && (
              <Dropdown.Item onClick={() => onEdit(tool)}>
                Edit Data
              </Dropdown.Item>
            )}
            {canManage && (
              <Dropdown.Item
                className="text-danger"
                onClick={() => onDelete(tool)}
              >
                Hapus Data
              </Dropdown.Item>
            )}

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
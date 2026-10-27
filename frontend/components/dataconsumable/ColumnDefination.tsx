"use client";
// import node module libraries
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge } from "react-bootstrap";
import { IconDotsVertical, IconShoppingCartPlus } from "@tabler/icons-react";
import { downloadQrDenganLabel } from "components/common/downloadQrLabel";
// import custom types
import { ConsumableItemType } from "types/DataConsumableTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";
import { kodeBarangSortingFn } from "components/table/kodeBarangSort";
import KodeBarangSortHeader from "components/table/KodeBarangSortHeader";
const formatNumber = (n: number) => n.toLocaleString("en-US");

interface ColumnHandlers {
  canManage?: boolean;
  onDetail: (consumable: ConsumableItemType) => void;
  onEdit: (consumable: ConsumableItemType) => void;
  onDelete: (consumable: ConsumableItemType) => void;
  onStockOut: (
    consumable: ConsumableItemType,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void; // Pengambilan
}

export const getConsumableColumns = ({
  canManage = false,
  onDetail,
  onEdit,
  onDelete,
  onStockOut,
}: ColumnHandlers): ColumnDef<ConsumableItemType>[] => [
  {
    accessorKey: "kode_barang",
    header: ({ column }) => (
      <KodeBarangSortHeader label="Kode Barang" sortState={column.getIsSorted()} />
    ),
    meta: { hideDefaultSortIcon: true },
    sortingFn: kodeBarangSortingFn,
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
    accessorKey: "satuan",
    header: "Satuan",
    cell: ({ row }) => row.original.satuan || "-",
  },
    {
  accessorKey: "stok_awal_asli",
  header: "Stok Awal",
  cell: ({ row }) => (
    <span className="text-center d-block">{formatNumber(row.original.stok_awal_asli)}</span>
  ),
},
{
  accessorKey: "total_masuk",
  header: "Masuk",
  cell: ({ row }) => (
    <span className="text-center d-block text-success fw-semibold">
      {formatNumber(row.original.total_masuk)}
    </span>
  ),
},
{
  accessorKey: "total_keluar",
  header: "Keluar",
  cell: ({ row }) => (
    <span className="text-center d-block text-danger fw-semibold">
      {formatNumber(row.original.total_keluar)}
    </span>
  ),
},
  {
    accessorKey: "stok_tersedia",
    header: "Stok Tersedia",
    cell: ({ row }) => {
      const stok = row.original.stok_tersedia;
      const perluRestock = stok < 5;

      return (
        <div className="d-flex flex-column align-items-center gap-1">
          <span className={`fw-bold ${perluRestock ? "text-danger" : "text-success"}`}>
            {formatNumber(stok)}
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
      const isHabis = consumable.stok_tersedia <= 0;

      // <-- Fungsi untuk mendownload QR Code versi In-Memory Canvas -->
      const handleDownloadQR = async () => {
        try {
          const namaBarang = consumable.nama || "Consumable";
          const merkBarang = consumable.merk || "Unknown";
          await downloadQrDenganLabel({
            data: String(consumable.id), // isi QR tetap ID agar sistem scan bekerja
            kodeBarang: consumable.kode_barang || "-",
            namaBarang: consumable.nama || "",
            // Format nama file: NamaBarang_Merk.png
            fileName: `${namaBarang}_${merkBarang}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
          });
        } catch (err) {
          console.error("Gagal membuat QR Code", err);
        }
      };

 return (
        <div className="dataconsumable-action-cell">
          {canManage && (
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
              <span className="d-none d-lg-inline">Ambil Bahan</span>
            </button>
            </div>
          )}

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
            {canManage && (
              <Dropdown.Item onClick={() => onEdit(consumable)}>
                Edit Data
              </Dropdown.Item>
            )}
            {canManage && (
              <Dropdown.Item
                className="text-danger"
                onClick={() => onDelete(consumable)}
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
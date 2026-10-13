//import node modules libraries
import { v4 as uuid } from "uuid";
import {
  IconLayoutDashboard,
  IconBoxSeam,
  IconArrowsExchange,
  IconHistory,
  IconShoppingCart,
  IconTools,
  IconMotorbike,
  IconReportAnalytics,
  IconUsers,
  IconCalendarEvent,
  IconSettings // Tambahan opsional jika ingin icon berbeda
} from "@tabler/icons-react";

//import custom type
import { MenuItemType } from "types/menuTypes";

export const DashboardMenu: MenuItemType[] = [
  {
    id: uuid(),
    title: "Operasional Alat",
    grouptitle: true,
  },
  {
    id: uuid(),
    title: "Dashboard",
    link: "/",
    icon: <IconLayoutDashboard size={20} strokeWidth={1.5} />,
  },
  {
    id: uuid(),
    title: "Inventaris",
    icon: <IconBoxSeam size={20} strokeWidth={1.5} />,
    children: [
      { id: uuid(), name: "Data Tools", link: "/inventaris/data-tools" },
      {
        id: uuid(),
        name: "Data Consumable",
        link: "/inventaris/data-consumable",
      },
      {
        id: uuid(),
        name: "Data Peminjam",
        link: "/inventaris/data-peminjam",
      },
      {
        id: uuid(),
        name: "Data Pekerjaan",
        link: "/inventaris/data-pekerjaan",
      },
    ],
  },
  {
    id: uuid(),
    title: "Transaksi",
    icon: <IconArrowsExchange size={20} strokeWidth={1.5} />,
    children: [
      {
        id: uuid(),
        name: "Peminjaman Aktif",
        link: "/transaksi/peminjaman-aktif",
      },
      {
        id: uuid(),
        name: "Pengembalian Alat",
        link: "/transaksi/pengembalian",
      },
      {
        id: uuid(),
        name: "Consumable Masuk",
        link: "/transaksi/consumable-masuk",
      },
      {
        id: uuid(),
        name: "Tools Masuk",
        link: "/transaksi/tools-masuk",
      },
    ],
  },
  {
    id: uuid(),
    title: "Riwayat",
    icon: <IconHistory size={20} strokeWidth={1.5} />,
    children: [
      {
        id: uuid(),
        name: "Peminjaman Tools",
        link: "/riwayat/peminjaman-tools",
      },
      {
        id: uuid(),
        name: "Consumable Keluar",
        link: "/riwayat/consumable-keluar",
      },
      {
        id: uuid(),
        name: "Riwayat Perbaikan",
        link: "/riwayat/perbaikan",
      },
    ],
  },
  {
    id: uuid(),
    title: "Pengajuan Order",
    icon: <IconShoppingCart size={20} strokeWidth={1.5} />,
    children: [
      {
        id: uuid(),
        name: "Order Consumable",
        link: "/order/order-consumable",
      },
      {
        id: uuid(),
        name: "Order Tools",
        link: "/order/order-tools",
      },
    ],
  },
  {
    id: uuid(),
    title: "Laporan Kerusakan Alat",
    link: "/laporan",
    icon: <IconReportAnalytics size={20} strokeWidth={1.5} />,
  },
  
  // ==========================================
  // MENU MANAJEMEN MESIN PRODUKSI
  // ==========================================
  {
    id: uuid(),
    title: "Manajemen Mesin Produksi",
    grouptitle: true,
  },
  {
    id: uuid(),
    title: "Dashboard Mesin",
    link: "/pemeliharaan/dashboard",
    icon: <IconLayoutDashboard size={20} strokeWidth={1.5} />,
  },
  {
    id: uuid(),
    title: "Operasional",
    icon: <IconCalendarEvent size={20} strokeWidth={1.5} />,
    children: [
      {
        id: uuid(),
        name: "Plotting Jadwal Operasional",
        link: "/operasional",
      },
      {
        id: uuid(),
        name: "Catatan Aktivitas Mesin",
        link: "/operasional/data-mesin",
      }
    ],
  },
  {
    id: uuid(),
    title: "Pemeliharaan",
    icon: <IconTools size={20} strokeWidth={1.5} />,
    children: [
      {
        id: uuid(),
        name: "Kalibrasi",
        link: "/pemeliharaan/kalibrasi",
      },
      {
        id: uuid(),
        name: "Rencana Pemeliharaan",
        link: "/pemeliharaan/rencana",
      },
      {
        id: uuid(),
        name: "Catatan Pemeliharaan Mesin",
        link: "/pemeliharaan/data-mesin",
      },
    ],
  },

  // ==========================================
  // MENU PEMELIHARAAN MOTOR KONVERSI
  // ==========================================
  {
    id: uuid(),
    title: "Pemeliharaan Motor Konversi",
    grouptitle: true,
  },
  {
    id: uuid(),
    title: "Dashboard Pemeliharaan",
    link: "/pemeliharaan/dashboard-motor-konversi",
    icon: <IconLayoutDashboard size={20} strokeWidth={1.5} />,
  },
  {
    id: uuid(),
    title: "Pemeliharaan Motor Konversi",
    link: "/pemeliharaan/data-motor-konversi",
    icon: <IconMotorbike size={20} strokeWidth={1.5} />,
  },
  {
    id: uuid(),
    title: "Administrasi",
    grouptitle: true,
  },
  {
    id: uuid(),
    title: "Manajemen User",
    link: "/data-user",
    icon: <IconUsers size={20} strokeWidth={1.5} />,
  },
];
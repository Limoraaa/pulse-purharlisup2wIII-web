//import node modules libraries
import { v4 as uuid } from "uuid";
import {
  IconLayoutDashboard,
  IconBoxSeam,
  IconArrowsExchange,
  IconHistory,
  IconShoppingCart,
 
  IconReportAnalytics,
  IconUsers,
} from "@tabler/icons-react";

//import custom type
import { MenuItemType } from "types/menuTypes";

export const DashboardMenu: MenuItemType[] = [
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
  {
    id: uuid(),
    title: "Manajemen User",
    link: "/data-user",
    icon: <IconUsers size={20} strokeWidth={1.5} />,
  },
];
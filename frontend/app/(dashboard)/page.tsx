import { Metadata } from "next";
import DashboardManager from "components/dashboard/DashboardManager";

export const metadata: Metadata = {
  title: "Dashboard | Ruang Tools",
  description: "Sistem Manajemen Inventaris Ruang Tools",
};

const HomePage = () => {
  return <DashboardManager />;
};

export default HomePage;
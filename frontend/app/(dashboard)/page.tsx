"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardManager from "components/dashboard/DashboardManager";
import api from "lib/api";

const HomePage = () => {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res: any = await api("/user");
        const data = res?.data || res;
        const perms: string[] = data?.all_permissions || [];
        const roles: string[] = (data?.roles || []).map((r: any) => r.name ?? r);

        const isSuperAdmin = roles.includes("Super Admin");
        if (!isSuperAdmin && !perms.includes("view_dashboard")) {
          // Redirect ke halaman lain yang pasti bisa diakses, urut dari prioritas
          if (perms.includes("view_inventaris")) router.replace("/inventaris/data-tools");
          else if (perms.includes("view_transaksi")) router.replace("/transaksi/peminjaman-aktif");
          else if (perms.includes("view_riwayat")) router.replace("/riwayat");
          else if (perms.includes("view_pemeliharaan_mesin")) router.replace("/pemeliharaan/data-mesin");
          else if (perms.includes("view_users")) router.replace("/data-user");
          else router.replace("/signin");
          return;
        }
        setChecked(true);
      } catch (error) {
        router.replace("/signin");
      }
    };

    checkAccess();
  }, [router]);

  if (!checked) return null; // atau tampilkan spinner loading

  return <DashboardManager />;
};

export default HomePage;
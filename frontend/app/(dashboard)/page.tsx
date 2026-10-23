"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardManager from "components/dashboard/DashboardManager";
import api from "lib/api";
import { logout } from "lib/logout";
import { Button } from "react-bootstrap";

// [permission (salah satu cukup), halaman] — urutan prioritas halaman awal
const HALAMAN_AWAL: [string[], string][] = [
  [["view_inventaris"], "/inventaris/data-tools"],
  [["view_transaksi"], "/transaksi/peminjaman-aktif"],
  [["view_riwayat"], "/riwayat/peminjaman-tools"],
  [["view_order"], "/order/order-consumable"],
  [["view_kerusakan_alat"], "/laporan"],
  [["view_dashboard_pemeliharaan"], "/pemeliharaan/dashboard"],
  [["view_data_mesin"], "/data-mesin"],
  [["view_pemeliharaan_mesin", "process_pemeliharaan_mesin"], "/pemeliharaan/data-mesin"],
  [["view_operasional_mesin", "process_operasional_mesin"], "/operasional/data-mesin"],
  [["manage_plotting_operasional"], "/operasional/mapping-pengerjaan"],
  [["manage_rencana_pemeliharaan"], "/pemeliharaan/rencana"],
  [["view_dashboard_pemeliharaan_motor_konversi"], "/pemeliharaan/dashboard-motor-konversi"],
  [["view_pemeliharaan_motor_konversi"], "/pemeliharaan/data-motor-konversi"],
  [["view_users", "manage_users"], "/data-user"],
];

const HomePage = () => {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [tanpaAkses, setTanpaAkses] = useState(false);
  const [gagalMuat, setGagalMuat] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res: any = await api("/user");
        const data = res?.data || res;
        const perms: string[] = data?.all_permissions || [];
        const roles: string[] = (data?.roles || []).map((r: any) => r.name ?? r);

        const isSuperAdmin = roles.includes("Super Admin");
        if (!isSuperAdmin && !perms.includes("view_dashboard")) {
          // Arahkan ke halaman pertama yang boleh diakses (urut prioritas, sama dengan menu sidebar)
          const tujuan = HALAMAN_AWAL.find(([izin]) => izin.some((p) => perms.includes(p)));
          if (tujuan) router.replace(tujuan[1]);
          // Tanpa akses sama sekali: tampilkan pesan (bukan ke /signin, karena /signin melempar balik ke sini)
          else setTanpaAkses(true);
          return;
        }
        setChecked(true);
      } catch (err) {
        // Sesi habis (401) sudah diarahkan ke /signin oleh lib/api. Error lain (server mati) ditampilkan,
        // bukan diarahkan ke /signin, agar tidak bolak-balik /signin <-> /
        setGagalMuat(err instanceof Error ? err.message : "Gagal terhubung ke server.");
      }
    };

    checkAccess();
  }, [router]);

  if (gagalMuat) {
    return (
      <div className="text-center py-10">
        <h4 className="mb-2">Gagal memuat halaman</h4>
        <p className="text-secondary">{gagalMuat}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (tanpaAkses) {
    return (
      <div className="text-center py-10">
        <h4 className="mb-2">Akun Anda belum memiliki akses</h4>
        <p className="text-secondary">Hubungi Admin untuk mengatur hak akses akun ini.</p>
        <Button
          variant="outline-danger"
          onClick={async () => {
            await logout();
            router.replace("/signin");
          }}
        >
          Logout
        </Button>
      </div>
    );
  }

  if (!checked) return null; // atau tampilkan spinner loading

  return <DashboardManager />;
};

export default HomePage;
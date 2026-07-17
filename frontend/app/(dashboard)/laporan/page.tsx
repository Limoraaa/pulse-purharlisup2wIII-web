// app/(dashboard)/laporan/kerusakan-alat/page.tsx
// Sesuaikan path route group "(dashboard)" dengan struktur folder Dasher
// template kalian yang sebenarnya.
import LaporanKerusakanManager from "@/components/ruangtools/laporan/kerusakan/LaporanKerusakanManager";

export const metadata = {
  title: "Laporan Kerusakan Alat | Ruang Tools",
};

export default function LaporanKerusakanAlatPage() {
  return (
    <div className="container-fluid">
      <LaporanKerusakanManager />
    </div>
  );
}

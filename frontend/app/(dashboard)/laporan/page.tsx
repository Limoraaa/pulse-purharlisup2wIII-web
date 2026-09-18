// import node module libraries
import { Metadata } from "next";

// import custom components
import LaporanKerusakanManager from "components/ruangtools/laporan/kerusakan/LaporanKerusakanManager";

export const metadata: Metadata = {
  title: "Laporan Kerusakan Alat | Ruang Tools - Admin Panel",
  description:
    "Menampilkan seluruh data alat yang mengalami kerusakan berdasarkan hasil pengembalian dari proses peminjaman",
};

const LaporanKerusakanPage = () => {
  return <LaporanKerusakanManager />;
};

export default LaporanKerusakanPage;

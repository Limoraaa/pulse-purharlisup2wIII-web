// import node module libraries
import { Metadata } from "next";

// import custom components
import RiwayatPeminjamanManager from "components/ruangtools/riwayat/peminjaman/RiwayatPeminjamanManager";

export const metadata: Metadata = {
  title: "Riwayat Peminjaman Tools | Ruang Tools - Admin Panel",
  description:
    "Menampilkan riwayat seluruh transaksi peminjaman tools yang telah dikembalikan",
};

const RiwayatPeminjamanPage = () => {
  return <RiwayatPeminjamanManager />;
};

export default RiwayatPeminjamanPage;

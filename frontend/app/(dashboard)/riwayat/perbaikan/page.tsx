// import node module libraries
import { Metadata } from "next";

// import custom components
import RiwayatPerbaikanManager from "components/ruangtools/riwayat/perbaikan/RiwayatPerbaikanManager";

export const metadata: Metadata = {
  title: "Riwayat Perbaikan Alat | Ruang Tools - Admin Panel",
  description: "Menampilkan seluruh alat yang sudah selesai diperbaiki",
};

const RiwayatPerbaikanPage = () => {
  return <RiwayatPerbaikanManager />;
};

export default RiwayatPerbaikanPage;
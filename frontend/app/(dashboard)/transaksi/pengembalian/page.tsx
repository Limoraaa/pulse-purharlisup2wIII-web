// import node module libraries
import { Metadata } from "next";

// import custom components
import PengembalianManager from "components/ruangtools/pengembalian/PengembalianManager";

export const metadata: Metadata = {
  title: "Pengembalian Alat | Ruang Tools - Admin Panel",
  description: "Scan kartu peminjam dan kembalikan alat sekaligus",
};

const PengembalianPage = () => {
  return <PengembalianManager />;
};

export default PengembalianPage;
// import node module libraries
import { Metadata } from "next";

// import custom components
import RiwayatConsumableKeluarManager from "components/ruangtools/riwayat/consumablekeluar/RiwayatConsumableKeluarManager";

export const metadata: Metadata = {
  title: "Riwayat Consumable Keluar | Ruang Tools - Admin Panel",
  description: "Menampilkan riwayat pengambilan barang consumable",
};

const RiwayatConsumableKeluarPage = () => {
  return <RiwayatConsumableKeluarManager />;
};

export default RiwayatConsumableKeluarPage;

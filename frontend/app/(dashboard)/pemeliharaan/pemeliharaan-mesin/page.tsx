import { Metadata } from "next";
import DataMesinManager from "components/pemeliharaanmesin/DataPemeliharaanManager";

export const metadata: Metadata = {
  title: "Pemeliharaan Mesin Produksi | PULSE PUSHARLIS",
  description: "Mengelola daftar mesin produksi dan catatan kartu gantung pelaksanaannya",
};

const PemeliharaanMesinPage = () => {
  return <DataMesinManager />;
};

export default PemeliharaanMesinPage;
import { Metadata } from "next";
import DataMesinManager from "components/pemeliharaanmesin/DataMesinManager";

export const metadata: Metadata = {
  title: "Data Mesin Produksi | PULSE PUSHARLIS",
  description: "Mengelola daftar mesin produksi dan catatan kartu gantung pelaksanaannya",
};

const DataMesinPage = () => {
  return <DataMesinManager />;
};

export default DataMesinPage;
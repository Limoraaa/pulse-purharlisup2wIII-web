import { Metadata } from "next";
import DataMasterMesinManager from "components/manajemenmesin/datamesin/DataMasterMesinManager";

export const metadata: Metadata = {
  title: "Data Mesin | PULSE PUSHARLIS",
  description: "Mengelola daftar mesin produksi: tambah, edit, nonaktifkan, dan hapus mesin",
};

const DataMesinPage = () => {
  return <DataMasterMesinManager />;
};

export default DataMesinPage;

import { Metadata } from "next";
import DataMesinManager from "components/manajemenmesin/DataMesinManager";

export const metadata: Metadata = {
  title: "Data Mesin Produksi | PULSE PUSHARLIS",
  description: "Mengelola daftar mesin produksi dan catatan kartu gantung pelaksanaannya",
};

const DataMesinPage = () => {
  // WAJIB ADA mode="pemeliharaan" (Atau dibiarkan kosong tidak apa-apa karena defaultnya ini)
  return <DataMesinManager mode="pemeliharaan" />;
};

export default DataMesinPage;
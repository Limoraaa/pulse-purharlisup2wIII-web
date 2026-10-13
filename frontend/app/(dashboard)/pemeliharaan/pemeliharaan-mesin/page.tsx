import { Metadata } from "next";
// Import dari file komponen generik yang sudah dibuat
import DataMesinManager from "components/manajemenmesin/DataMesinManager";

export const metadata: Metadata = {
  title: "Pemeliharaan Mesin Produksi | PULSE PUSHARLIS",
  description: "Mengelola daftar mesin produksi dan catatan kartu gantung pelaksanaannya",
};

const PemeliharaanMesinPage = () => {
  // Kirimkan props mode="pemeliharaan"
  return <DataMesinManager mode="pemeliharaan" />;
};

export default PemeliharaanMesinPage;
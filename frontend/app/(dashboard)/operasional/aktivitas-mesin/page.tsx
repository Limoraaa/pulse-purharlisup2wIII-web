import { Metadata } from "next";
import DataMesinManager from "components/manajemenmesin/DataMesinManager";

export const metadata: Metadata = {
  title: "Catatan Aktivitas Mesin | PULSE PUSHARLIS",
  description: "Mengelola log aktivitas harian operasional mesin produksi",
};

const AktivitasMesinPage = () => {
  // WAJIB ADA mode="operasional" AGAR TAB PEMELIHARAAN HILANG
  return <DataMesinManager mode="operasional" />;
};

export default AktivitasMesinPage;
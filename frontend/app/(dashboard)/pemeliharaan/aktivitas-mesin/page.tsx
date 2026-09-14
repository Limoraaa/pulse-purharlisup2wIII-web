import { Metadata } from "next";
import DataAktivitasManager from "components/pemeliharaanmesin/DataAktivitasManager";

export const metadata: Metadata = {
  title: "Monitoring Aktivitas Mesin | PULSE PUSHARLIS",
  description: "Mengelola log aktivitas dan monitoring operasional mesin produksi",
};

const AktivitasMesinPage = () => {
  return <DataAktivitasManager />;
};

export default AktivitasMesinPage;
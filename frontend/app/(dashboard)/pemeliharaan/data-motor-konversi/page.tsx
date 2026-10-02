import { Metadata } from "next";
import DataMotorKonversiManager from "components/pemeliharaanmotorkonversi/DataMotorKonversiManager";

export const metadata: Metadata = {
  title: "Data Motor Konversi | PULSE PUSHARLIS",
  description: "Mengelola daftar motor konversi dan catatan kartu gantung pelaksanaannya",
};

const DataMotorKonversiPage = () => {
  return <DataMotorKonversiManager />;
};

export default DataMotorKonversiPage;
import { Metadata } from "next";
import DataMotorKonversiManager from "components/pemeliharaanmotorkonversi/DataPemeliharaanMotorKonversiManager";

export const metadata: Metadata = {
  title: "Pemeliharaan Motor Konversi | PULSE PUSHARLIS",
  description: "Mengelola daftar motor konversi dan catatan kartu gantung pelaksanaannya",
};

const PemeliharaanMotorKonversiPage = () => {
  return <DataMotorKonversiManager />;
};

export default PemeliharaanMotorKonversiPage;
import { Metadata } from "next";
import MappingPengerjaanManager from "/components/manajemenmesin/operasionalmesin/MappingPengerjaanManager";

export const metadata: Metadata = {
  title: "Mapping Pengerjaan Mesin | PULSE PUSHARLIS",
  description: "Penjadwalan dan pemetaan pengerjaan mesin produksi menggunakan kalender",
};

const MappingPengerjaanPage = () => {
  return <MappingPengerjaanManager />;
};

export default MappingPengerjaanPage;
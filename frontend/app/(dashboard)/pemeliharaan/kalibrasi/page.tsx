import { Metadata } from "next";
import KalibrasiClientWrapper from "/components/manajemenmesin/kalibrasimesin/KalibrasiClientWrapper";

export const metadata: Metadata = {
  title: "Sertifikasi & Kalibrasi Mesin | PULSE PUSHARLIS",
  description: "Mengelola riwayat kalibrasi, sertifikat kelayakan, dan batas waktu kalibrasi mesin produksi",
};

export default function KalibrasiPage() {
  return <KalibrasiClientWrapper />;
}
// import node module libraries
import { v4 as uuid } from "uuid";

// import custom types
import { PeminjamType } from "types/DataToolsTypes";

// Dummy data peminjam — nantinya diganti hasil fetch dari halaman
// "Inventaris > Data Peminjam" / API, struktur tipe (PeminjamType) tetap sama.
export const PeminjamData: PeminjamType[] = [
  { id: uuid(), nama: "Ahmad Sobari", divisi: "Pemeliharaan Trafo" },
  { id: uuid(), nama: "Indra Jati", divisi: "Audit Energi" },
  { id: uuid(), nama: "Andi Wijaya", divisi: "Distribusi" },
  { id: uuid(), nama: "Siti Aminah", divisi: "Proteksi & Kontrol" },
  { id: uuid(), nama: "Budi Hermawan", divisi: "Transmisi" },
  { id: uuid(), nama: "Dedi Kurniawan", divisi: "Gardu Induk" },
];

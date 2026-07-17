// import node module libraries
import { v4 as uuid } from "uuid";

// import custom types
import { RiwayatConsumableKeluarType } from "types/RiwayatTypes";

// Dummy data khusus tampilan halaman "Riwayat > Consumable Keluar".
// Nantinya diganti hasil fetch API setelah backend punya endpoint riwayat
// pengambilan bahan consumable.
export const RiwayatConsumableKeluarData: RiwayatConsumableKeluarType[] = [
  {
    id: uuid(),
    nomor_transaksi: "TRX-CK-0001",
    tanggal_pengambilan: "06 Jul 2026, 10:05",
    kode_barang: "CS-001",
    nama_barang: "Baut M8",
    merk: "Krisbow",
    tipe: "Galvanis",
    er_e: "E",
    ukuran: "M8 x 40mm",
    jumlah: 25,
    nama_peminta: "Ahmad Sobari",
    divisi: "Pemeliharaan Trafo",
    area_kerja: "Gardu Induk A",
    keterangan: "Untuk pemasangan bracket panel baru.",
  },
  {
    id: uuid(),
    nomor_transaksi: "TRX-CK-0002",
    tanggal_pengambilan: "08 Jul 2026, 13:40",
    kode_barang: "CS-014",
    nama_barang: "Isolasi Kabel",
    merk: "3M",
    tipe: "Super 33+",
    er_e: "ER",
    ukuran: "19mm x 20m",
    jumlah: 5,
    nama_peminta: "Indra Jati",
    divisi: "Audit Energi",
    area_kerja: "Gedung Pusat",
    keterangan: "",
  },
  {
    id: uuid(),
    nomor_transaksi: "TRX-CK-0003",
    tanggal_pengambilan: "11 Jul 2026, 08:50",
    kode_barang: "CS-027",
    nama_barang: "Kabel Jumper",
    merk: "Legrand",
    tipe: "Fleksibel",
    er_e: "E",
    ukuran: "10 mm\u00b2",
    jumlah: 12,
    nama_peminta: "Budi Hermawan",
    divisi: "Transmisi",
    area_kerja: "Menara Transmisi 14",
    keterangan:
      "Dipakai untuk perbaikan sambungan darurat di menara 14, sisa akan dikembalikan ke gudang minggu depan kalau tidak terpakai semua.",
  },
];

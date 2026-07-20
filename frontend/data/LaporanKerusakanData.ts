// import node module libraries
import { v4 as uuid } from "uuid";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

// Dummy data khusus tampilan halaman "Laporan Kerusakan Alat".
// Nantinya ini adalah SUBSET dari riwayat peminjaman: baris di mana
// kondisi_pengembalian != "Baik". Begitu backend sudah expose field itu,
// ganti sumber data ini jadi filter dari getRiwayatPeminjaman() /
// service khusus getLaporanKerusakan().
export const LaporanKerusakanData: LaporanKerusakanType[] = [
  {
    id: uuid(),
    tanggal_pengembalian: "12 Jul 2026, 11:00",
    kode_barang: "TL-201-F",
    nama_barang: "Crimping Tool Hydraulic",
    merk: "Cembre",
    tipe: "HT131",
    warna: "Merah",
    ukuran: "45 cm",
    jumlah_rusak: 1,
    nama_peminjam: "Budi Hermawan",
    divisi: "Transmisi",
    area_kerja: "Menara Transmisi 14",
    keterangan: "Gagang retak, kemungkinan terjatuh saat pemakaian.",
  },
  {
    id: uuid(),
    tanggal_pengembalian: "13 Jul 2026, 09:40",
    kode_barang: "TL-044-C",
    nama_barang: "Thermal Imaging Camera",
    merk: "FLIR",
    tipe: "E8-XT",
    warna: "Hitam",
    ukuran: "Genggam",
    jumlah_rusak: 1,
    nama_peminjam: "Dedi Kurniawan",
    divisi: "Gardu Induk",
    area_kerja: "Gardu Induk B",
    keterangan: "Layar LCD pecah, unit tidak menyala.",
  },
  {
    id: uuid(),
    tanggal_pengembalian: "15 Jul 2026, 14:20",
    kode_barang: "TL-092-B",
    nama_barang: "Multimeter Digital",
    merk: "Fluke",
    tipe: "87V",
    warna: "Kuning-Hitam",
    ukuran: "Genggam",
    jumlah_rusak: 1,
    nama_peminjam: "Ahmad Sobari",
    divisi: "Pemeliharaan Trafo",
    area_kerja: "Gardu Induk A",
    keterangan: "Probe kabel putus, perlu penggantian.",
  },
];

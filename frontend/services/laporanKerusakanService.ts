import apiFetch from "lib/api";
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

function formatTanggalJam(isoString: string): string {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}

interface LaporanKerusakanApiResponse {
  id: string;
  tanggal: string;
  tool_id: string;
  peminjaman_id: string | null;
  jumlah: number;
  keterangan: string | null;
  dilaporkan_oleh: string;
  tool: {
    kode_barang: string;
    nama_barang: string;
    merk: string | null;
    type: string | null;
    warna: string | null;
    ukuran: string | null;
  } | null;
  peminjaman: {
    area_pekerjaan: string | null;
    nama_pekerjaan: string | null;
    peminta: {
      nama: string;
      divisi: string | null;
    } | null;
  } | null;
}

interface CreateLaporanKerusakanPayload {
  tanggal: string;
  tool_id: string;
  peminjaman_id: string;
  jumlah: number;
  keterangan: string;
  dilaporkan_oleh: string;
}

function mapLaporanFromApi(item: LaporanKerusakanApiResponse): LaporanKerusakanType {
  return {
    id: item.id,
    tanggal_pengembalian: formatTanggalJam(item.tanggal),
    kode_barang: item.tool?.kode_barang ?? "-",
    nama_barang: item.tool?.nama_barang ?? "-",
    merk: item.tool?.merk ?? "-",
    tipe: item.tool?.type ?? "-",
    warna: item.tool?.warna ?? "-",
    ukuran: item.tool?.ukuran ?? "-",
    jumlah_rusak: item.jumlah,
    nama_peminjam: item.peminjaman?.peminta?.nama ?? "-",
    divisi: item.peminjaman?.peminta?.divisi ?? "-",
    nama_pekerjaan: item.peminjaman?.nama_pekerjaan ?? "-",
    area_kerja: item.peminjaman?.area_pekerjaan ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

export async function getLaporanKerusakan(): Promise<LaporanKerusakanType[]> {
  const data = await apiFetch<LaporanKerusakanApiResponse[]>("/laporan-kerusakan");
  return data.map(mapLaporanFromApi);
}

export async function createLaporanKerusakan(
  payload: CreateLaporanKerusakanPayload
): Promise<void> {
  await apiFetch("/laporan-kerusakan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
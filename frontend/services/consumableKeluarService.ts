import apiFetch from "lib/api";
import { RiwayatConsumableKeluarType } from "types/RiwayatTypes";
import { ConsumableCartItemType, ConsumableOutFormValues } from "types/DataConsumableTypes";

// BULAN_SINGKAT dihapus karena fitur bawaan Intl.DateTimeFormat ("id-ID") sudah mendukungnya.

function formatTanggalJam(isoString: string): string {
  const d = new Date(isoString);

  // Menggunakan "id-ID" agar otomatis mendapatkan format bahasa Indonesia (Mei, Agu, Okt, dst)
  const parts = new Intl.DateTimeFormat("id-ID", {
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

function buildNomorTransaksi(tanggalIso: string, pemintaNama: string): string {
  const timestamp = new Date(tanggalIso).getTime();
  const pemintaCode = pemintaNama.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return `TRX-${timestamp}-${pemintaCode}`;
}

// Bentuk response index() dari Laravel, dengan relasi consumable & peminta ter-load
interface ConsumableKeluarApiResponse {
  id: string;
  tanggal: string;
  consumable_id: string;
  jumlah_keluar: number;
  pekerjaan_area: string | null;
  keterangan: string | null;
  consumable: {
    kode_barang: string;
    nama: string;
    merk: string | null;
    type: string | null;
    er_e: string | null;
    ukuran: string | null;
  } | null;
  peminta: {
    nama: string;
    kategori: string | null;
  } | null;
}

function mapRiwayatConsumableKeluarFromApi(
  item: ConsumableKeluarApiResponse
): RiwayatConsumableKeluarType {
  const namaPeminta = item.peminta?.nama ?? "-";
  return {
    id: item.id,
    nomor_transaksi: buildNomorTransaksi(item.tanggal, namaPeminta),
    tanggal_pengambilan: formatTanggalJam(item.tanggal),
    kode_barang: item.consumable?.kode_barang ?? "-",
    nama_barang: item.consumable?.nama ?? "-",
    merk: item.consumable?.merk ?? "-",
    tipe: item.consumable?.type ?? "-",
    er_e: item.consumable?.er_e ?? "-",
    ukuran: item.consumable?.ukuran ?? "-",
    jumlah: item.jumlah_keluar,
    nama_peminta: namaPeminta,
    divisi: item.peminta?.kategori ?? "-",
    area_kerja: item.pekerjaan_area ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

export async function getRiwayatConsumableKeluar(): Promise<RiwayatConsumableKeluarType[]> {
  const data: ConsumableKeluarApiResponse[] = await apiFetch("/consumable-keluar");
  return data.map(mapRiwayatConsumableKeluarFromApi);
}

interface CreateConsumableKeluarPayload {
  tanggal: string;
  consumable_id: string;
  peminta_id: string;
  jumlah_keluar: number;
  pekerjaan_area: string;
  keterangan: string;
  dicatat_oleh: string;
}

export async function submitConsumableKeluar(
  cartItems: ConsumableCartItemType[],
  values: ConsumableOutFormValues,
  dicatatOleh: string
): Promise<void> {
  const tanggal = new Date().toISOString();

  // Menggunakan Promise.all agar semua request dieksekusi secara paralel (jauh lebih cepat)
  const submitPromises = cartItems.map((item) => {
    const payload: CreateConsumableKeluarPayload = {
      tanggal,
      consumable_id: item.consumable_id,
      peminta_id: values.pemintaId,
      jumlah_keluar: item.jumlah,
      pekerjaan_area: values.areaKerja,
      keterangan: values.keterangan,
      dicatat_oleh: dicatatOleh,
    };

    return apiFetch("/consumable-keluar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  await Promise.all(submitPromises);
}
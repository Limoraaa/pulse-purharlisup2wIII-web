// components/manajemenmesin/rencanapemeliharaanmesin/RencanaHelpers.tsx

// 1. KEMBALIKAN 'K' AGAR DIKENALI OLEH SISTEM MATRIKS
export type AksiCode = 'C' | 'L' | 'P' | 'M' | 'K';

export interface MesinSimple {
  id: number;
  kode_mesin: string;
  nama_mesin: string;
}

export interface RencanaItem {
  id: number | string;
  mesin_id: number;
  kode_mesin?: string | null;
  nama_mesin?: string | null;
  tahun: number;
  bulan: number; // 1..12
  minggu: number; // 1..4
  aksi: AksiCode;
  status: string; // 'Terjadwal' | 'Selesai' | 'Terlewat'
  rab?: number | null;
  keterangan?: string | null;
  log_id?: number | null;
  tanggal_selesai?: string | null;
  tahun_realisasi?: number | null;
  bulan_realisasi?: number | null;
  minggu_realisasi?: number | null;
  jenis_pelaksana?: 'Internal' | 'Vendor';
  nama_vendor?: string | null;
  no_po?: string | null;
  biaya_aktual?: number | null;
}

export const BULAN_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const BULAN_NAMES_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

// ===== Alias yang dipakai RencanaFormModal, RencanaMesinCard, RencanaPemeliharaanManager =====

export const MONTHS_LONG = BULAN_NAMES;
export const MONTHS_SHORT = BULAN_NAMES_SHORT;

// Route halaman pemeliharaan mesin (tanpa query).
export const PEMELIHARAAN_MESIN_PATH = '/pemeliharaan/data-mesin';

// URL "Kerjakan sekarang": membawa mesin, rencana, dan tindakan yang dipilih.
export const buildKerjakanUrl = (item: {
  id: string | number;
  mesinId: string | number;
  aksi: AksiCode;
}): string =>
  `${PEMELIHARAAN_MESIN_PATH}?${new URLSearchParams({
    mesin: String(item.mesinId),
    rencana: String(item.id),
    aksi: item.aksi,
  })}`;

// 2. TETAP HAPUS 'K' DARI SINI AGAR TIDAK MUNCUL DI FORM MODAL
export const ACTION_KEYS: AksiCode[] = ['C', 'L', 'M', 'P'];

// 3. KEMBALIKAN 'K' KE META AGAR BADGE MATRIKS BISA DIWARNAI
export const ACTION_META: Record<
  AksiCode,
  { label: string; color: string; textColor: string }
> = {
  C: { label: 'Cleaning / Check', color: '#0d6efd', textColor: '#ffffff' },
  L: { label: 'Lubrication', color: '#fd7e14', textColor: '#ffffff' },
  M: { label: 'Maintenance', color: '#6f42c1', textColor: '#ffffff' },
  P: { label: 'Part Replacement', color: '#0dcaf0', textColor: '#000000' },
  K: { label: 'Kalibrasi', color: '#20c997', textColor: '#ffffff' },
};

export type StatusTampil = 'Terjadwal' | 'Selesai' | 'Terlewat';

export const STATUS_VARIANT: Record<StatusTampil, string> = {
  Terjadwal: 'secondary',
  Selesai: 'success',
  Terlewat: 'danger',
};

// Status untuk tampilan: "Selesai" dari backend, atau "Terlewat" jika minggunya sudah lewat
export const getStatusTampil = (
  item: Pick<RencanaItem, 'tahun' | 'bulan' | 'minggu' | 'status'>,
  today: Date
): StatusTampil => {
  const st = (item.status || '').toLowerCase();
  if (st === 'selesai') return 'Selesai';
  if (st === 'terlewat') return 'Terlewat';

  const curY = today.getFullYear();
  const curM = today.getMonth() + 1;
  const curW = Math.min(4, Math.max(1, Math.ceil(today.getDate() / 7)));

  const lewat =
    item.tahun < curY ||
    (item.tahun === curY && item.bulan < curM) ||
    (item.tahun === curY && item.bulan === curM && item.minggu < curW);

  return lewat ? 'Terlewat' : 'Terjadwal';
};

export const formatJadwal = (
  r: Pick<RencanaItem, 'tahun' | 'bulan' | 'minggu'>
): string => `${BULAN_NAMES[r.bulan - 1]} ${r.tahun} (W${r.minggu})`;

// ===== Kode lama =====

// 4. TETAP HAPUS 'K' DARI OPTIONS AGAR TIDAK MUNCUL DI SELECT DROPDOWN
export const AKSI_OPTIONS: Array<{
  value: AksiCode;
  label: string;
  desc: string;
}> = [
  { value: 'C', label: 'C - Cleaning / Check', desc: 'Cleaning / Check' },
  { value: 'L', label: 'L - Lubrication', desc: 'Lubrication' },
  { value: 'M', label: 'M - Maintenance', desc: 'Maintenance' },
  { value: 'P', label: 'P - Part Replacement', desc: 'Part Replacement' },
];

export const getActionLabel = (aksi: string): string => {
  const found = AKSI_OPTIONS.find((o) => o.value === aksi);
  if (found) return `${found.value} (${found.desc})`;
  
  // 5. TANGANI LABEL KALIBRASI SECARA MANUAL JIKA DIPANGGIL
  if (aksi === 'K') return 'K (Kalibrasi)';
  
  return aksi;
};

export const isStatusSelesai = (status?: string | null): boolean =>
  (status || '').toLowerCase() === 'selesai';

export const isStatusTerlewat = (
  item: Pick<RencanaItem, 'tahun' | 'bulan' | 'minggu' | 'status'>
): boolean => {
  const st = (item.status || '').toLowerCase();
  if (st === 'selesai') return false;
  if (st === 'terlewat') return true;

  // Cek apakah sudah lewat dari minggu berjalan
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curW = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));

  if (item.tahun < curY) return true;
  if (item.tahun === curY && item.bulan < curM) return true;
  if (item.tahun === curY && item.bulan === curM && item.minggu < curW) {
    return true;
  }
  return false;
};

/**
 * Mengambil posisi Tahun, Bulan (1..12), dan Minggu (1..4) untuk baris REALISASI.
 * Diambil dari `tanggal_selesai` (`log.waktu_pelaksana`) jika ada,
 * atau fallback ke `bulan` & `minggu` rencana jika `tanggal_selesai` kosong.
 */
export const getRealisasiSlot = (
  item: RencanaItem
): {
  tahun: number;
  bulan: number;
  minggu: number;
  tanggalFormatted: string | null;
} | null => {
  if (!isStatusSelesai(item.status)) return null;

  if (item.bulan_realisasi && item.minggu_realisasi) {
    return {
      tahun: Number(item.tahun_realisasi || item.tahun),
      bulan: Number(item.bulan_realisasi),
      minggu: Number(item.minggu_realisasi),
      tanggalFormatted: formatDateIndo(item.tanggal_selesai),
    };
  }

  if (item.tanggal_selesai) {
    const dt = new Date(item.tanggal_selesai);
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const w = Math.min(4, Math.max(1, Math.ceil(dt.getDate() / 7)));
      return {
        tahun: y,
        bulan: m,
        minggu: w,
        tanggalFormatted: formatDateIndo(item.tanggal_selesai),
      };
    }
  }

  return {
    tahun: Number(item.tahun),
    bulan: Number(item.bulan),
    minggu: Number(item.minggu),
    tanggalFormatted: null,
  };
};

export const formatDateIndo = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const dateOnly = dateStr.split('T')[0].split(' ')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${BULAN_NAMES[m] || ''} ${y}`;
  }
  return dateStr;
};

export const formatRupiah = (val?: number | null): string => {
  if (val === undefined || val === null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};
// Util tanggal bersama untuk filter rentang/bulan.
// Menormalisasi berbagai format tanggal yang ada di aplikasi (ISO dari
// backend maupun string hasil format layanan) ke satu representasi.

export interface DateFilterValue {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export const NAMA_BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const pad = (n: number) => String(n).padStart(2, '0');

export const toYMD = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Parse fleksibel: ISO ("2026-09-15T07:30:00.000000Z") maupun string tampilan
// ("15 Sep 2026, 07:30", "15 September 2026", id-ID atau en-GB).
export function parseRowDate(raw?: string | null): Date | null {
  if (!raw) return null;

  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;

  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5,
    jul: 6, aug: 7, agu: 7, sep: 8, oct: 9, okt: 9,
    nov: 10, dec: 11, des: 11,
  };

  const match = raw.match(/(\d{1,2})[\s.-]+([A-Za-z]+)[\s.,-]+(\d{4})/);
  if (!match) return null;

  const monthKey = match[2].toLowerCase().slice(0, 3);
  const month = monthMap[monthKey];
  if (month === undefined) return null;

  const day = Number(match[1]);
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Buat rentang satu bulan penuh (1 .. akhir bulan).
export function monthRange(year: number, month: number): DateFilterValue {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
}

export function isWholeMonth(value: DateFilterValue): boolean {
  const [sy, sm] = value.start.split('-').map(Number);
  const lastDayOfMonth = new Date(sy, sm, 0).getDate();
  return (
    value.start === `${sy}-${pad(sm)}-01` &&
    value.end === `${sy}-${pad(sm)}-${pad(lastDayOfMonth)}`
  );
}

const shortDate = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date
    .toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/\./g, '');
};

// Format untuk label tombol: "September 2026" (satu bulan),
// "01 Sep 2026 - 15 Sep 2026" (rentang), "" (kosong).
export function formatDateFilter(value: DateFilterValue | null): string {
  if (!value) return '';
  if (isWholeMonth(value)) {
    const [y, m] = value.start.split('-').map(Number);
    return `${NAMA_BULAN_ID[m - 1]} ${y}`;
  }
  if (value.start === value.end) return shortDate(value.start);
  return `${shortDate(value.start)} - ${shortDate(value.end)}`;
}

export function dateInFilter(d: Date, value: DateFilterValue): boolean {
  const t = d.getTime();
  const start = new Date(`${value.start}T00:00:00`).getTime();
  const end = new Date(`${value.end}T23:59:59.999`).getTime();
  return t >= start && t <= end;
}

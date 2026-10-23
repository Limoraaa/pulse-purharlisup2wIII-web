// Tanggal lokal perangkat (WIB) dalam format YYYY-MM-DD.
// Jangan pakai toISOString() untuk ini: hasilnya UTC, sehingga antara jam 00.00–07.00 WIB tanggalnya mundur sehari.
export function tanggalLokal(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Jatuh tempo dianggap lewat mulai keesokan harinya (hari jatuh tempo itu sendiri belum terlewat)
export const sudahLewat = (tanggal: string | null | undefined): boolean =>
  !!tanggal && String(tanggal).slice(0, 10) < tanggalLokal();

// Pencarian per kata: "bor 13" cocok dengan "Mata Bor" ukuran "13 mm", walaupun kata-katanya
// berada di kolom yang berbeda. Setiap kata wajib ditemukan di salah satu kolom (urutan bebas,
// huruf besar/kecil diabaikan). Hasil yang katanya cocok persis (mis. ukuran "13", bukan kode
// "T-130") ditaruh paling atas.

type Nilai = string | number | null | undefined;

const normal = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
// Versi tanpa spasi & tanda baca, supaya "13mm" tetap cocok dengan "13 mm" dan "t001" dengan "T-001"
const rapat = (s: string) => s.replace(/[^a-z0-9]/g, "");

export function pecahKata(keyword: string): string[] {
  return normal(keyword).split(/\s+/).filter(Boolean);
}

/**
 * Skor kecocokan: -1 = tidak cocok, makin besar makin relevan.
 * Setiap kata: 2 = sama persis dengan satu kata di data, 1 = awal kata, 0 = bagian dari kata.
 */
export function skorPencarian(kata: string[], kolom: Nilai[]): number {
  if (kata.length === 0) return 0;
  const teks = normal(kolom.filter((v) => v !== null && v !== undefined && v !== "").join(" "));
  const teksRapat = rapat(teks);
  // Kata di data; angka & huruf yang menempel dipisah ("13mm" -> "13", "mm") agar "13" dianggap persis
  const token = teks
    .split(/[^a-z0-9]+/)
    .flatMap((t) => [t, ...t.split(/(?<=\d)(?=[a-z])|(?<=[a-z])(?=\d)/)])
    .filter(Boolean);

  let skor = 0;
  for (const k of kata) {
    const kRapat = rapat(k);
    if (!teks.includes(k) && !(kRapat && teksRapat.includes(kRapat))) return -1;
    if (token.includes(kRapat)) skor += 2;
    else if (token.some((t) => t.startsWith(kRapat))) skor += 1;
  }
  return skor;
}

/** Saring lalu urutkan daftar. Tanpa kata kunci, daftar dikembalikan apa adanya. */
export function saringPencarian<T>(items: T[], keyword: string, kolom: (item: T) => Nilai[]): T[] {
  const kata = pecahKata(keyword);
  if (kata.length === 0) return items;
  return items
    .map((item, urutan) => ({ item, urutan, skor: skorPencarian(kata, kolom(item)) }))
    .filter((x) => x.skor >= 0)
    .sort((a, b) => b.skor - a.skor || a.urutan - b.urutan)
    .map((x) => x.item);
}

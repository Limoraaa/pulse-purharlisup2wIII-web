import type { Row, RowData } from "@tanstack/react-table";

// Flag opt-in agar chevron bawaan TanstackTable tidak double dengan
// ikon custom KodeBarangSortHeader. Dipakai hanya di kolom Kode Barang.
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    hideDefaultSortIcon?: boolean;
  }
}

/**
 * Membandingkan dua kode barang secara natural (bukan string mentah).
 * Format umum: PREFIX-angka, mis. "I-100", "CS-001", "T-029".
 * - Prefix dibandingkan alfabetis (case-insensitive).
 * - Angka di belakang dibandingkan numerik, jadi "I-2" < "I-100"
 *   (kalau string mentah, "I-100" < "I-2" karena "1" < "2").
 * - Kode tanpa angka di belakang dibandingkan alfabetis biasa.
 */
export function compareKodeBarang(a: string, b: string): number {
  const parse = (s: string) => {
    const text = (s ?? "").trim();
    const match = text.match(/^(.*?)(\d+)\s*$/);
    if (!match) return { prefix: text.toUpperCase(), num: NaN };
    return { prefix: match[1].trim().toUpperCase(), num: parseInt(match[2], 10) };
  };

  const left = parse(a);
  const right = parse(b);

  if (left.prefix !== right.prefix) {
    return left.prefix < right.prefix ? -1 : 1;
  }

  const leftIsNum = !Number.isNaN(left.num);
  const rightIsNum = !Number.isNaN(right.num);
  if (leftIsNum && rightIsNum) return left.num - right.num;
  if (leftIsNum !== rightIsNum) return leftIsNum ? -1 : 1;
  return 0;
}

/**
 * SortingFn generik untuk kolom Kode Barang di TanStack Table.
 * Dipakai bersama oleh Data Tools dan Data Consumable.
 */
export function kodeBarangSortingFn<TData>(
  rowA: Row<TData>,
  rowB: Row<TData>,
  columnId: string
): number {
  return compareKodeBarang(
    String(rowA.getValue(columnId) ?? ""),
    String(rowB.getValue(columnId) ?? "")
  );
}

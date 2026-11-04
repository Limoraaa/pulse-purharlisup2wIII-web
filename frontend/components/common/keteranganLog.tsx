"use client";
import React from "react";

// Keterangan log pemeliharaan dari Checklist Visual disimpan backend sebagai satu teks:
//   "Part A: Item 1 (Baik); Item 2 (Rusak: catatan) | Catatan Part A: ... | Part B: ..."
// Di sini teks itu dipecah lagi per part agar tampil rapi (web, Excel, PDF).
// Keterangan yang diketik manual (tidak berformat checklist) tetap ditampilkan apa adanya.

export interface ItemKeterangan {
  teks: string;
  status: string | null; // "Baik" | "Perlu perhatian" | "Rusak"
  catatan: string | null;
}

export interface PartKeterangan {
  nama: string;
  items: ItemKeterangan[];
  catatan: string | null;
}

const POLA_ITEM = /^(.*) \((Baik|Perlu perhatian|Rusak)(?:: ([\s\S]*))?\)$/;

export function uraiKeterangan(ket?: string | null): PartKeterangan[] | null {
  if (!ket) return null;
  const parts: PartKeterangan[] = [];

  for (const bagian of ket.split(" | ")) {
    const sebelumnya = parts[parts.length - 1];
    if (sebelumnya && bagian.startsWith(`Catatan ${sebelumnya.nama}: `)) {
      sebelumnya.catatan = bagian.slice(`Catatan ${sebelumnya.nama}: `.length);
      continue;
    }
    const pemisah = bagian.indexOf(": ");
    if (pemisah <= 0) return null;
    const items = bagian
      .slice(pemisah + 2)
      .split("; ")
      .map((it) => {
        const m = it.match(POLA_ITEM);
        return m ? { teks: m[1], status: m[2], catatan: m[3] ?? null } : null;
      });
    // Bukan format checklist (mis. keterangan manual yang kebetulan memakai titik dua)
    if (items.some((it) => it === null)) return null;
    parts.push({ nama: bagian.slice(0, pemisah), items: items as ItemKeterangan[], catatan: null });
  }
  return parts.length ? parts : null;
}

const labelItem = (it: ItemKeterangan) => `${it.teks} - ${it.status}${it.catatan ? `: ${it.catatan}` : ""}`;

// Versi teks untuk Excel & PDF: nama part, lalu poin pemeriksaan di bawahnya
export function keteranganUntukExport(ket?: string | null): string {
  const parts = uraiKeterangan(ket);
  if (!parts) return ket || "-";
  return parts
    .map((p) =>
      [`${p.nama}:`, ...p.items.map((it) => `  • ${labelItem(it)}`), ...(p.catatan ? [`  Catatan: ${p.catatan}`] : [])].join("\n")
    )
    .join("\n\n");
}

const WARNA_STATUS: Record<string, string> = { Baik: "text-success", "Perlu perhatian": "text-warning", Rusak: "text-danger" };

function DaftarPart({ parts }: { parts: PartKeterangan[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <div key={i} className={i > 0 ? "mt-2" : undefined}>
          <div className="fw-semibold">{p.nama}</div>
          <ul className="mb-0 ps-3">
            {p.items.map((it, j) => (
              <li key={j}>
                {it.teks} — <span className={`fw-semibold ${WARNA_STATUS[it.status ?? ""] ?? ""}`}>{it.status}</span>
                {it.catatan ? `: ${it.catatan}` : ""}
              </li>
            ))}
          </ul>
          {p.catatan && <div className="fst-italic text-secondary">Catatan: {p.catatan}</div>}
        </div>
      ))}
    </>
  );
}

// Sel Keterangan pada tabel log: rapi per part, ringkas sampai "Selengkapnya" ditekan
export function KeteranganLog({
  ket,
  expanded,
  onToggle,
}: {
  ket?: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const parts = uraiKeterangan(ket);
  const tombol = (label: string) => (
    <button type="button" className="btn btn-link btn-sm p-0" style={{ fontSize: "0.75rem" }} onClick={onToggle}>
      {label}
    </button>
  );

  if (!parts) {
    const teks = ket || "-";
    return (
      <>
        <div
          style={expanded ? { whiteSpace: "pre-line" } : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {teks}
        </div>
        {teks.length > 80 && tombol(expanded ? "Sembunyikan" : "Selengkapnya")}
      </>
    );
  }

  // Ringkas: hanya part pertama; sisanya muncul setelah "Selengkapnya"
  const tampil = expanded ? parts : parts.slice(0, 1);
  return (
    <div style={{ minWidth: 260 }}>
      <DaftarPart parts={tampil} />
      {parts.length > 1 && tombol(expanded ? "Sembunyikan" : `Selengkapnya (${parts.length} part)`)}
    </div>
  );
}

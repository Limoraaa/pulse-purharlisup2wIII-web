"use client";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

// Label QR yang ditempel di mesin. Isi QR = alamat halaman catatan mesin di website yang sedang dibuka,
// jadi label yang dicetak dari server/domain produksi otomatis berisi alamat domain tersebut.
// Mesin dikenali lewat kode mesin (bukan ID database) agar stiker tetap berlaku walau data diimpor ulang.

export type JenisLabel = "operasional" | "pemeliharaan";

export interface MesinUntukLabel {
  kode_mesin: string;
  nama_mesin: string;
}

const JENIS: Record<JenisLabel, { judul: string; sub: string; warna: string; path: string }> = {
  operasional: { judul: "OPERASIONAL", sub: "Catatan Aktivitas Mesin", warna: "#0d6efd", path: "/operasional/data-mesin" },
  pemeliharaan: { judul: "PEMELIHARAAN", sub: "Catatan Pemeliharaan Mesin", warna: "#198754", path: "/pemeliharaan/data-mesin" },
};

// Ukuran label dalam piksel (rasio 5 x 6 cm)
const LEBAR = 600;
const TINGGI = 720;

export function urlCatatanMesin(kodeMesin: string, jenis: JenisLabel): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${window.location.origin}${basePath}${JENIS[jenis].path}?kode=${encodeURIComponent(kodeMesin)}`;
}

// Pecah teks per kata supaya tiap baris muat di lebar maxWidth
function pecahBaris(ctx: CanvasRenderingContext2D, teks: string, maxWidth: number): string[] {
  const baris: string[] = [];
  let sekarang = "";
  teks.split(/\s+/).forEach((kata) => {
    const coba = sekarang ? `${sekarang} ${kata}` : kata;
    if (ctx.measureText(coba).width <= maxWidth || !sekarang) {
      sekarang = coba;
    } else {
      baris.push(sekarang);
      sekarang = kata;
    }
  });
  if (sekarang) baris.push(sekarang);
  return baris;
}

function muatGambar(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Satu label: pita judul berwarna, QR, lalu nama & kode mesin di bawahnya
export async function buatLabelMesin(mesin: MesinUntukLabel, jenis: JenisLabel): Promise<HTMLCanvasElement> {
  const info = JENIS[jenis];
  const canvas = document.createElement("canvas");
  canvas.width = LEBAR;
  canvas.height = TINGGI;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LEBAR, TINGGI);

  // Pita judul
  ctx.fillStyle = info.warna;
  ctx.fillRect(0, 0, LEBAR, 92);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.fillText(info.judul, LEBAR / 2, 40);
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText(info.sub, LEBAR / 2, 74);

  // QR
  const qr = await muatGambar(
    await QRCode.toDataURL(urlCatatanMesin(mesin.kode_mesin, jenis), { width: 420, margin: 1, errorCorrectionLevel: "M" })
  );
  ctx.drawImage(qr, (LEBAR - 420) / 2, 108, 420, 420);

  // Nama mesin (dipecah maks. 2 baris, dikecilkan bila perlu) dan kode mesin
  ctx.fillStyle = "#212529";
  let ukuran = 34;
  let baris: string[] = [];
  do {
    ctx.font = `bold ${ukuran}px Arial, sans-serif`;
    baris = pecahBaris(ctx, mesin.nama_mesin, LEBAR - 40);
    ukuran -= 2;
  } while (baris.length > 2 && ukuran >= 22);
  baris = baris.slice(0, 2);
  let y = 560;
  baris.forEach((b) => {
    ctx.fillText(b, LEBAR / 2, y);
    y += ukuran + 8;
  });
  ctx.font = "26px Arial, sans-serif";
  ctx.fillStyle = "#495057";
  ctx.fillText(`Kode: ${mesin.kode_mesin}`, LEBAR / 2, Math.max(y + 6, 650));
  ctx.font = "italic 20px Arial, sans-serif";
  ctx.fillStyle = "#6c757d";
  ctx.fillText("Scan dengan kamera HP", LEBAR / 2, TINGGI - 22);

  // Garis tepi (panduan gunting)
  ctx.strokeStyle = "#adb5bd";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, LEBAR - 2, TINGGI - 2);
  return canvas;
}

const namaFile = (kode: string) => kode.replace(/[^a-zA-Z0-9-_]+/g, "_");

// Satu PNG berisi 2 label berdampingan (Operasional & Pemeliharaan) untuk satu mesin
export async function unduhLabelMesin(mesin: MesinUntukLabel): Promise<void> {
  const [op, pm] = await Promise.all([buatLabelMesin(mesin, "operasional"), buatLabelMesin(mesin, "pemeliharaan")]);
  const jarak = 40;
  const gabung = document.createElement("canvas");
  gabung.width = LEBAR * 2 + jarak;
  gabung.height = TINGGI;
  const ctx = gabung.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, gabung.width, gabung.height);
  ctx.drawImage(op, 0, 0);
  ctx.drawImage(pm, LEBAR + jarak, 0);

  const a = document.createElement("a");
  a.href = gabung.toDataURL("image/png");
  a.download = `qr-mesin-${namaFile(mesin.kode_mesin)}.png`;
  a.click();
}

// PDF A4 berisi label semua mesin (per mesin: Operasional lalu Pemeliharaan), 3 x 3 label per halaman
export async function cetakSemuaLabel(daftar: MesinUntukLabel[]): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = 60; // mm
  const h = 72; // mm (rasio 5 x 6)
  const kolom = 3;
  const barisPerHalaman = 3;
  const kiri = (210 - (kolom * w + (kolom - 1) * 5)) / 2;
  const atas = 12;

  const label: { mesin: MesinUntukLabel; jenis: JenisLabel }[] = daftar.flatMap((m) => [
    { mesin: m, jenis: "operasional" as const },
    { mesin: m, jenis: "pemeliharaan" as const },
  ]);

  for (let i = 0; i < label.length; i++) {
    const posisi = i % (kolom * barisPerHalaman);
    if (i > 0 && posisi === 0) pdf.addPage();
    const x = kiri + (posisi % kolom) * (w + 5);
    const y = atas + Math.floor(posisi / kolom) * (h + 5);
    const canvas = await buatLabelMesin(label[i].mesin, label[i].jenis);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h);
  }

  pdf.save("label-qr-mesin.pdf");
}

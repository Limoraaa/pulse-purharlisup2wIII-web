"use client";
import QRCode from "qrcode";

interface DownloadQrLabelOptions {
  data: string; // isi QR (ID barang, dipakai sistem saat scan)
  kodeBarang: string;
  namaBarang: string;
  fileName: string; // tanpa ekstensi
}

const QR_SIZE = 500;
const PADDING = 24; // jarak teks dari tepi kiri/kanan
const FONT_MAX = 40;
const FONT_MIN = 26;
const LINE_GAP = 1.25; // tinggi baris = ukuran huruf x LINE_GAP

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

// Download gambar PNG: QR di atas, teks "kode — nama barang" di bawahnya.
// Teks dikecilkan dulu sampai muat satu baris; kalau masih kepanjangan, dipecah ke beberapa baris
// dan area teks ikut meninggi, jadi tidak ada yang terpotong.
export async function downloadQrDenganLabel({ data, kodeBarang, namaBarang, fileName }: DownloadQrLabelOptions) {
  const qrDataUrl = await QRCode.toDataURL(data, {
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "H",
  });

  const qrImage = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImage.onload = () => resolve();
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  const label = namaBarang ? `${kodeBarang} — ${namaBarang}` : kodeBarang;
  const maxWidth = QR_SIZE - PADDING * 2;

  // Ukur dulu pakai canvas sementara untuk menentukan ukuran huruf & jumlah baris
  const ukur = document.createElement("canvas").getContext("2d");
  if (!ukur) return;
  let fontSize = FONT_MAX;
  const setFont = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.font = `bold ${size}px Arial, sans-serif`;
  };
  setFont(ukur, fontSize);
  while (fontSize > FONT_MIN && ukur.measureText(label).width > maxWidth) {
    fontSize -= 2;
    setFont(ukur, fontSize);
  }
  const baris = pecahBaris(ukur, label, maxWidth);
  const tinggiBaris = fontSize * LINE_GAP;
  const textArea = Math.max(100, Math.ceil(baris.length * tinggiBaris + 40));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = QR_SIZE;
  canvas.height = QR_SIZE + textArea;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qrImage, 0, 0, QR_SIZE, QR_SIZE);

  ctx.fillStyle = "#000000";
  setFont(ctx, fontSize);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const awalY = QR_SIZE + textArea / 2 - ((baris.length - 1) * tinggiBaris) / 2;
  baris.forEach((b, i) => ctx.fillText(b, QR_SIZE / 2, awalY + i * tinggiBaris));

  const link = document.createElement("a");
  link.download = `${fileName}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

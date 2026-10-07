export interface PartTemplate {
  partName: string;
  checklistItems: string[];
}

// Diambil dari IK.068.UP3 - Instruksi Kerja Pemeliharaan Mesin Bubut Konvensional
// (Pinacho Mod L-1/200), bagian 3.5 "Pekerjaan Pemeliharaan Preventif", poin 2-9.
// Poin 1 (bersihkan mesin) dan poin 10 (uji jalan) sengaja tidak dimasukkan di sini
// karena sifatnya umum/menyeluruh, bukan spesifik ke satu bagian mesin.
export const IK_MESIN_BUBUT_TEMPLATES: PartTemplate[] = [
  {
    partName: "Bed / Way / Leadscrew",
    checklistItems: ["Periksa kondisi bed, way, dan leadscrew", "Lumasi sesuai jadwal pelumasan"],
  },
  {
    partName: "Belt",
    checklistItems: ["Periksa kondisi belt", "Periksa ketegangan belt"],
  },
  {
    partName: "Gearbox / Spindle",
    checklistItems: ["Periksa level oli gearbox/spindle", "Tambahkan atau ganti oli sesuai interval"],
  },
  {
    partName: "Tangki Coolant",
    checklistItems: [
      "Periksa kondisi coolant",
      "Bersihkan tangki coolant",
      "Ganti coolant bila sudah kotor/terkontaminasi",
    ],
  },
  {
    partName: "Chuck / Collet (Pencekam)",
    checklistItems: ["Bersihkan chuck/collet dari geram", "Periksa keausan rahang pencekam"],
  },
  {
    partName: "Axis (Sumbu)",
    checklistItems: ["Periksa backlash pada sumbu (axis)", "Sesuaikan bila diperlukan"],
  },
  {
    partName: "Baut Dudukan & Sambungan Mekanis",
    checklistItems: ["Periksa kekencangan baut-baut dudukan", "Periksa sambungan mekanis"],
  },
  {
    partName: "Kabel & Panel Kontrol",
    checklistItems: ["Periksa kondisi kabel kelistrikan", "Periksa panel kontrol"],
  },
];
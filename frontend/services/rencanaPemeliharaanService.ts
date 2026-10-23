// services/rencanaPemeliharaanService.ts
import api from "lib/api";
import {
  LogDiLuarRencana,
  MesinOption,
  RencanaFormValues,
  RencanaItem,
} from "types/RencanaPemeliharaanTypes";

const authHeaders = (withJson = false): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Backend bisa membalas array langsung atau { data: [...] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = (json: any): any[] =>
  Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

const toNumOrNull = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRencana = (r: any): RencanaItem => ({
  id: String(r.id),
  mesinId: String(r.mesin_id ?? r.mesin_produksi_id ?? ""),
  kodeMesin: r.kode_mesin ?? r.mesin?.kode_mesin ?? "-",
  namaMesin: r.nama_mesin ?? r.mesin?.nama_mesin ?? "-",
  tahun: Number(r.tahun),
  bulan: Number(r.bulan),
  minggu: Number(r.minggu),
  aksi: r.aksi,
  status: String(r.status ?? "").toLowerCase() === "selesai" ? "Selesai" : "Rencana",
  rab: Number(r.rab ?? 0),
  keterangan: r.keterangan ?? "",
  logId: r.log_id != null ? String(r.log_id) : null,
  tanggalSelesai: r.tanggal_selesai ?? null,
  tahunRealisasi: toNumOrNull(r.tahun_realisasi),
  bulanRealisasi: toNumOrNull(r.bulan_realisasi),
  mingguRealisasi: toNumOrNull(r.minggu_realisasi),
  jenis_pelaksana: r.jenis_pelaksana === "Vendor" ? "Vendor" : "Internal",
  nama_vendor: r.nama_vendor ?? null,
  no_po: r.no_po ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapLogDiLuar = (l: any): LogDiLuarRencana => ({
  id: String(l.id),
  mesinId: String(l.mesin_id ?? l.mesin_produksi_id ?? ""),
  aksi: l.aksi ?? null,
  uraian: l.uraian_pemeliharaan ?? "",
  tanggal: l.tanggal ?? "",
  tahun: Number(l.tahun),
  bulan: Number(l.bulan),
  minggu: Number(l.minggu),
});

const toPayload = (v: RencanaFormValues) => ({
  mesin_id: v.mesinId,
  tahun: v.tahun,
  bulan: v.bulan,
  minggu: v.minggu,
  aksi: v.aksi,
  rab: v.rab,
  keterangan: v.keterangan,
  jenis_pelaksana: v.jenis_pelaksana ?? "Internal",
});

// GET /rencana-pemeliharaan?tahun=2026
export const fetchRencana = async (tahun: number): Promise<RencanaItem[]> => {
  const json = await api(`/rencana-pemeliharaan?tahun=${tahun}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return unwrap(json).map(mapRencana);
};

// GET /rencana-pemeliharaan?tahun=2026
// Sama seperti fetchRencana, tapi juga membawa log pemeliharaan yang tidak terhubung
// ke plotting (di_luar_rencana) untuk baris Realisasi. Satu request saja.
export const fetchRencanaLengkap = async (
  tahun: number
): Promise<{ rencana: RencanaItem[]; diLuarRencana: LogDiLuarRencana[] }> => {
  const json = await api<{ data?: unknown[]; di_luar_rencana?: unknown[] }>(
    `/rencana-pemeliharaan?tahun=${tahun}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  const diLuar = Array.isArray(json?.di_luar_rencana) ? json.di_luar_rencana : [];
  return {
    rencana: unwrap(json).map(mapRencana),
    diLuarRencana: diLuar.map(mapLogDiLuar),
  };
};

// GET /rencana-pemeliharaan?mesin_id=1&status=belum
// Rencana satu mesin yang belum dikerjakan (untuk halaman detail pemeliharaan).
export const fetchRencanaMesin = async (mesinId: string | number): Promise<RencanaItem[]> => {
  const json = await api(`/rencana-pemeliharaan?mesin_id=${mesinId}&status=belum`, {
    method: "GET",
    headers: authHeaders(),
  });
  return unwrap(json).map(mapRencana);
};

// GET /mesin-produksi (endpoint yang sudah dipakai DataMesinManager)
export const fetchMesinOptions = async (): Promise<MesinOption[]> => {
  const json = await api("/mesin-produksi", {
    method: "GET",
    headers: authHeaders(),
  });
  // Mesin nonaktif tidak bisa dibuatkan rencana baru
  return unwrap(json).filter((m) => m.status !== "Tidak Aktif").map((m) => ({
    id: String(m.id),
    kodeMesin: m.kode_mesin ?? m.kodeMesin ?? "-",
    namaMesin: m.nama_mesin ?? m.namaMesin ?? "-",
  }));
};

// POST /rencana-pemeliharaan
export const createRencana = async (values: RencanaFormValues) =>
  api("/rencana-pemeliharaan", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(toPayload(values)),
  });

// PUT /rencana-pemeliharaan/{id}
export const updateRencana = async (id: string, values: RencanaFormValues) =>
  api(`/rencana-pemeliharaan/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(toPayload(values)),
  });

// DELETE /rencana-pemeliharaan/{id}
export const deleteRencana = async (id: string) =>
  api(`/rencana-pemeliharaan/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
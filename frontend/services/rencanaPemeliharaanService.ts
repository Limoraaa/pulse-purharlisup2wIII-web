// services/rencanaPemeliharaanService.ts
import api from "lib/api";
import {
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
});

const toPayload = (v: RencanaFormValues) => ({
  mesin_id: v.mesinId,
  tahun: v.tahun,
  bulan: v.bulan,
  minggu: v.minggu,
  aksi: v.aksi,
  rab: v.rab,
  keterangan: v.keterangan,
});

// GET /rencana-pemeliharaan?tahun=2026
export const fetchRencana = async (tahun: number): Promise<RencanaItem[]> => {
  const json = await api(`/rencana-pemeliharaan?tahun=${tahun}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return unwrap(json).map(mapRencana);
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
  return unwrap(json).map((m) => ({
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
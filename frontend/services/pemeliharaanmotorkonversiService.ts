import api from "lib/api";

// Tipe data untuk Motor Konversi
export interface MotorKonversiItemType {
  id: number | string;
  kode_motor: string;
  nama_motor: string;
  nomor_polisi: string;
  status: 'Aktif' | 'Maintenance' | 'Rusak';
}

// Tipe data untuk Log Pemeliharaan / Kartu Gantung Motor Konversi
export interface LogPemeliharaanMotorType {
  id: number | string;
  motor_konversi_id: number | string;
  uraian_pemeliharaan: string;
  waktu_pelaksana: string;
  keterangan?: string;
  paraf: string;
}

// 1. Mengambil semua data motor konversi
export async function getMotorKonversi(): Promise<MotorKonversiItemType[]> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: MotorKonversiItemType[] } | MotorKonversiItemType[]>("/motor-konversi", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res) ? res : res.data || [];
}

// 2. Menambah data motor konversi baru
export async function createMotorKonversi(data: Omit<MotorKonversiItemType, 'id'>): Promise<MotorKonversiItemType> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: MotorKonversiItemType } | MotorKonversiItemType>("/motor-konversi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return (res as any).data || res;
}

// 3. Mengambil riwayat log pemeliharaan berdasarkan ID Motor Konversi
export async function getLogPemeliharaanByMotor(motorId: number | string): Promise<LogPemeliharaanMotorType[]> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: LogPemeliharaanMotorType[] } | LogPemeliharaanMotorType[]>(
    `/log-pemeliharaan/motor/${motorId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return Array.isArray(res) ? res : res.data || [];
}

// 4. Menambah catatan log pemeliharaan / kartu gantung baru untuk motor konversi
export async function createLogPemeliharaanMotor(data: {
  motor_konversi_id: number | string;
  uraian_pemeliharaan: string;
  waktu_pelaksana: string;
  keterangan?: string;
  paraf: string;
}): Promise<LogPemeliharaanMotorType> {
  const token = localStorage.getItem("token");
  const res = await api<{ data: LogPemeliharaanMotorType } | LogPemeliharaanMotorType>("/log-pemeliharaan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return (res as any).data || res;
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogPemeliharaanMotorKonversi;
use App\Models\MotorKonversi;
use Illuminate\Http\Request;

class LogPemeliharaanMotorKonversiController extends Controller
{
    // Mengambil SEMUA log pemeliharaan dari semua motor konversi
    public function index()
    {
        $logs = LogPemeliharaanMotorKonversi::orderBy('waktu_pelaksana', 'desc')->get()->map(function ($item) {
            $motor = MotorKonversi::find($item->motor_konversi_id);
            return [
                'id' => $item->id,
                'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
                'nama_motor' => $motor ? $motor->nama_motor : '-',
                'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
                'waktu_pelaksana' => $item->waktu_pelaksana,
                'keterangan' => $item->keterangan,
                'paraf' => $item->paraf,
            ];
        });

        return response()->json(['data' => $logs], 200);
    }

    // Method untuk statistik dashboard pemeliharaan terpisah
    public function getDashboardStats()
    {
        try {
            $totalMotor = MotorKonversi::count();
            $totalLogPemeliharaan = LogPemeliharaanMotorKonversi::count();

            // Mengambil 5 aktivitas pemeliharaan terbaru berdasarkan waktu pelaksana
            $aktivitasTerbaru = LogPemeliharaanMotorKonversi::orderBy('waktu_pelaksana', 'desc')
                ->take(5)
                ->get()
                ->map(function ($item) {
                    // Cari data motor konversi secara manual berdasarkan foreign key untuk mencegah error relasi
                    $motor = MotorKonversi::find($item->motor_konversi_id);

                    return [
                        'id' => $item->id,
                        'nama_motor' => $motor ? $motor->nama_motor : 'Motor #' . $item->motor_konversi_id,
                        'deskripsi' => $item->uraian_pemeliharaan,
                        'tanggal' => $item->waktu_pelaksana,
                        'status' => 'Selesai / Tercatat',
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_motor' => $totalMotor,
                    'motor_perbaikan' => $totalLogPemeliharaan,
                    'pemeliharaan_rutin' => $totalLogPemeliharaan,
                    'aktivitas_terbaru' => $aktivitasTerbaru,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Mengambil log berdasarkan ID Motor Konversi (Untuk Tab Log Pemeliharaan di Frontend)
    public function getByMotor($motor_id)
    {
        $logs = LogPemeliharaanMotorKonversi::where('motor_konversi_id', $motor_id)
                ->orderBy('waktu_pelaksana', 'desc')
                ->get();

        return response()->json(['message' => 'Sukses', 'data' => $logs], 200);
    }

    // Tambah log pemeliharaan baru dari kartu gantung digital
    public function store(Request $request)
    {
        $request->validate([
            'motor_konversi_id' => 'required|exists:motor_konversi,id',
            'uraian_pemeliharaan' => 'required|string',
            'waktu_pelaksana' => 'required|date',
            'keterangan' => 'nullable|string',
            'paraf' => 'required|string', // Diisi nama user login/teknisi
        ]);

        $log = LogPemeliharaanMotorKonversi::create([
            'motor_konversi_id' => $request->motor_konversi_id,
            'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
            'waktu_pelaksana' => $request->waktu_pelaksana,
            'keterangan' => $request->keterangan ?? '',
            'paraf' => $request->paraf,
        ]);

        return response()->json(['message' => 'Log pemeliharaan berhasil dicatat', 'data' => $log], 201);
    }

    // Memperbarui log pemeliharaan berdasarkan ID (Untuk Fitur Edit)
    public function update(Request $request, $id)
    {
        $log = LogPemeliharaanMotorKonversi::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        $request->validate([
            'uraian_pemeliharaan' => 'required|string',
            'waktu_pelaksana' => 'required|date',
            'keterangan' => 'nullable|string',
            'paraf' => 'required|string',
        ]);

        $log->update([
            'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
            'waktu_pelaksana' => $request->waktu_pelaksana,
            'keterangan' => $request->keterangan ?? '',
            'paraf' => $request->paraf,
        ]);

        return response()->json(['message' => 'Log pemeliharaan berhasil diperbarui', 'data' => $log], 200);
    }

    // Menghapus log pemeliharaan berdasarkan ID (Untuk Fitur Hapus)
    public function destroy($id)
    {
        $log = LogPemeliharaanMotorKonversi::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        $log->delete();

        return response()->json(['message' => 'Log pemeliharaan berhasil dihapus'], 200);
    }
}
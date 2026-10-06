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
                'motor_konversi_id' => $item->motor_konversi_id,
                'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
                'nama_motor' => $motor ? $motor->nama_motor : '-',
                'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
                'waktu_pelaksana' => $item->waktu_pelaksana,
                'keterangan' => $item->keterangan,
                'paraf' => $item->paraf,
                // Tambahan field untuk Checklist Visual & Peta Part
                'status' => $item->status,
                'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
                'jumlah_part_total' => $item->jumlah_part_total,
            ];
        });

        return response()->json(['data' => $logs], 200);
    }

    public function show($id)
    {
        // Cari log berdasarkan id
        $item = LogPemeliharaanMotorKonversi::find($id);

        if (!$item) {
            return response()->json([
                'message' => 'Data log pemeliharaan motor konversi tidak ditemukan'
            ], 404);
        }

        $motor = MotorKonversi::find($item->motor_konversi_id);

        $logFormatted = [
            'id' => $item->id,
            'motor_konversi_id' => $item->motor_konversi_id,
            'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
            'nama_motor' => $motor ? $motor->nama_motor : '-',
            'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
            'waktu_pelaksana' => $item->waktu_pelaksana,
            'keterangan' => $item->keterangan,
            'paraf' => $item->paraf,
            // Tambahan field untuk Checklist Visual
            'status' => $item->status,
            'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
            'jumlah_part_total' => $item->jumlah_part_total,
        ];

        return response()->json([
            'success' => true,
            'data' => $logFormatted
        ], 200);
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
                    $motor = MotorKonversi::find($item->motor_konversi_id);

                    return [
                        'id' => $item->id,
                        'nama_motor' => $motor ? $motor->nama_motor : 'Motor #' . $item->motor_konversi_id,
                        'deskripsi' => $item->uraian_pemeliharaan,
                        'tanggal' => $item->waktu_pelaksana,
                        'status' => $item->status,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_motor' => $totalMotor,
                    'motor_perbaikan' => $totalLogPemeliharaan, // Bisa disesuaikan logikanya nanti
                    'pemeliharaan_rutin' => $totalLogPemeliharaan,
                    'aktivitas_terbaru' => $aktivitasTerbaru,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }

    // Mengambil log berdasarkan ID Motor Konversi (Untuk Tab Log Pemeliharaan di Frontend)
    public function getByMotor($motor_id)
    {
        try {
            $logs = LogPemeliharaanMotorKonversi::where('motor_konversi_id', $motor_id)
                ->orderBy('waktu_pelaksana', 'desc')
                ->get()
                ->map(function ($item) {
                    $motor = MotorKonversi::find($item->motor_konversi_id);
                    return [
                        'id' => $item->id,
                        'motor_konversi_id' => $item->motor_konversi_id,
                        'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
                        'nama_motor' => $motor ? $motor->nama_motor : '-',
                        'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
                        'waktu_pelaksana' => $item->waktu_pelaksana,
                        'keterangan' => $item->keterangan,
                        'paraf' => $item->paraf,
                        // Field wajib untuk Checklist Visual
                        'status' => $item->status,
                        'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
                        'jumlah_part_total' => $item->jumlah_part_total,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Sukses mengambil log',
                'data' => $logs
            ], 200);

        } catch (\Exception $e) {
            // Menghindari CORS Error dengan mengembalikan JSON Error 500
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memuat log: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    // Tambah log pemeliharaan baru dari form manual atau Checklist Visual
    public function store(Request $request)
    {
        $request->validate([
            'motor_konversi_id' => 'required|exists:motor_konversi,id',
            'uraian_pemeliharaan' => 'required|string',
            'waktu_pelaksana' => 'required|date',
            'keterangan' => 'nullable|string',
            'paraf' => 'required|string',
            // Validasi tambahan untuk fitur Checklist Visual
            'status' => 'nullable|string|in:baik,perlu_perhatian,rusak',
            'jumlah_part_diperiksa' => 'nullable|integer',
            'jumlah_part_total' => 'nullable|integer',
        ]);

        try {
            $log = LogPemeliharaanMotorKonversi::create([
                'motor_konversi_id' => $request->motor_konversi_id,
                'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
                'waktu_pelaksana' => $request->waktu_pelaksana,
                'keterangan' => $request->keterangan ?? '',
                'paraf' => $request->paraf,
                // Insert data tambahan
                'status' => $request->status,
                'jumlah_part_diperiksa' => $request->jumlah_part_diperiksa,
                'jumlah_part_total' => $request->jumlah_part_total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log pemeliharaan berhasil dicatat',
                'data' => $log
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan log: ' . $e->getMessage()
            ], 500);
        }
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
            // Validasi tambahan untuk fitur Checklist Visual
            'status' => 'nullable|string|in:baik,perlu_perhatian,rusak',
            'jumlah_part_diperiksa' => 'nullable|integer',
            'jumlah_part_total' => 'nullable|integer',
        ]);

        try {
            $log->update([
                'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
                'waktu_pelaksana' => $request->waktu_pelaksana,
                'keterangan' => $request->keterangan ?? '',
                'paraf' => $request->paraf,
                // Update data tambahan
                'status' => $request->status,
                'jumlah_part_diperiksa' => $request->jumlah_part_diperiksa,
                'jumlah_part_total' => $request->jumlah_part_total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log pemeliharaan berhasil diperbarui',
                'data' => $log
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui log: ' . $e->getMessage()
            ], 500);
        }
    }

    // Menghapus log pemeliharaan berdasarkan ID (Untuk Fitur Hapus)
    public function destroy($id)
    {
        $log = LogPemeliharaanMotorKonversi::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        try {
            $log->delete();

            return response()->json([
                'success' => true,
                'message' => 'Log pemeliharaan berhasil dihapus'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus log: ' . $e->getMessage()
            ], 500);
        }
    }
}

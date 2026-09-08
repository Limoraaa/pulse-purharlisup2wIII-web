<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogPemeliharaanMesin;
use App\Models\MesinProduksi;
use Illuminate\Http\Request;

class LogPemeliharaanMesinController extends Controller
{
    // Method untuk statistik dashboard pemeliharaan terpisah
    public function getDashboardStats()
    {
        try {
            $totalMesin = MesinProduksi::count();
            $totalLogPemeliharaan = LogPemeliharaanMesin::count();
            
            // Mengambil 5 aktivitas pemeliharaan terbaru berdasarkan waktu pelaksana
            $aktivitasTerbaru = LogPemeliharaanMesin::orderBy('waktu_pelaksana', 'desc')
                ->take(5)
                ->get()
                ->map(function ($item) {
                    // Cari data mesin secara manual berdasarkan foreign key untuk mencegah error relasi
                    $mesin = MesinProduksi::find($item->mesin_produksi_id);

                    return [
                        'id' => $item->id,
                        'nama_mesin' => $mesin ? $mesin->nama_mesin : 'Mesin #' . $item->mesin_produksi_id,
                        'deskripsi' => $item->uraian_pemeliharaan,
                        'tanggal' => $item->waktu_pelaksana,
                        'status' => 'Selesai / Tercatat', // Sesuaikan jika ada kolom status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_mesin' => $totalMesin,
                    'mesin_perbaikan' => $totalLogPemeliharaan, // Bisa disesuaikan dengan filter status perbaikan
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

    // Mengambil log berdasarkan ID Mesin (Untuk Tab Log Pemeliharaan di Frontend)
    public function getByMesin($mesin_id)
    {
        $logs = LogPemeliharaanMesin::where('mesin_produksi_id', $mesin_id)
                ->orderBy('waktu_pelaksana', 'desc')
                ->get();
                
        return response()->json(['message' => 'Sukses', 'data' => $logs], 200);
    }

    // Tambah log pemeliharaan baru dari kartu gantung digital
    public function store(Request $request)
    {
        $request->validate([
            'mesin_produksi_id' => 'required|exists:mesin_produksi,id',
            'uraian_pemeliharaan' => 'required|string',
            'waktu_pelaksana' => 'required|date',
            'paraf' => 'required|string', // Diisi nama user login/teknisi
        ]);

        $log = LogPemeliharaanMesin::create([
            'mesin_produksi_id' => $request->mesin_produksi_id,
            'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
            'waktu_pelaksana' => $request->waktu_pelaksana,
            'keterangan' => $request->keterangan,
            'paraf' => $request->paraf,
        ]);

        return response()->json(['message' => 'Log pemeliharaan berhasil dicatat', 'data' => $log], 201);
    }
}
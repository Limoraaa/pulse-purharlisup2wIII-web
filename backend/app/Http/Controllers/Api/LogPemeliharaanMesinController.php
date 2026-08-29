<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogPemeliharaanMesin;
use Illuminate\Http\Request;

class LogPemeliharaanMesinController extends Controller
{
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
            // Perbaikan: ganti mesin_produksis menjadi mesin_produksi
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
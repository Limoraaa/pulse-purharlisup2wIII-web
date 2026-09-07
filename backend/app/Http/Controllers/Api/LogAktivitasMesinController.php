<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitasMesin;
use Illuminate\Http\Request;

class LogAktivitasMesinController extends Controller
{
    // Mengambil semua log aktivitas atau berdasarkan mesin_id
    public function index(Request $request)
    {
        $query = LogAktivitasMesin::with('mesin');
        if ($request->has('mesin_id')) {
            $query->where('mesin_produksi_id', $request->mesin_id);
        }
        return response()->json($query->latest()->get());
    }

    public function getByMesin($mesin_id)
    {
        $logs = LogAktivitasMesin::where('mesin_produksi_id', $mesin_id)->latest()->get();
        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_produksi_id' => 'required|exists:mesin_produksi,id',
            'operator_pelaksana' => 'required|string|max:255',
            'uraian_pekerjaan' => 'required|string',
            'tanggal' => 'required|date',
            'waktu_mulai' => 'required',
            'waktu_selesai' => 'required',
            'jumlah' => 'required|integer',
            'pemeriksa' => 'required|string|max:255',
        ]);

        $log = LogAktivitasMesin::create($validated);

        return response()->json([
            'message' => 'Log aktivitas berhasil dicatat',
            'data' => $log
        ], 201);
    }
}
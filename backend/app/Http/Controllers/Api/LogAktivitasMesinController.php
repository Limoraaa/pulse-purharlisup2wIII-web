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

    // Memperbarui log aktivitas berdasarkan ID (Untuk Fitur Edit)
    public function update(Request $request, $id)
    {
        $log = LogAktivitasMesin::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log aktivitas tidak ditemukan'], 404);
        }

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

        $log->update($validated);

        return response()->json([
            'message' => 'Log aktivitas berhasil diperbarui',
            'data' => $log
        ], 200);
    }

    // Menghapus log aktivitas berdasarkan ID (Untuk Fitur Hapus)
    public function destroy($id)
    {
        $log = LogAktivitasMesin::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log aktivitas tidak ditemukan'], 404);
        }

        $log->delete();

        return response()->json([
            'message' => 'Log aktivitas berhasil dihapus'
        ], 200);
    }
}
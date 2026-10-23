<?php

namespace App\Http\Controllers\Api;

use App\Rules\MesinAktif;
use App\Http\Controllers\Controller;
use App\Models\LogAktivitasMesin;
use Illuminate\Http\Request;

class LogAktivitasMesinController extends Controller
{
    private const PESAN = [
        'waktu_mulai.date_format' => 'Format jam mulai harus JJ:MM, mis. 08:00.',
        'waktu_selesai.date_format' => 'Format jam selesai harus JJ:MM, mis. 16:30.',
        'jumlah.min' => 'Jumlah tidak boleh negatif.',
    ];

    // Mengambil semua log aktivitas atau berdasarkan mesin_id
    public function index(Request $request)
    {
        // Menarik relasi mesin untuk kebutuhan tabel global
        $query = LogAktivitasMesin::with('mesinProduksi');
        
        if ($request->has('mesin_id')) {
            $query->where('mesin_produksi_id', $request->mesin_id);
        }
        
        // Dibungkus menggunakan key 'data' agar konsisten dengan standar frontend
        return response()->json([
            'data' => $query->latest()->get()
        ]);
    }

    public function getByMesin($mesin_id)
    {
        $logs = LogAktivitasMesin::where('mesin_produksi_id', $mesin_id)->latest()->get();
        
        // Dibungkus menggunakan key 'data'
        return response()->json([
            'data' => $logs
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_produksi_id' => ['required', new MesinAktif()],
            'operator_pelaksana' => 'required|string|max:255',
            'uraian_pekerjaan' => 'required|string',
            'tanggal' => 'required|date',
            'waktu_mulai' => 'required|date_format:H:i,H:i:s',
            'waktu_selesai' => 'required|date_format:H:i,H:i:s',
            'jumlah' => 'required|integer|min:0',
            'pemeriksa' => 'required|string|max:255',
        ], self::PESAN);

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
            'waktu_mulai' => 'required|date_format:H:i,H:i:s',
            'waktu_selesai' => 'required|date_format:H:i,H:i:s',
            'jumlah' => 'required|integer|min:0',
            'pemeriksa' => 'required|string|max:255',
        ], self::PESAN);

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
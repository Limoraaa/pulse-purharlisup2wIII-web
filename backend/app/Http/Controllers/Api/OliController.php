<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogPemeliharaanMesin;
use App\Models\MesinProduksi;
use App\Models\Oli;
use Illuminate\Http\Request;

class OliController extends Controller
{
    public function index()
    {
        $olis = Oli::orderBy('nama_oli', 'asc')->get();
        return response()->json(['data' => $olis], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_oli'      => 'required|string|unique:olis,kode_oli',
            'nama_oli'      => 'required|string|max:255',
            'stok'          => 'required|numeric|min:0',
            'satuan'        => 'required|string|max:50',
            'batas_minimum' => 'required|numeric|min:0',
        ]);

        $oli = Oli::create($validated);

        return response()->json(['message' => 'Data oli berhasil ditambahkan', 'data' => $oli], 201);
    }

    public function update(Request $request, $id)
    {
        $oli = Oli::findOrFail($id);

        $validated = $request->validate([
            'kode_oli'      => 'required|string|unique:olis,kode_oli,' . $id,
            'nama_oli'      => 'required|string|max:255',
            'stok'          => 'required|numeric|min:0',
            'satuan'        => 'required|string|max:50',
            'batas_minimum' => 'required|numeric|min:0',
        ]);

        $oli->update($validated);

        return response()->json(['message' => 'Data oli berhasil diperbarui', 'data' => $oli], 200);
    }

    // GET /olis/{id}/riwayat — oli ini dipakai di mesin mana saja dan kapan (terbaru dulu)
    public function riwayat($id)
    {
        $oli = Oli::findOrFail($id);

        $data = LogPemeliharaanMesin::with('mesinProduksi:id,kode_mesin,nama_mesin')
            ->where('oli_id', $oli->id)
            ->orderBy('waktu_pelaksana', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'tanggal' => $log->waktu_pelaksana,
                'mesin_id' => $log->mesin_produksi_id,
                'kode_mesin' => $log->mesinProduksi?->kode_mesin,
                'nama_mesin' => $log->mesinProduksi?->nama_mesin,
                'tindakan' => $log->tindakan_oli,
                'jumlah' => $log->jumlah_oli,
                'paraf' => $log->paraf,
            ]);

        return response()->json(['data' => $data, 'oli' => $oli], 200);
    }

    public function destroy($id)
    {
        $oli = Oli::findOrFail($id);

        // Oli yang sudah punya riwayat pemakaian / jadi oli standar mesin tidak dihapus,
        // agar riwayat pemeliharaan tetap menunjukkan oli yang dipakai
        if (LogPemeliharaanMesin::where('oli_id', $oli->id)->exists() || MesinProduksi::where('oli_id', $oli->id)->exists()) {
            return response()->json([
                'message' => 'Oli ini sudah dipakai di riwayat pemeliharaan atau menjadi oli standar mesin, sehingga tidak dapat dihapus.',
            ], 422);
        }

        $oli->delete();

        return response()->json(['message' => 'Data oli berhasil dihapus'], 200);
    }
}
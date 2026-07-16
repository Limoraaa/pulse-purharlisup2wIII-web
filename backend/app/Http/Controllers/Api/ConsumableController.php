<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consumable;
use Illuminate\Http\Request;

class ConsumableController extends Controller
{
    /**
     * GET /api/consumables
     * Tampilkan semua data consumable, plus stok akhir (computed).
     */
   public function index()
{
    $consumables = Consumable::orderBy('kode_barang')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'kode_barang' => $item->kode_barang,
                'nama' => $item->nama,
                'merk' => $item->merk,
                'er_e' => $item->er_e,
                'type' => $item->type,
                'ukuran' => $item->ukuran,
                'stok_awal' => $item->stok_awal,
                'stok_akhir' => $item->stok_awal,
            ];
        });

        return response()->json($consumables);
    }

    /**
     * POST /api/consumables
     * Tambah data consumable baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang' => 'required|string|unique:consumables,kode_barang',
            'nama' => 'required|string',
            'merk' => 'nullable|string',
            'er_e' => 'nullable|string',
            'type' => 'nullable|string',
            'ukuran' => 'nullable|string',
            'stok_awal' => 'required|integer|min:0',
        ]);

        $consumable = Consumable::create($validated);

        return response()->json($consumable, 201);
    }

    /**
     * GET /api/consumables/{id}
     * Tampilkan detail satu consumable, termasuk riwayat masuk & keluar.
     */
    public function show(Consumable $consumable)
    {
        $consumable->load(['masuk', 'keluar.peminta']);

        return response()->json([
            'id' => $consumable->id,
            'kode_barang' => $consumable->kode_barang,
            'nama' => $consumable->nama,
            'merk' => $consumable->merk,
            'er_e' => $consumable->er_e,
            'type' => $consumable->type,
            'ukuran' => $consumable->ukuran,
            'stok_awal' => $consumable->stok_awal,
            'stok_akhir' => $consumable->stok_awal,
            'riwayat_masuk' => $consumable->masuk,
            'riwayat_keluar' => $consumable->keluar,
        ]);
    }

    /**
     * PUT/PATCH /api/consumables/{id}
     * Edit data consumable.
     */
    public function update(Request $request, Consumable $consumable)
    {
        $validated = $request->validate([
            'kode_barang' => 'sometimes|string|unique:consumables,kode_barang,' . $consumable->id,
            'nama' => 'sometimes|string',
            'merk' => 'nullable|string',
            'er_e' => 'nullable|string',
            'type' => 'nullable|string',
            'ukuran' => 'nullable|string',
            'stok_awal' => 'sometimes|integer|min:0',
        ]);

        $consumable->update($validated);

        return response()->json($consumable);
    }

    /**
     * DELETE /api/consumables/{id}
     * Hapus data consumable.
     */
    public function destroy(Consumable $consumable)
    {
        $consumable->delete();

        return response()->json(['message' => 'Data consumable berhasil dihapus']);
    }
}

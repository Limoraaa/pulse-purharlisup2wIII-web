<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ToolController extends Controller
{
    /**
     * GET /api/tools
     * Tampilkan semua data alat, plus info stok tersedia (computed).
     */
    public function index()
    {
       $tools = Tool::active()->orderBy('kode_barang')->get()->map(function ($tool) {
            return [
                'id' => $tool->id,
                'kode_barang' => $tool->kode_barang,
                'nama_barang' => $tool->nama_barang,
                'merk' => $tool->merk,
                'type' => $tool->type,
                'warna' => $tool->warna,
                'ukuran' => $tool->ukuran,
                'stok' => $tool->stok,
                'keadaan' => $tool->keadaan,
                'kategori' => $tool->kategori,
                'sedang_dipinjam' => $tool->sedangDipinjam(),
                'tersedia' => $tool->tersedia(),
            ];
        });

        return response()->json($tools);
    }

    /**
     * POST /api/tools
     * Tambah data alat baru.
     */
                public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang' => [
                'required',
                'string',
                Rule::unique('tools', 'kode_barang')->where('is_active', true),
            ],
            'nama_barang' => 'required|string',
            'merk' => 'nullable|string',
            'type' => 'nullable|string',
            'warna' => 'nullable|string',
            'ukuran' => 'nullable|string',
            'stok' => 'required|integer|min:0',
            'keadaan' => 'nullable|in:B,R',
            'kategori' => 'nullable|in:mesin,alat_biasa,perkakas_mesin',
        ]);

                if (($validated['kategori'] ?? 'alat_biasa') === 'mesin' && ($validated['stok'] ?? 0) > 1) {
            return response()->json([
                'message' => 'Alat berkategori Mesin harus dicatat 1 kode = 1 unit fisik (Stok maksimal 1).',
            ], 422);
        }

        $tool = Tool::create($validated);

        return response()->json([
            'id' => $tool->id,
            'kode_barang' => $tool->kode_barang,
            'nama_barang' => $tool->nama_barang,
            'merk' => $tool->merk,
            'type' => $tool->type,
            'warna' => $tool->warna,
            'ukuran' => $tool->ukuran,
            'stok' => $tool->stok,
            'keadaan' => $tool->keadaan,
            'kategori' => $tool->kategori,
            'sedang_dipinjam' => $tool->sedangDipinjam(),
            'tersedia' => $tool->tersedia(),
        ], 201);
    }
    /**
     * GET /api/tools/{id}
     * Tampilkan detail satu alat, termasuk riwayat peminjamannya.
     */
    public function show(Tool $tool)
    {
        $tool->load('peminjaman.peminta');

        return response()->json([
            'id' => $tool->id,
            'kode_barang' => $tool->kode_barang,
            'nama_barang' => $tool->nama_barang,
            'merk' => $tool->merk,
            'type' => $tool->type,
            'warna' => $tool->warna,
            'ukuran' => $tool->ukuran,
            'stok' => $tool->stok,
            'keadaan' => $tool->keadaan,
            'sedang_dipinjam' => $tool->sedangDipinjam(),
            'tersedia' => $tool->tersedia(),
            'riwayat_peminjaman' => $tool->peminjaman,
        ]);
    }

    /**
     * PUT/PATCH /api/tools/{id}
     * Edit data alat.
     */
    public function update(Request $request, Tool $tool)
        {
            $validated = $request->validate([
                'kode_barang' => [
                    'sometimes',
                    'string',
                    Rule::unique('tools', 'kode_barang')
                        ->where('is_active', true)
                        ->ignore($tool->id),
                ],
                'nama_barang' => 'sometimes|string',
                'merk' => 'nullable|string',
                'type' => 'nullable|string',
                'warna' => 'nullable|string',
                'ukuran' => 'nullable|string',
                'stok' => 'sometimes|integer|min:0',
                'keadaan' => 'nullable|in:B,R',
                'kategori' => 'nullable|in:mesin,alat_biasa,perkakas_mesin',
            ]);

                        $kategoriAkhir = $validated['kategori'] ?? $tool->kategori;
            $stokAkhir = $validated['stok'] ?? $tool->stok;

            if ($kategoriAkhir === 'mesin' && $stokAkhir > 1) {
                return response()->json([
                    'message' => 'Alat berkategori Mesin harus dicatat 1 kode = 1 unit fisik (Stok maksimal 1).',
                ], 422);
            }

            $tool->update($validated);

            return response()->json([
                'id' => $tool->id,
                'kode_barang' => $tool->kode_barang,
                'nama_barang' => $tool->nama_barang,
                'merk' => $tool->merk,
                'type' => $tool->type,
                'warna' => $tool->warna,
                'ukuran' => $tool->ukuran,
                'stok' => $tool->stok,
                'keadaan' => $tool->keadaan,
                'kategori' => $tool->kategori,
                'sedang_dipinjam' => $tool->sedangDipinjam(),
                'tersedia' => $tool->tersedia(),
            ]);
        }
    /**
     * DELETE /api/tools/{id}
     * Hapus data alat.
     */
    public function destroy(Tool $tool)
    {
        $tool->update(['is_active' => false]);

        return response()->json(['message' => 'Alat berhasil dihapus']);
    }
    public function kurangiStok(Request $request, Tool $tool)
    {
        $validated = $request->validate([
            'jumlah' => 'required|integer|min:1',
        ]);

        // jangan sampai stok jadi negatif
        if ($validated['jumlah'] > $tool->stok) {
            return response()->json([
                'message' => "Jumlah melebihi stok yang ada. Stok saat ini: {$tool->stok}",
            ], 422);
        }

        $tool->decrement('stok', $validated['jumlah']);

        return response()->json([
            'message' => 'Stok berhasil dikurangi',
            'stok_baru' => $tool->fresh()->stok,
        ]);
    }
}

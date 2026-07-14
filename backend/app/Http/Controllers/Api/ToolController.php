<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;

class ToolController extends Controller
{
    /**
     * GET /api/tools
     * Tampilkan semua data alat, plus info stok tersedia (computed).
     */
    public function index()
    {
        $tools = Tool::orderBy('kode_barang')->get()->map(function ($tool) {
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
            'kode_barang' => 'required|string|unique:tools,kode_barang',
            'nama_barang' => 'required|string',
            'merk' => 'nullable|string',
            'type' => 'nullable|string',
            'warna' => 'nullable|string',
            'ukuran' => 'nullable|string',
            'stok' => 'required|integer|min:0',
            'keadaan' => 'nullable|in:B,R',
        ]);

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
                'kode_barang' => 'sometimes|string|unique:tools,kode_barang,' . $tool->id,
                'nama_barang' => 'sometimes|string',
                'merk' => 'nullable|string',
                'type' => 'nullable|string',
                'warna' => 'nullable|string',
                'ukuran' => 'nullable|string',
                'stok' => 'sometimes|integer|min:0',
                'keadaan' => 'nullable|in:B,R',
            ]);

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
        $tool->delete();

        return response()->json(['message' => 'Alat berhasil dihapus']);
    }
}

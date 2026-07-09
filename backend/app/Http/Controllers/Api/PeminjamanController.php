<?php

namespace App\Http\Controllers;

use App\Models\Peminjaman;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class PeminjamanController extends Controller
{
    // GET /api/peminjaman
    public function index()
    {
        $peminjaman = Peminjaman::with(['tool', 'peminta', 'dicatatOleh'])
            ->orderBy('tanggal', 'desc')
            ->get();

        return response()->json($peminjaman);
    }

    // GET /api/peminjaman/{id}
    public function show(string $id)
    {
        $peminjaman = Peminjaman::with(['tool', 'peminta', 'dicatatOleh'])->find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Peminjaman tidak ditemukan'], 404);
        }

        return response()->json($peminjaman);
    }

    // POST /api/peminjaman
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'tool_id' => 'required|uuid|exists:tools,id',
            'peminta_id' => 'required|uuid|exists:peminta,id',
            'jumlah' => 'required|integer|min:1',
            'area_pekerjaan' => 'required|string|max:255',
            'spesifikasi' => 'nullable|string',
            'keterangan' => 'nullable|string',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // id di-generate otomatis lewat boot() di model Peminjaman
        $peminjaman = Peminjaman::create($validator->validated());

        return response()->json($peminjaman->load(['tool', 'peminta']), 201);
    }

    // PUT/PATCH /api/peminjaman/{id}
    public function update(Request $request, string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Peminjaman tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'tool_id' => 'sometimes|required|uuid|exists:tools,id',
            'peminta_id' => 'sometimes|required|uuid|exists:peminta,id',
            'jumlah' => 'sometimes|required|integer|min:1',
            'area_pekerjaan' => 'sometimes|required|string|max:255',
            'spesifikasi' => 'nullable|string',
            'keterangan' => 'nullable|string',
            'dicatat_oleh' => 'sometimes|required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminjaman->update($validator->validated());

        return response()->json($peminjaman);
    }

    // DELETE /api/peminjaman/{id}
    public function destroy(string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Peminjaman tidak ditemukan'], 404);
        }

        $peminjaman->delete();

        return response()->json(['message' => 'Peminjaman berhasil dihapus']);
    }

    // PATCH /api/peminjaman/{id}/kembali
    // Tandai peminjaman sebagai sudah dikembalikan (isi tanggal_kembali)
    public function kembali(Request $request, string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Peminjaman tidak ditemukan'], 404);
        }

        if ($peminjaman->sudahKembali()) {
            return response()->json(['message' => 'Peminjaman ini sudah ditandai dikembalikan'], 422);
        }

        $validator = Validator::make($request->all(), [
            'tanggal_kembali' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminjaman->tanggal_kembali = $request->input('tanggal_kembali', now()->toDateString());
        $peminjaman->save();

        return response()->json($peminjaman->load(['tool', 'peminta']));
    }
}

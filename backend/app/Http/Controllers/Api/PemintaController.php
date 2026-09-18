<?php

namespace App\Http\Controllers\API;

use App\Models\Peminta;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class PemintaController extends Controller
{
    // GET /api/peminta
    // GET /api/peminta?aktif=1  -> cuma yang aktif (dipakai buat dropdown pilih peminjam)
    public function index(Request $request)
    {
        $query = Peminta::orderBy('nama');

        if ($request->has('aktif')) {
            $query->where('aktif', $request->boolean('aktif'));
        }

        return response()->json($query->get());
    }

    // GET /api/peminta/{id}
    public function show(string $id)
    {
        $peminta = Peminta::find($id);

        if (! $peminta) {
            return response()->json(['message' => 'Peminta tidak ditemukan'], 404);
        }

        return response()->json($peminta);
    }

    // POST /api/peminta
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id'     => 'nullable|string|unique:peminta,id',
            'nama'   => 'required|string|max:255',
            'divisi' => 'required|string|max:255',
            // --- VALIDASI ROLE BARU (INVENTORY MAN) ---
            'role'   => 'nullable|string|in:user,inventory man', 
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        // Default role jika tidak diisi dari frontend adalah 'user'
        if (empty($data['role'])) {
            $data['role'] = 'user';
        }

        $peminta = Peminta::create($data);

        return response()->json($peminta, 201);
    }

    // PUT/PATCH /api/peminta/{id}
    public function update(Request $request, string $id)
    {
        $peminta = Peminta::find($id);

        if (! $peminta) {
            return response()->json(['message' => 'Peminta tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'id'     => 'nullable|string|unique:peminta,id,' . $id,
            'nama'   => 'sometimes|required|string|max:255',
            'divisi' => 'sometimes|required|string|max:255',
            // --- VALIDASI ROLE BARU (INVENTORY MAN) ---
            'role'   => 'sometimes|required|string|in:user,inventory man',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminta->update($validator->validated());

        return response()->json($peminta);
    }

    // DELETE /api/peminta/{id}
    public function destroy(string $id)
    {
        $peminta = Peminta::find($id);

        if (! $peminta) {
            return response()->json(['message' => 'Peminta tidak ditemukan'], 404);
        }

        $peminta->update(['aktif' => false]);

        return response()->json([
            'message' => 'Peminta berhasil dinonaktifkan. Riwayat transaksi lama tetap aman.',
            'data' => $peminta,
        ]);
    }

    // PATCH /api/peminta/{id}/aktifkan
    public function aktifkan(string $id)
    {
        $peminta = Peminta::find($id);

        if (! $peminta) {
            return response()->json(['message' => 'Peminta tidak ditemukan'], 404);
        }

        $peminta->update(['aktif' => true]);

        return response()->json([
            'message' => 'Peminta berhasil diaktifkan kembali.',
            'data' => $peminta,
        ]);
    }
}

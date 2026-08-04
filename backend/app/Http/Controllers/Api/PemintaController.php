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
            // Validasi diubah ke 'id', pastikan unik di tabel 'peminta'
            'id' => 'nullable|string|unique:peminta,id',
            'nama' => 'required|string|max:255',
            'divisi' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Karena di model Peminta sudah ada logika UUID otomatis jika id kosong,
        // kita bisa langsung create dari hasil validasi.
        $peminta = Peminta::create($validator->validated());

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
            // Validasi diubah ke 'id', dan abaikan pengecekan unique untuk data yang sedang diedit
            'id' => 'nullable|string|unique:peminta,id,' . $id,
            'nama' => 'sometimes|required|string|max:255',
            'divisi' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminta->update($validator->validated());

        return response()->json($peminta);
    }

    // DELETE /api/peminta/{id}
    // Sengaja TIDAK hapus permanen -- kalau peminta sudah punya riwayat
    // transaksi (peminjaman/consumable keluar), hapus paksa akan melanggar
    // foreign key. Jadi "hapus" di sini artinya nonaktifkan.
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

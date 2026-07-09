<?php

namespace App\Http\Controllers;

use App\Models\Peminta;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class PemintaController extends Controller
{
    // GET /api/peminta
    public function index()
    {
        return response()->json(Peminta::orderBy('nama')->get());
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
            'nama' => 'required|string|max:255',
            'kategori' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminta = Peminta::create([
            'id' => (string) Str::uuid(),
            ...$validator->validated(),
        ]);

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
            'nama' => 'sometimes|required|string|max:255',
            'kategori' => 'sometimes|required|string|max:255',
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

        $peminta->delete();

        return response()->json(['message' => 'Peminta berhasil dihapus']);
    }
}

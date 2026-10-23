<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

    public function destroy($id)
    {
        $oli = Oli::findOrFail($id);
        $oli->delete();

        return response()->json(['message' => 'Data oli berhasil dihapus'], 200);
    }
}
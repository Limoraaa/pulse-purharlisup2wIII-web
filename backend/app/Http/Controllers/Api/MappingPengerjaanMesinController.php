<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MappingPengerjaanMesin;
use Illuminate\Http\Request;

class MappingPengerjaanMesinController extends Controller
{
    public function index(Request $request)
    {
        $query = MappingPengerjaanMesin::query();

        if ($request->has('mesin_id')) {
            $query->where('mesin_id', $request->mesin_id);
        }

        return response()->json($query->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_id'        => 'required|exists:mesin_produksi,id',
            'nama_pekerjaan'  => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'keterangan'      => 'nullable|string',
        ]);

        $mapping = MappingPengerjaanMesin::create($validated);

        return response()->json([
            'message' => 'Mapping pengerjaan mesin berhasil disimpan',
            'data'    => $mapping
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $mapping = MappingPengerjaanMesin::findOrFail($id);

        $validated = $request->validate([
            'nama_pekerjaan'  => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'keterangan'      => 'nullable|string',
        ]);

        $mapping->update($validated);

        return response()->json([
            'message' => 'Mapping pengerjaan mesin berhasil diperbarui',
            'data'    => $mapping
        ], 200);
    }

    public function destroy($id)
    {
        $mapping = MappingPengerjaanMesin::findOrFail($id);
        $mapping->delete();

        return response()->json([
            'message' => 'Mapping pengerjaan mesin berhasil dihapus'
        ], 200);
    }
}
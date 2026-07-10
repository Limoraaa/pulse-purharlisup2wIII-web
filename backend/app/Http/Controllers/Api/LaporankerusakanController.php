<?php

namespace App\Http\Controllers\API;

use App\Models\LaporanKerusakanTools;
use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LaporanKerusakanController extends Controller
{
    // GET /api/laporan-kerusakan
    public function index()
    {
        return response()->json(
            LaporanKerusakanTools::with(['tool', 'dilaporkanOleh'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    // GET /api/laporan-kerusakan/{id}
    public function show(string $id)
    {
        $laporan = LaporanKerusakanTools::with(['tool', 'dilaporkanOleh'])->find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        return response()->json($laporan);
    }

    // POST /api/laporan-kerusakan
    // Sekalian mengubah tools.keadaan jadi 'R' (Rusak) begitu laporan dibuat
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'tool_id' => 'required|uuid|exists:tools,id',
            'keterangan' => 'required|string',
            'dilaporkan_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['id'] = (string) Str::uuid();

        $laporan = DB::transaction(function () use ($data) {
            $tool = Tool::lockForUpdate()->findOrFail($data['tool_id']);
            $tool->keadaan = 'R'; // Rusak
            $tool->save();

            return LaporanKerusakanTools::create($data);
        });

        return response()->json($laporan->load('tool'), 201);
    }

    // PUT/PATCH /api/laporan-kerusakan/{id}
    public function update(Request $request, string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'keterangan' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $laporan->update($validator->validated());

        return response()->json($laporan);
    }

    // DELETE /api/laporan-kerusakan/{id}
    // Catatan: sengaja TIDAK mengembalikan keadaan tool ke 'baik' otomatis,
    // karena hapus laporan != tool sudah diperbaiki. Perubahan status tool
    // setelah perbaikan sebaiknya lewat endpoint Tool tersendiri.
    public function destroy(string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $laporan->delete();

        return response()->json(['message' => 'Laporan berhasil dihapus']);
    }
}

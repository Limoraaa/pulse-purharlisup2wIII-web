<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LaporanKerusakanTools;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
        $data = LaporanKerusakanTools::with(['tool', 'dilaporkanOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/laporan-kerusakan
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'tool_id' => 'required|uuid|exists:tools,id',
            'keterangan' => 'nullable|string',
            'dilaporkan_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['id'] = (string) Str::uuid();

        $laporan = LaporanKerusakanTools::create($data);

        return response()->json($laporan->load('tool'), 201);
    }

    // PUT/PATCH /api/laporan-kerusakan/{id}
    public function update(Request $request, string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $laporan->update($validator->validated());

        return response()->json($laporan);
    }

    // DELETE /api/laporan-kerusakan/{id}
    public function destroy(string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        $laporan->delete();

        return response()->json(['message' => 'Data laporan kerusakan berhasil dihapus']);
    }
}

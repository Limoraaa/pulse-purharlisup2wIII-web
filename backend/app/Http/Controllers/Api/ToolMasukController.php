<?php

namespace App\Http\Controllers\API;

use App\Models\Tool;
use App\Models\ToolMasuk;
use App\Models\Peminta;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ToolMasukController extends Controller
{
    // GET /api/tools-masuk
    public function index()
    {
        return response()->json(
            ToolMasuk::with(['tool', 'dicatatOleh'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    // GET /api/tools-masuk/{id}
    public function show(string $id)
    {
        $data = ToolMasuk::with(['tool', 'dicatatOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data tools masuk tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/tools-masuk
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal'      => 'required|date',
            'tool_id'      => 'required|uuid|exists:tools,id',
            'jumlah_masuk' => 'required|integer|min:1',
            'keterangan'   => 'nullable|string',
            'peminta_id'   => 'required|string|exists:peminta,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $pemintaId = trim($data['peminta_id']);
        $peminta = Peminta::find($pemintaId);

        if (! $peminta) {
            return response()->json([
                'message' => "Akses ditolak: ID Card '{$pemintaId}' tidak terdaftar sebagai peminta yang sah."
            ], 403);
        }

        if ($peminta->role !== 'inventory man') {
            return response()->json([
                'message' => "Akses ditolak: Maaf {$peminta->nama}, Anda tidak memiliki otorisasi sebagai Inventory Man untuk menambah stok inventaris."
            ], 403);
        }

        $data['dicatat_oleh'] = $peminta->id;
        unset($data['peminta_id']);

        $data['id'] = (string) Str::uuid();

        $toolMasuk = DB::transaction(function () use ($data) {
            $tool = Tool::lockForUpdate()->findOrFail($data['tool_id']);
            $tool->stok += $data['jumlah_masuk'];
            $tool->save();

            return ToolMasuk::create($data);
        });

        return response()->json($toolMasuk->load(['tool', 'dicatatOleh']), 201);
    }

    // PUT/PATCH /api/tools-masuk/{id}
    public function update(Request $request, string $id)
    {
        $toolMasuk = ToolMasuk::find($id);

        if (! $toolMasuk) {
            return response()->json(['message' => 'Data tools masuk tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal'      => 'sometimes|required|date',
            'jumlah_masuk' => 'sometimes|required|integer|min:1',
            'keterangan'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        try {
            $toolMasuk = DB::transaction(function () use ($toolMasuk, $data) {
                if (! isset($data['jumlah_masuk']) || $data['jumlah_masuk'] == $toolMasuk->jumlah_masuk) {
                    $toolMasuk->update($data);
                    return $toolMasuk;
                }

                $tool = Tool::lockForUpdate()->findOrFail($toolMasuk->tool_id);
                $selisih = $data['jumlah_masuk'] - $toolMasuk->jumlah_masuk;

                if ($selisih < 0 && $tool->stok < abs($selisih)) {
                    throw new \RuntimeException(
                        "Stok tidak cukup untuk mengurangi jumlah ini. Stok saat ini: {$tool->stok}"
                    );
                }

                $tool->stok += $selisih;
                $tool->save();

                $toolMasuk->update($data);

                return $toolMasuk;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($toolMasuk->load(['tool', 'dicatatOleh']));
    }

    // DELETE /api/tools-masuk/{id}
    public function destroy(string $id)
    {
        $toolMasuk = ToolMasuk::find($id);

        if (! $toolMasuk) {
            return response()->json(['message' => 'Data tools masuk tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($toolMasuk) {
            $tool = Tool::lockForUpdate()->find($toolMasuk->tool_id);

            if ($tool) {
                $tool->stok -= $toolMasuk->jumlah_masuk;
                $tool->save();
            }

            $toolMasuk->delete();
        });

        return response()->json(['message' => 'Data tools masuk berhasil dihapus, stok disesuaikan kembali']);
    }
}

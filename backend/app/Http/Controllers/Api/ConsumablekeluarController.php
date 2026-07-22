<?php

namespace App\Http\Controllers\API;

use App\Models\Consumable;
use App\Models\ConsumableKeluar;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ConsumableKeluarController extends Controller
{
    // GET /api/consumable-keluar
    public function index()
    {
        return response()->json(
            ConsumableKeluar::with(['consumable', 'peminta', 'dicatatOleh'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    // GET /api/consumable-keluar/{id}
    public function show(string $id)
    {
        $data = ConsumableKeluar::with(['consumable', 'peminta', 'dicatatOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data consumable keluar tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/consumable-keluar
    // Cek "Stok Cukup?" sesuai flowchart sebelum mengurangi stok
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'consumable_id' => 'required|uuid|exists:consumables,id',
            'peminta_id' => 'required|uuid|exists:peminta,id',
            'jumlah_keluar' => 'required|integer|min:1',
            'pekerjaan_area' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['id'] = (string) Str::uuid();

        try {
            $consumableKeluar = DB::transaction(function () use ($data) {
                $consumable = Consumable::lockForUpdate()->findOrFail($data['consumable_id']);

                if ($consumable->stok_awal < $data['jumlah_keluar']) {
                    throw new \RuntimeException(
                        "Stok tidak cukup. Stok tersedia: {$consumable->stok_awal}, diminta: {$data['jumlah_keluar']}"
                    );
                }

                $consumable->stok_awal -= $data['jumlah_keluar'];
                $consumable->save();

                return ConsumableKeluar::create($data);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($consumableKeluar->load(['consumable', 'peminta']), 201);
    }

    // PUT/PATCH /api/consumable-keluar/{id}
    // Sama seperti consumable-masuk: jumlah_keluar/consumable_id sengaja tidak
    // bisa diubah di sini karena butuh recalculation stok.
    public function update(Request $request, string $id)
    {
        $consumableKeluar = ConsumableKeluar::find($id);

        if (! $consumableKeluar) {
            return response()->json(['message' => 'Data consumable keluar tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'pekerjaan_area' => 'sometimes|required|string|max:255',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $consumableKeluar->update($validator->validated());

        return response()->json($consumableKeluar);
    }

    // DELETE /api/consumable-keluar/{id}
    // Stok dikembalikan (ditambah lagi) saat record dihapus
    public function destroy(string $id)
    {
        $consumableKeluar = ConsumableKeluar::find($id);

        if (! $consumableKeluar) {
            return response()->json(['message' => 'Data consumable keluar tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($consumableKeluar) {
            $consumable = Consumable::lockForUpdate()->find($consumableKeluar->consumable_id);

            if ($consumable) {
                $consumable->stok_awal += $consumableKeluar->jumlah_keluar;
                $consumable->save();
            }

            $consumableKeluar->delete();
        });

        return response()->json(['message' => 'Data consumable keluar berhasil dihapus, stok dikembalikan']);
    }
}

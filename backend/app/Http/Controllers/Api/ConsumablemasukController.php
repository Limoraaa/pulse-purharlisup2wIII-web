<?php

<<<<<<< HEAD
namespace App\Http\Controllers\Api;
=======
namespace App\Http\Controllers\API;
>>>>>>> 20aa64932d1054f1d0ce4b081bb34347975cec54

use App\Models\Consumable;
use App\Models\ConsumableMasuk;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ConsumableMasukController extends Controller
{
    // GET /api/consumable-masuk
    public function index()
    {
        return response()->json(
            ConsumableMasuk::with(['consumable', 'dicatatOleh'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    // GET /api/consumable-masuk/{id}
    public function show(string $id)
    {
        $data = ConsumableMasuk::with(['consumable', 'dicatatOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data consumable masuk tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/consumable-masuk
    // Menambah stok consumable sebesar jumlah_masuk
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'consumable_id' => 'required|uuid|exists:consumables,id',
            'jumlah_masuk' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['id'] = (string) Str::uuid();

        $consumableMasuk = DB::transaction(function () use ($data) {
            $consumable = Consumable::lockForUpdate()->findOrFail($data['consumable_id']);
            $consumable->stok_awal += $data['jumlah_masuk'];
            $consumable->save();

            return ConsumableMasuk::create($data);
        });

        return response()->json($consumableMasuk->load('consumable'), 201);
    }

    // PUT/PATCH /api/consumable-masuk/{id}
    // Catatan: sengaja tidak mengizinkan ubah jumlah_masuk/consumable_id di sini
    // karena itu butuh recalculation stok. Kalau butuh koreksi jumlah, hapus lalu buat ulang.
    public function update(Request $request, string $id)
    {
        $consumableMasuk = ConsumableMasuk::find($id);

        if (! $consumableMasuk) {
            return response()->json(['message' => 'Data consumable masuk tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $consumableMasuk->update($validator->validated());

        return response()->json($consumableMasuk);
    }

    // DELETE /api/consumable-masuk/{id}
    // Stok akan dikembalikan (dikurangi lagi) saat record dihapus
    public function destroy(string $id)
    {
        $consumableMasuk = ConsumableMasuk::find($id);

        if (! $consumableMasuk) {
            return response()->json(['message' => 'Data consumable masuk tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($consumableMasuk) {
            $consumable = Consumable::lockForUpdate()->find($consumableMasuk->consumable_id);

            if ($consumable) {
                $consumable->stok_awal -= $consumableMasuk->jumlah_masuk;
                $consumable->save();
            }

            $consumableMasuk->delete();
        });

        return response()->json(['message' => 'Data consumable masuk berhasil dihapus, stok disesuaikan kembali']);
    }
}

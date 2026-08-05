<?php

namespace App\Http\Controllers\API;

use App\Models\Consumable;
use App\Models\ConsumableMasuk;
use App\Models\Peminta; 
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
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal'       => 'required|date',
            'consumable_id' => 'required|uuid|exists:consumables,id',
            'jumlah_masuk'  => 'required|integer|min:1',
            'keterangan'    => 'nullable|string',
            'peminta_id'    => 'required|string|exists:peminta,id', // Wajib menangkap peminta_id dari frontend
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        // Bersihkan string dari scanner
        $pemintaId = trim($data['peminta_id']);

        // --- TAMBAHKAN DEBUG INI ---
        \Log::info('CEK SCAN RFID:', [
            'diterima_mentah' => $data['peminta_id'],
            'setelah_trim' => $pemintaId,
            'apakah_ketemu' => Peminta::find($pemintaId) ? 'YA, KETEMU' : 'TIDAK KETEMU DI DATABASE'
        ]);
        // ---------------------------

        $peminta = Peminta::find($pemintaId);

        if (!$peminta) {
            return response()->json([
                'message' => "Akses ditolak: ID Card '{$pemintaId}' tidak terdaftar sebagai peminta yang sah."
            ], 403);
        }

        // Masukkan ID peminta ke kolom dicatat_oleh
        $data['dicatat_oleh'] = $peminta->id; 
        
        // Hapus peminta_id karena kolomnya di tabel consumable_masuk bernama dicatat_oleh
        unset($data['peminta_id']);
        
        $data['id'] = (string) Str::uuid();

        $consumableMasuk = DB::transaction(function () use ($data) {
            $consumable = Consumable::lockForUpdate()->findOrFail($data['consumable_id']);
            $consumable->stok_awal += $data['jumlah_masuk'];
            $consumable->save();

            return ConsumableMasuk::create($data);
        });

        return response()->json($consumableMasuk->load(['consumable', 'dicatatOleh']), 201);
    }

    // PUT/PATCH /api/consumable-masuk/{id}
    public function update(Request $request, string $id)
    {
        $consumableMasuk = ConsumableMasuk::find($id);

        if (! $consumableMasuk) {
            return response()->json(['message' => 'Data consumable masuk tidak ditemukan'], 404);
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
            $consumableMasuk = DB::transaction(function () use ($consumableMasuk, $data) {
                if (! isset($data['jumlah_masuk']) || $data['jumlah_masuk'] == $consumableMasuk->jumlah_masuk) {
                    $consumableMasuk->update($data);
                    return $consumableMasuk;
                }

                $consumable = Consumable::lockForUpdate()->findOrFail($consumableMasuk->consumable_id);
                $selisih = $data['jumlah_masuk'] - $consumableMasuk->jumlah_masuk;

                if ($selisih < 0 && $consumable->stok_awal < abs($selisih)) {
                    throw new \RuntimeException(
                        "Stok tidak cukup untuk mengurangi jumlah ini. Stok saat ini: {$consumable->stok_awal}"
                    );
                }

                $consumable->stok_awal += $selisih;
                $consumable->save();

                $consumableMasuk->update($data);

                return $consumableMasuk;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        // Pastikan load relasi 'dicatatOleh' juga disertakan pada response update
        return response()->json($consumableMasuk->load(['consumable', 'dicatatOleh']));
    }

    // DELETE /api/consumable-masuk/{id}
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
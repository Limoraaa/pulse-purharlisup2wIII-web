<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Peminjaman;
use App\Models\Tool;
use App\Models\Consumable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PeminjamanController extends Controller
{
    // GET /api/peminjaman
    public function index()
    {
        return response()->json(
            Peminjaman::with(['tool', 'peminta', 'dicatatOleh'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    public function scan(Request $request)
    {
        $request->validate([
            'tools_id'      => 'nullable|uuid|required_without:consumable_id',
            'consumable_id' => 'nullable|uuid|required_without:tools_id',
            'jumlah'        => 'required|integer|min:1',
        ]);

        $userId = $request->user('sanctum')?->id ?? '00000000-0000-0000-0000-000000000000';
        $jumlah = $request->jumlah;

        $itemId = $request->filled('tools_id') ? $request->tools_id : $request->consumable_id;

        $tool = Tool::find($itemId);
        $consumable = $tool ? null : Consumable::find($itemId);

        if (!$tool && !$consumable) {
            return response()->json(['message' => 'Item tidak ditemukan di data Tools maupun Consumable.'], 404);
        }

        $isTool = (bool) $tool;
        $column = $isTool ? 'tools_id' : 'consumable_id';

        $existing = DB::table('temporary_cart')
            ->where($column, $itemId)
            ->first();

        $totalDiminta = ($existing->qty ?? 0) + $jumlah;

        if ($isTool) {
            if ($tool->tersedia() < $totalDiminta) {
                return response()->json([
                    'message' => "Stok alat '{$tool->nama_barang}' tidak mencukupi! Tersedia maksimal: {$tool->tersedia()}",
                ], 422);
            }
        } else {
            if ($consumable->stok_awal < $totalDiminta) {
                return response()->json([
                    'message' => "Stok bahan '{$consumable->nama}' tidak mencukupi! Tersedia maksimal: {$consumable->stok_awal}",
                ], 422);
            }
        }

        return DB::transaction(function () use ($existing, $itemId, $userId, $column, $jumlah, $isTool, $tool, $consumable) {
            if ($existing) {
                DB::table('temporary_cart')->where('id', $existing->id)->update([
                    'qty'        => $existing->qty + $jumlah,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('temporary_cart')->insert([
                    'id'         => (string) Str::uuid(),
                    'user_id'    => $userId,
                    $column      => $itemId,
                    'qty'        => $jumlah,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $namaBarang = $isTool ? $tool->nama_barang : $consumable->nama;
            $labelTipe  = $isTool ? 'Alat' : 'Bahan';

            return response()->json(['message' => "Berhasil masuk keranjang: {$namaBarang} ({$labelTipe})"], 201);
        });
    }

    // GET /api/peminjaman/antrean
    public function antrean(Request $request)
    {
        $cartItems = DB::table('temporary_cart')
            ->whereNotNull('tools_id')
            ->get();

        $data = $cartItems->map(function ($item) {
            $tool = Tool::find($item->tools_id);

            if ($tool) {
                $item->nama_barang = $tool->nama_barang;
                $item->kode_barang = $tool->kode_barang;
                $item->max_jumlah  = $tool->tersedia();
                $item->tipe_item   = 'tool';
            } else {
                $item->nama_barang = 'Item Dihapus';
                $item->kode_barang = '-';
                $item->max_jumlah  = 0;
                $item->tipe_item   = 'tool';
            }

            return $item;
        });

        return response()->json(['data' => $data]);
    }

    // PATCH /api/peminjaman/cart/{id}
    public function updateCartItem(Request $request, string $id)
    {
        $request->validate(['qty' => 'required|integer|min:1']);

        $cart = DB::table('temporary_cart')->where('id', $id)->whereNotNull('tools_id')->first();
        if (!$cart) return response()->json(['message' => 'Item tidak ditemukan'], 404);

        $tool = Tool::find($cart->tools_id);
        if (!$tool) return response()->json(['message' => 'Alat tidak ditemukan'], 404);

        if ($request->qty > $tool->tersedia()) {
            return response()->json([
                'message' => 'Stok tidak mencukupi! Tersedia maksimal: ' . $tool->tersedia(),
            ], 422);
        }

        DB::table('temporary_cart')
            ->where('id', $id)
            ->update(['qty' => $request->qty, 'updated_at' => now()]);

        return response()->json(['message' => 'Jumlah diperbarui']);
    }

    // DELETE /api/peminjaman/cart/{id}
    public function removeCartItem($id)
    {
        $affected = DB::table('temporary_cart')
            ->where('id', $id)
            ->whereNotNull('tools_id')
            ->delete();

        if (!$affected) {
            $affected = DB::table('temporary_cart')
                ->where('tools_id', $id)
                ->whereNotNull('tools_id')
                ->delete();
        }

        if (!$affected) return response()->json(['message' => 'Item tidak ditemukan'], 404);
        return response()->json(['message' => 'Item berhasil dihapus dari antrean']);
    }

    // POST /api/peminjaman/proses (Dalam middleware auth)
    public function prosesPeminjaman(Request $request)
    {
        $request->validate([
            // Diubah dari 'uuid' menjadi 'string' agar menerima ID RFID murni
            'peminta_id' => 'required|string|exists:peminta,id',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        $antrean = DB::table('temporary_cart')->whereNotNull('tools_id')->get();

        if ($antrean->isEmpty()) {
            return response()->json(['message' => 'Antrean kosong'], 400);
        }

        foreach ($antrean as $item) {
            $tool = Tool::find($item->tools_id);
            if (!$tool) {
                return response()->json(['message' => 'Salah satu alat di keranjang sudah tidak ada'], 422);
            }
            if ($item->qty > $tool->tersedia()) {
                return response()->json([
                    'message' => "Stok {$tool->nama_barang} tidak mencukupi! Tersedia maksimal: {$tool->tersedia()}",
                ], 422);
            }
        }

        DB::transaction(function () use ($antrean, $request) {
            foreach ($antrean as $item) {
                Peminjaman::create([
                    'id'           => (string) Str::uuid(),
                    'tool_id'      => $item->tools_id,
                    'peminta_id'   => $request->peminta_id,
                    'dicatat_oleh' => $request->dicatat_oleh,
                    'tanggal'      => now(),
                    'jumlah'       => $item->qty,
                ]);
            }

            DB::table('temporary_cart')->whereNotNull('tools_id')->delete();
        });

        return response()->json(['message' => 'Transaksi berhasil diproses!'], 200);
    }

    // GET /api/peminjaman/{id}
    public function show(string $id)
    {
        $data = Peminjaman::with(['tool', 'peminta', 'dicatatOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data peminjaman tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/peminjaman
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'tool_id' => 'required|uuid|exists:tools,id',
            // Diubah dari 'uuid' menjadi 'string'
            'peminta_id' => 'required|string|exists:peminta,id',
            'jumlah' => 'required|integer|min:1',
            'area_pekerjaan' => 'nullable|string|max:255',
            'spesifikasi' => 'nullable|string',
            'keterangan' => 'nullable|string',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $tool = Tool::findOrFail($data['tool_id']);

        if ($tool->tersedia() < $data['jumlah']) {
            return response()->json([
                'message' => "Stok tidak cukup. Tersedia: {$tool->tersedia()}, diminta: {$data['jumlah']}",
            ], 422);
        }

        $data['id'] = (string) Str::uuid();
        $data['tanggal_kembali'] = null;

        $peminjaman = Peminjaman::create($data);

        return response()->json($peminjaman->load(['tool', 'peminta']), 201);
    }

    // PUT/PATCH /api/peminjaman/{id}
    public function update(Request $request, string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Data peminjaman tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'area_pekerjaan' => 'nullable|string|max:255',
            'spesifikasi' => 'nullable|string',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminjaman->update($validator->validated());

        return response()->json($peminjaman);
    }

    // PATCH /api/peminjaman/{id}/kembali
    public function kembali(string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Data peminjaman tidak ditemukan'], 404);
        }

        if ($peminjaman->sudahKembali()) {
            return response()->json(['message' => 'Peminjaman ini sudah ditandai kembali sebelumnya'], 422);
        }

        $peminjaman->update(['tanggal_kembali' => now()]);

        return response()->json([
            'message' => 'Alat berhasil ditandai dikembalikan',
            'data' => $peminjaman->load('tool'),
        ]);
    }

    // DELETE /api/peminjaman/{id}
    public function destroy(string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Data peminjaman tidak ditemukan'], 404);
        }

        $peminjaman->delete();

        return response()->json(['message' => 'Data peminjaman berhasil dihapus']);
    }
}
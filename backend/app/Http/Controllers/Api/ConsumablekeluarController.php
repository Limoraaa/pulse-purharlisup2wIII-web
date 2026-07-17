<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumableKeluar;
use App\Models\Consumable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

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

    // POST /api/consumable/scan
    public function scan(Request $request)
    {
        // 1. Validasi fleksibel: minimal salah satu ID dikirim
        // Ini akan mencegah error "The tool id field is required"
        $request->validate([
            'toolId' => 'nullable|uuid|required_without:consumableId',
            'consumableId' => 'nullable|uuid|required_without:toolId',
            'jumlah' => 'required|integer|min:1'
        ]);

        $userId = $request->user('sanctum')?->id ?? '00000000-0000-0000-0000-000000000000';

        // 2. Tentukan konteks: Apakah Tool atau Consumable
        // Kita gunakan toolId sebagai indikator utama untuk modul Tools
        $isTool = $request->has('toolId');
        $itemId = $isTool ? $request->toolId : $request->consumableId;
        $column = $isTool ? 'tools_id' : 'consumable_id';

        // 3. Validasi Stok (Opsional: Cek stok di model terkait)
        if ($isTool) {
            $tool = Tool::findOrFail($itemId);
            if ($tool->tersedia() <= 0) {
                return response()->json(['message' => 'Stok alat tidak mencukupi!'], 422);
            }
        }

        // 4. Cek apakah sudah ada di cart untuk user ini
        $existing = DB::table('temporary_cart')
            ->where($column, $itemId)
            ->where('user_id', $userId)
            ->first();

        // 5. Proses Insert/Update
        return DB::transaction(function () use ($existing, $itemId, $userId, $column) {
            if ($existing) {
                DB::table('temporary_cart')->where('id', $existing->id)->update([
                    'qty' => $existing->qty + 1,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('temporary_cart')->insert([
                    'id' => (string) Str::uuid(), 
                    'user_id' => $userId,
                    $column => $itemId, // Akan mengisi kolom yang benar secara dinamis
                    'qty' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            return response()->json(['message' => 'Berhasil masuk keranjang'], 201);
        });
    }

    // GET /api/consumable-keluar/antrean
    public function antrean(Request $request)
    {
        $staticUserId = '00000000-0000-0000-0000-000000000000';
        $authUserId = $request->user('sanctum')?->id;

        // 1. Ambil data cart saja tanpa join raw SQL.
        // whereNotNull('consumable_id') memastikan baris milik keranjang tools
        // (yang consumable_id-nya null) tidak ikut terbawa.
        $cartItems = DB::table('temporary_cart')
            ->where(function ($query) use ($staticUserId, $authUserId) {
                $query->where('user_id', $staticUserId);
                if ($authUserId) {
                    $query->orWhere('user_id', $authUserId);
                }
            })
            ->whereNotNull('consumable_id')
            ->get();

        // 2. Looping data cart untuk menyisipkan info detail bahan dan stok
        $data = $cartItems->map(function ($item) {
            $consumable = Consumable::find($item->consumable_id);

            if ($consumable) {
                $item->nama = $consumable->nama;
                $item->kode_barang = $consumable->kode_barang;

                // Consumable habis terpakai (bukan dipinjam), jadi stok tersedia
                // = stok_awal saat ini. Kalau nanti ada kebutuhan mengunci stok
                // yang sudah "dipesan" user lain di keranjang mereka, method ini
                // bisa disesuaikan sama seperti Tool::tersedia().
                $item->stok_tersedia = $consumable->stok_awal;
            } else {
                $item->nama = 'Bahan Dihapus';
                $item->kode_barang = '-';
                $item->stok_tersedia = 0;
            }

            return $item;
        });

        return response()->json(['data' => $data]);
    }

    // PATCH /api/consumable-keluar/cart/{id}
    public function updateCartItem(Request $request, string $id)
    {
        $request->validate(['qty' => 'required|integer|min:1']);

        // 1. Ambil data keranjang dan bahannya
        $cart = DB::table('temporary_cart')->where('id', $id)->whereNotNull('consumable_id')->first();
        if (!$cart) return response()->json(['message' => 'Item tidak ditemukan'], 404);

        $consumable = Consumable::find($cart->consumable_id);
        if (!$consumable) return response()->json(['message' => 'Bahan tidak ditemukan'], 404);

        // 2. Validasi Stok! Cek apakah angka yang direquest melebihi stok tersedia
        if ($request->qty > $consumable->stok_awal) {
            return response()->json([
                'message' => 'Stok tidak mencukupi! Tersedia maksimal: ' . $consumable->stok_awal
            ], 422);
        }

        // 3. Update jika aman
        DB::table('temporary_cart')
            ->where('id', $id)
            ->update(['qty' => $request->qty, 'updated_at' => now()]);

        return response()->json(['message' => 'Jumlah diperbarui']);
    }

    // DELETE /api/consumable-keluar/cart/{id}
    public function removeCartItem($id)
    {
        // Hapus berdasarkan id cart tanpa filter user (Public Mode untuk Cart),
        // tapi tetap dibatasi ke baris consumable saja supaya tidak menyentuh
        // baris keranjang tools yang kebetulan share tabel yang sama.
        $affected = DB::table('temporary_cart')
            ->where('id', $id)
            ->whereNotNull('consumable_id')
            ->delete();

        if (!$affected) return response()->json(['message' => 'Item tidak ditemukan'], 404);
        return response()->json(['message' => 'Item berhasil dihapus dari antrean']);
    }

    // POST /api/consumable-keluar/proses (Dalam middleware auth)
    public function prosesKeluar(Request $request)
    {
        $request->validate([
            'peminta_id' => 'required|uuid|exists:peminta,id',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
            'pekerjaan_area' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
        ]);

        // Karena satu sistem, kita ambil semua isi antrean consumable
        $antrean = DB::table('temporary_cart')->whereNotNull('consumable_id')->get();

        if ($antrean->isEmpty()) {
            return response()->json(['message' => 'Antrean kosong'], 400);
        }

        // Validasi stok semua item dulu sebelum eksekusi, supaya tidak ada
        // proses yang setengah jalan kalau salah satu item stoknya kurang.
        foreach ($antrean as $item) {
            $consumable = Consumable::find($item->consumable_id);
            if (!$consumable) {
                return response()->json(['message' => 'Salah satu bahan di keranjang sudah tidak ada'], 422);
            }
            if ($item->qty > $consumable->stok_awal) {
                return response()->json([
                    'message' => "Stok {$consumable->nama} tidak mencukupi! Tersedia maksimal: {$consumable->stok_awal}"
                ], 422);
            }
        }

        DB::transaction(function () use ($antrean, $request) {
            foreach ($antrean as $item) {
                $consumable = Consumable::find($item->consumable_id);

                ConsumableKeluar::create([
                    'id' => (string) Str::uuid(),
                    'consumable_id' => $item->consumable_id,
                    'peminta_id' => $request->peminta_id,
                    'dicatat_oleh' => $request->dicatat_oleh,
                    'pekerjaan_area' => $request->pekerjaan_area,
                    'keterangan' => $request->keterangan,
                    'tanggal' => now(),
                    'jumlah_keluar' => $item->qty,
                ]);

                // Bahan habis terpakai -> kurangi stok_awal secara permanen.
                $consumable->decrement('stok_awal', $item->qty);
            }

            // Kosongkan antrean consumable setelah sukses (biarkan baris tools tetap ada)
            DB::table('temporary_cart')->whereNotNull('consumable_id')->delete();
        });

        return response()->json(['message' => 'Pengeluaran bahan berhasil diproses!'], 200);
    }

    // GET /api/consumable-keluar/{id}
    public function show(string $id)
    {
        $data = ConsumableKeluar::with(['consumable', 'peminta', 'dicatatOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data pengeluaran tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/consumable-keluar
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'consumable_id' => 'required|uuid|exists:consumables,id',
            'peminta_id' => 'required|uuid|exists:peminta,id',
            'jumlah_keluar' => 'required|integer|min:1',
            'pekerjaan_area' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $consumable = Consumable::findOrFail($data['consumable_id']);

        if ($consumable->stok_awal < $data['jumlah_keluar']) {
            return response()->json([
                'message' => "Stok tidak cukup. Tersedia: {$consumable->stok_awal}, diminta: {$data['jumlah_keluar']}",
            ], 422);
        }

        $data['id'] = (string) Str::uuid();

        $consumableKeluar = ConsumableKeluar::create($data);
        $consumable->decrement('stok_awal', $data['jumlah_keluar']);

        return response()->json($consumableKeluar->load(['consumable', 'peminta']), 201);
    }

    // PUT/PATCH /api/consumable-keluar/{id}
    public function update(Request $request, string $id)
    {
        $consumableKeluar = ConsumableKeluar::find($id);

        if (! $consumableKeluar) {
            return response()->json(['message' => 'Data pengeluaran tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'pekerjaan_area' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $consumableKeluar->update($validator->validated());

        return response()->json($consumableKeluar);
    }

    // DELETE /api/consumable-keluar/{id}
    public function destroy(string $id)
    {
        $consumableKeluar = ConsumableKeluar::find($id);

        if (! $consumableKeluar) {
            return response()->json(['message' => 'Data pengeluaran tidak ditemukan'], 404);
        }

        $consumableKeluar->delete();

        return response()->json(['message' => 'Data pengeluaran berhasil dihapus']);
    }
}
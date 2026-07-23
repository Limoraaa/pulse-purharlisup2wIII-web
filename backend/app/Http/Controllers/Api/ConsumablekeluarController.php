<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumableKeluar;
use App\Models\Consumable;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ConsumableKeluarController extends Controller
{
    private const STATIC_USER_ID = '00000000-0000-0000-0000-000000000000';

    // Helper: user_id efektif (auth user kalau login, fallback ke UUID statis)
    private function resolveUserId(Request $request): string
    {
        return $request->user('sanctum')?->id ?? self::STATIC_USER_ID;
    }

    // GET /api/consumable-keluar
    public function index()
    {
        return response()->json(
            ConsumableKeluar::with(['consumable', 'peminta', 'dicatatOleh'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    // POST /api/consumable-keluar/scan
    public function scan(Request $request)
    {
        $request->validate([
            'tools_id'      => 'nullable|uuid|required_without:consumable_id',
            'consumable_id' => 'nullable|uuid|required_without:tools_id',
            'jumlah'        => 'required|integer|min:1',
        ], [
            'tools_id.required_without'      => 'ID alat atau ID bahan wajib diisi.',
            'consumable_id.required_without' => 'ID alat atau ID bahan wajib diisi.',
            'jumlah.required'                => 'Jumlah wajib diisi.',
        ]);

        $userId = $this->resolveUserId($request);
        $jumlah = $request->jumlah;

        // ID yang dikirim client (field mana pun yang terisi).
        $itemId = $request->filled('tools_id') ? $request->tools_id : $request->consumable_id;

        // Tentukan tipe SEBENARNYA dengan mengecek langsung ke DB,
        // bukan percaya begitu saja pada nama field yang dikirim client
        // (app scanner HP selalu mengirim field 'tools_id' apapun yang di-scan).
        $tool = Tool::find($itemId);
        $consumable = $tool ? null : Consumable::find($itemId);

        if (!$tool && !$consumable) {
            return response()->json(['message' => 'Item tidak ditemukan di data Tools maupun Consumable.'], 404);
        }

        $isTool = (bool) $tool;
        $column = $isTool ? 'tools_id' : 'consumable_id';

        // Cek dulu apakah item ini sudah ada di cart milik user ini,
        // supaya validasi stok memperhitungkan qty yang sudah ada + qty baru.
        $existing = DB::table('temporary_cart')
            ->where($column, $itemId)
            ->where('user_id', $userId)
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

    // GET /api/consumable-keluar/antrean
    // Hanya mengembalikan item bertipe Consumable milik user ini (statis atau login),
    // agar tidak tercampur dengan cart Tools maupun cart milik user lain.
    public function antrean(Request $request)
    {
        $staticUserId = self::STATIC_USER_ID;
        $authUserId = $request->user('sanctum')?->id;

        $cartItems = DB::table('temporary_cart')
            ->where(function ($query) use ($staticUserId, $authUserId) {
                $query->where('user_id', $staticUserId);
                if ($authUserId) {
                    $query->orWhere('user_id', $authUserId);
                }
            })
            ->whereNotNull('consumable_id')
            ->get();

        $data = $cartItems->map(function ($item) {
            $consumable = Consumable::find($item->consumable_id);

            if ($consumable) {
                $item->namaBarang    = $consumable->nama;
                $item->kodeBarang    = $consumable->kode_barang;
                $item->stok_tersedia = $consumable->stok_awal;
            } else {
                $item->namaBarang    = 'Bahan Dihapus';
                $item->kodeBarang    = '-';
                $item->stok_tersedia = 0;
            }

            return $item;
        });

        return response()->json(['data' => $data]);
    }

    // PATCH /api/consumable-keluar/cart/{id}
    public function updateCartItem(Request $request, string $id)
    {
        $request->merge([
            'qty' => $request->input('jumlah') ?? $request->input('qty'),
        ]);

        $request->validate(['qty' => 'required|integer|min:1']);

        $userId = $this->resolveUserId($request);

        // Filter user_id memastikan endpoint ini tidak bisa "menyentuh"
        // cart row milik user lain walaupun id-nya cocok.
        $cart = DB::table('temporary_cart')
            ->where('id', $id)
            ->where('user_id', $userId)
            ->whereNotNull('consumable_id')
            ->first();

        if (!$cart) return response()->json(['message' => 'Item tidak ditemukan'], 404);

        $consumable = Consumable::find($cart->consumable_id);
        if (!$consumable) return response()->json(['message' => 'Bahan tidak ditemukan'], 404);

        if ($request->qty > $consumable->stok_awal) {
            return response()->json([
                'message' => 'Stok tidak mencukupi! Tersedia maksimal: ' . $consumable->stok_awal,
            ], 422);
        }

        DB::table('temporary_cart')
            ->where('id', $id)
            ->update(['qty' => $request->qty, 'updated_at' => now()]);

        return response()->json(['message' => 'Jumlah diperbarui']);
    }

    // DELETE /api/consumable-keluar/cart/{id} atau antrean/{id}
    // Menerima baik cart id maupun consumable_id, tapi selalu dibatasi ke cart milik user ini.
    public function hapusAntrean(Request $request, string $consumable_id)
    {
        $userId = $this->resolveUserId($request);

        $affected = DB::table('temporary_cart')
            ->where('consumable_id', $consumable_id)
            ->where('user_id', $userId)
            ->whereNotNull('consumable_id')
            ->delete();

        if (!$affected) {
            $affected = DB::table('temporary_cart')
                ->where('id', $consumable_id)
                ->where('user_id', $userId)
                ->whereNotNull('consumable_id')
                ->delete();
        }

        if (!$affected) {
            return response()->json(['message' => 'Item tidak ditemukan atau sudah dihapus'], 404);
        }

        return response()->json(['message' => 'Item berhasil dihapus dari antrean']);
    }

    public function removeCartItem(Request $request, $id)
    {
        return $this->hapusAntrean($request, $id);
    }

    // POST /api/consumable-keluar/proses
    public function prosesCartConsumable(Request $request)
    {
        $request->validate([
            'peminta_id'     => 'required|uuid|exists:peminta,id',
            'dicatat_oleh'   => 'required|uuid|exists:users,id',
            'pekerjaan_area' => 'nullable|string|max:255',
            'keterangan'     => 'nullable|string',
        ]);

        $staticUserId = self::STATIC_USER_ID;
        $authUserId = $request->user('sanctum')?->id;

        // Hanya proses cart consumable milik user ini (statis atau login),
        // supaya tidak ikut memproses/menghapus cart milik user lain.
        $antreanQuery = DB::table('temporary_cart')
            ->where(function ($query) use ($staticUserId, $authUserId) {
                $query->where('user_id', $staticUserId);
                if ($authUserId) {
                    $query->orWhere('user_id', $authUserId);
                }
            })
            ->whereNotNull('consumable_id');

        $antrean = $antreanQuery->get();

        if ($antrean->isEmpty()) {
            return response()->json(['message' => 'Antrean kosong'], 400);
        }

        // Validasi stok dulu sebelum insert, supaya tidak ada proses parsial
        foreach ($antrean as $item) {
            $consumable = Consumable::find($item->consumable_id);
            if (!$consumable) {
                return response()->json(['message' => 'Salah satu bahan di keranjang sudah tidak ada'], 422);
            }
            if ($item->qty > $consumable->stok_awal) {
                return response()->json([
                    'message' => "Stok {$consumable->nama} tidak mencukupi! Tersedia maksimal: {$consumable->stok_awal}",
                ], 422);
            }
        }

        DB::transaction(function () use ($antrean, $request, $staticUserId, $authUserId) {
            foreach ($antrean as $item) {
                $consumable = Consumable::find($item->consumable_id);

                ConsumableKeluar::create([
                    'id'             => (string) Str::uuid(),
                    'consumable_id'  => $item->consumable_id,
                    'peminta_id'     => $request->peminta_id,
                    'dicatat_oleh'   => $request->dicatat_oleh,
                    'pekerjaan_area' => $request->pekerjaan_area,
                    'keterangan'     => $request->keterangan,
                    'tanggal'        => now(),
                    'jumlah_keluar'  => $item->qty,
                ]);

                // Kurangi stok_awal consumable
                $consumable->decrement('stok_awal', $item->qty);
            }

            // Hapus HANYA cart consumable milik user ini
            DB::table('temporary_cart')
                ->where(function ($query) use ($staticUserId, $authUserId) {
                    $query->where('user_id', $staticUserId);
                    if ($authUserId) {
                        $query->orWhere('user_id', $authUserId);
                    }
                })
                ->whereNotNull('consumable_id')
                ->delete();
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
            'tanggal'        => 'required|date',
            'consumable_id'  => 'required|uuid|exists:consumables,id',
            'peminta_id'     => 'required|uuid|exists:peminta,id',
            'jumlah_keluar'  => 'required|integer|min:1',
            'pekerjaan_area' => 'nullable|string|max:255',
            'keterangan'     => 'nullable|string',
            'dicatat_oleh'   => 'required|uuid|exists:users,id',
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
            'tanggal'        => 'sometimes|required|date',
            'pekerjaan_area' => 'nullable|string|max:255',
            'keterangan'     => 'nullable|string',
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
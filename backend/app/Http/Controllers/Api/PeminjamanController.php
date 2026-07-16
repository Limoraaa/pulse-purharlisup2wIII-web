<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Peminjaman;
use App\Models\Tool;
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
        // 1. Validasi input
        $request->validate([
            'tools_id' => 'required|string', 
        ]);

        // 2. Debugging: Log kode yang diterima
        $cleanId = trim($request->tools_id);
        \Log::info("Scanner - Mencoba scan kode: " . $cleanId);

        // 3. Cari tool berdasarkan kode_barang atau id
        $tool = Tool::where('kode_barang', $cleanId)
                    ->orWhere('id', $cleanId)
                    ->first();

        // 4. Jika tidak ditemukan
        if (!$tool) {
            \Log::error("Scanner - Barang tidak ditemukan: " . $cleanId);
            return response()->json(['message' => 'Barang dengan kode ' . $cleanId . ' tidak ditemukan!'], 404);
        }

        // 5. Tentukan user_id (gunakan ID tamu default jika tidak ada user login)
        $user = $request->user('sanctum');
        $userId = $user ? $user->id : '00000000-0000-0000-0000-000000000000';

        // 6. Cek apakah barang sudah ada di keranjang (untuk menghindari duplikat baris)
        $existing = DB::table('temporary_cart')
            ->where('tools_id', $tool->id)
            ->where('user_id', $userId)
            ->first();

        // 7. Proses Insert atau Update (menghindari bug keranjang terpisah)
        return DB::transaction(function () use ($tool, $userId, $existing) {
            if ($existing) {
                // Jika sudah ada, cukup tambahkan qty-nya
                DB::table('temporary_cart')
                    ->where('id', $existing->id)
                    ->update([
                        'qty' => $existing->qty + 1,
                        'updated_at' => now(),
                    ]);
                $message = 'Jumlah barang diperbarui di keranjang';
            } else {
                // Jika kolom 'id' di database adalah auto-increment (bigint),
                // jangan memasukkan UUID secara manual. Biarkan database yang meng-generate-nya.
                DB::table('temporary_cart')->insert([
                    'user_id' => $userId,
                    'tools_id' => $tool->id,
                    'qty' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $message = 'Barang berhasil masuk keranjang';
            }

            return response()->json(['message' => $message], 201);
        });
    }

    // GET /api/peminjaman/antrean
    public function antrean(Request $request)
    {
        $staticUserId = '00000000-0000-0000-0000-000000000000';
        $authUserId = $request->user('sanctum')?->id;

        // 1. Ambil data cart saja tanpa join raw SQL
        $cartItems = DB::table('temporary_cart')
            ->where(function($query) use ($staticUserId, $authUserId) {
                $query->where('user_id', $staticUserId);
                if ($authUserId) {
                    $query->orWhere('user_id', $authUserId);
                }
            })
            ->get();

        // 2. Looping data cart untuk menyisipkan info detail alat dan stok AKTUAL
        $data = $cartItems->map(function ($item) {
            $tool = \App\Models\Tool::find($item->tools_id);
            
            if ($tool) {
                $item->nama_barang = $tool->nama_barang;
                $item->kode_barang = $tool->kode_barang;
                
                // PENTING: Gunakan fungsi tersedia() bawaan Model kamu
                // Ini akan menghasilkan angka akurat (Stok asli - yang sedang dipinjam user lain)
                $item->max_jumlah = $tool->tersedia(); 
            } else {
                $item->nama_barang = 'Alat Dihapus';
                $item->kode_barang = '-';
                $item->max_jumlah = 0;
            }
            
            return $item;
        });

        return response()->json(['data' => $data]);
    }

    public function updateCartItem(Request $request, string $id)
    {
        $request->validate(['qty' => 'required|integer|min:1']);
        
        // 1. Ambil data keranjang dan alatnya
        $cart = DB::table('temporary_cart')->where('id', $id)->first();
        if (!$cart) return response()->json(['message' => 'Item tidak ditemukan'], 404);

        $tool = Tool::find($cart->tools_id);
        if (!$tool) return response()->json(['message' => 'Alat tidak ditemukan'], 404);

        // 2. Validasi Stok! Cek apakah angka yang direquest melebihi stok tersedia
        if ($request->qty > $tool->tersedia()) {
            return response()->json([
                'message' => 'Stok tidak mencukupi! Tersedia maksimal: ' . $tool->tersedia()
            ], 422);
        }

        // 3. Update jika aman
        DB::table('temporary_cart')
            ->where('id', $id)
            ->update(['qty' => $request->qty, 'updated_at' => now()]);

        return response()->json(['message' => 'Jumlah diperbarui']);
    }

    public function removeCartItem($id)
    {
        // Hapus berdasarkan UUID cart tanpa filter user (Public Mode untuk Cart)
        $affected = DB::table('temporary_cart')->where('id', $id)->delete();
        
        if (!$affected) return response()->json(['message' => 'Item tidak ditemukan'], 404);
        return response()->json(['message' => 'Item berhasil dihapus dari antrean']);
    }

    // POST /api/peminjaman/proses (Dalam middleware auth)
    public function prosesPeminjaman(Request $request) 
    {
        $request->validate([
            'peminta_id' => 'required|uuid|exists:peminta,id',
            'dicatat_oleh' => 'required|uuid|exists:users,id',
        ]);

        // Karena satu sistem, kita ambil semua isi antrean
        $antrean = DB::table('temporary_cart')->get();

        if ($antrean->isEmpty()) {
            return response()->json(['message' => 'Antrean kosong'], 400);
        }

        foreach ($antrean as $item) {
            Peminjaman::create([
                'id' => (string) Str::uuid(),
                'tool_id' => $item->tools_id,
                'peminta_id' => $request->peminta_id,
                'dicatat_oleh' => $request->dicatat_oleh,
                'tanggal' => now(),
                'jumlah' => $item->qty,
            ]);
        }

        // Kosongkan antrean setelah sukses
        DB::table('temporary_cart')->truncate();

        return response()->json(['message' => 'Peminjaman berhasil diproses!'], 200);
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
            'peminta_id' => 'required|uuid|exists:peminta,id',
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

        $peminjaman->update(['tanggal_kembali' => now()->toDateString()]);

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
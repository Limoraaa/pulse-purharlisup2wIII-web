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
    $request->validate([
        'tools_id' => 'required'
    ]);

    try {

        DB::table('temporary_cart')->insert([
            'tools_id' => $request->tools_id,
            'qty' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Alat masuk antrean'
        ],201);

    } catch (\Exception $e) {

        return response()->json([
            'message'=>$e->getMessage()
        ],500);

    }
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
    // Cek "Stok Tersedia?" sesuai flowchart sebelum membuat peminjaman
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

    public function prosesPeminjaman(Request $request)
{
    // 1. Validasi input dari form frontend (karena saat submit, user harus kirim peminta_id, dll)
    $request->validate([
        'peminta_id' => 'required|uuid|exists:peminta,id',
        'dicatat_oleh' => 'required|uuid|exists:users,id',
    ]);

    // 2. Ambil semua item dari antrean
    $antrean = DB::table('temporary_cart')->get();

    if ($antrean->isEmpty()) {
        return response()->json(['message' => 'Antrean kosong'], 400);
    }

    // 3. Simpan ke tabel Peminjaman (bisa di-loop atau disesuaikan dengan logika timmu)
    foreach ($antrean as $item) {
        Peminjaman::create([
            'id' => (string) Str::uuid(),
            'tool_id' => $item->tools_id,
            'peminta_id' => $request->peminta_id,
            'dicatat_oleh' => $request->dicatat_oleh,
            'tanggal' => now(),
            'jumlah' => $item->qty,
            // tambahkan field lain sesuai kebutuhan
        ]);
    }

    // 4. Kosongkan antrean setelah diproses
    DB::table('temporary_cart')->truncate();

    return response()->json(['message' => 'Peminjaman berhasil diproses!'], 200);
    }

    // PUT/PATCH /api/peminjaman/{id}
    // Sengaja tidak izinkan ubah tool_id/jumlah di sini (butuh recalculation stok).
    // Kalau salah input alat/jumlah, hapus lalu buat ulang.
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

    // PATCH /api/peminjaman/{id}/kembalikan
    // Endpoint khusus sesuai flowchart "Klik Tandai Dikembalikan"
    public function kembali(string $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            return response()->json(['message' => 'Data peminjaman tidak ditemukan'], 404);
        }

        if ($peminjaman->sudahKembali()) {
            return response()->json(['message' => 'Peminjaman ini sudah ditandai kembali sebelumnya'], 422);
        }

        $peminjaman->update(['tanggal_kembali' => now()]); // ganti dari now()->toDateString()

        return response()->json([
            'message' => 'Alat berhasil ditandai dikembalikan',
            'data' => $peminjaman->load('tool'),
        ]);
    }

    public function antrean()
    {
        $data = DB::table('temporary_cart')->get();
        return response()->json(['data' => $data]);
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

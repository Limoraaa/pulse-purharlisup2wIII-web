<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LaporanKerusakanTools;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LaporanKerusakanController extends Controller
{
    public function index()
    {
        return response()->json(
            LaporanKerusakanTools::with(['tool', 'dilaporkanOleh', 'peminjaman.peminta'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    public function show(string $id)
    {
        $data = LaporanKerusakanTools::with(['tool', 'dilaporkanOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/laporan-kerusakan
    // Otomatis mengurangi tools.stok sebesar jumlah yang dilaporkan rusak
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'tool_id' => 'required|uuid|exists:tools,id',
            'peminjaman_id' => 'nullable|uuid|exists:peminjaman,id',
            'jumlah' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
            'status' => 'required|in:bisa_diperbaiki,rusak_permanen',   // ← diubah
            'dilaporkan_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        try {
            $laporan = DB::transaction(function () use ($data) {
                $tool = Tool::lockForUpdate()->findOrFail($data['tool_id']);

                if ($tool->stok < $data['jumlah']) {
                    throw new \RuntimeException(
                        "Jumlah rusak melebihi stok. Stok saat ini: {$tool->stok}, dilaporkan: {$data['jumlah']}"
                    );
                }

                $tool->stok -= $data['jumlah'];
                $tool->save();

                $data['id'] = (string) Str::uuid();

                return LaporanKerusakanTools::create($data);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($laporan->load('tool'), 201);
    }

    // PUT/PATCH /api/laporan-kerusakan/{id}
    // Boleh ubah jumlah, dengan penyesuaian otomatis ke stok tools
    public function update(Request $request, string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'jumlah' => 'sometimes|required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        try {
            $laporan = DB::transaction(function () use ($laporan, $data) {
                // Kalau jumlah tidak diubah, langsung update field lain saja
                if (! isset($data['jumlah']) || $data['jumlah'] == $laporan->jumlah) {
                    $laporan->update($data);
                    return $laporan;
                }

                $tool = Tool::lockForUpdate()->findOrFail($laporan->tool_id);
                $selisih = $data['jumlah'] - $laporan->jumlah;

                // selisih positif = jumlah rusak nambah -> stok dikurangi lagi
                // selisih negatif = jumlah rusak berkurang -> stok dikembalikan
                if ($selisih > 0 && $tool->stok < $selisih) {
                    throw new \RuntimeException(
                        "Stok tidak cukup untuk menambah jumlah kerusakan. Stok saat ini: {$tool->stok}, tambahan diperlukan: {$selisih}"
                    );
                }

                $tool->stok -= $selisih;
                $tool->save();

                $laporan->update($data);

                return $laporan;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($laporan->load('tool'));
    }
    // DELETE — stok dikembalikan (misal ternyata laporan salah input)
    public function destroy(string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($laporan) {
            $tool = Tool::lockForUpdate()->find($laporan->tool_id);

            if ($tool) {
                $tool->stok += $laporan->jumlah;
                $tool->save();
            }

            $laporan->delete();
        });

        return response()->json(['message' => 'Laporan kerusakan dihapus, stok disesuaikan']);
    }
    // PATCH /api/laporan-kerusakan/{id}/repair
    // Menandai alat sudah diperbaiki: stok dikembalikan, laporan dihapus dari daftar.
    // PATCH /api/laporan-kerusakan/{id}/repair
    // Menandai alat sudah diperbaiki: stok dikembalikan, laporan TETAP ada
    // sebagai riwayat dengan status "selesai_diperbaiki".
    public function repair(string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        if ($laporan->status !== 'bisa_diperbaiki') {
            return response()->json([
                'message' => 'Laporan dengan status Rusak Permanen tidak bisa diproses repair.',
            ], 422);
        }

        $laporan = DB::transaction(function () use ($laporan) {
            $tool = Tool::lockForUpdate()->find($laporan->tool_id);

            if ($tool) {
                $tool->stok += $laporan->jumlah;
                $tool->save();
            }

            $laporan->update([
                'status' => 'selesai_diperbaiki',
                'tanggal_diperbaiki' => now(),
            ]);

            return $laporan;
        });

        return response()->json([
            'message' => 'Alat berhasil ditandai selesai diperbaiki, stok telah dikembalikan.',
            'data' => $laporan->load('tool'),
        ]);
    }

    // PATCH /api/laporan-kerusakan/{id}/tandai-permanen
    // Mengubah klasifikasi dari "bisa diperbaiki" menjadi "rusak permanen".
    // Tidak menyentuh stok karena stok sudah dikurangi sejak laporan pertama dibuat.
    public function tandaiPermanen(string $id)
    {
        $laporan = LaporanKerusakanTools::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        if ($laporan->status !== 'bisa_diperbaiki') {
            return response()->json([
                'message' => 'Laporan ini sudah berstatus Rusak Permanen.',
            ], 422);
        }

        $laporan->update(['status' => 'rusak_permanen']);

        return response()->json([
            'message' => 'Laporan berhasil ditandai sebagai Rusak Permanen.',
            'data' => $laporan->load('tool'),
        ]);
    }

}

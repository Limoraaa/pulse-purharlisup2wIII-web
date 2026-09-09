<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MesinProduksi;
use Illuminate\Http\Request;

class MesinProduksiController extends Controller
{
    // Tampilkan semua data master mesin
    public function index()
    {
        $mesin = MesinProduksi::orderBy('created_at', 'desc')->get();
        return response()->json(['message' => 'Sukses', 'data' => $mesin], 200);
    }

    // Tambah data mesin baru
    public function store(Request $request)
    {
        $request->validate([
            'kode_mesin' => 'required|unique:mesin_produksi,kode_mesin',
            'nama_mesin' => 'required|string',
            'lokasi_ruang' => 'required|string',
        ]);

        $mesin = MesinProduksi::create([
            'kode_mesin' => $request->kode_mesin,
            'nama_mesin' => $request->nama_mesin,
            'lokasi_ruang' => $request->lokasi_ruang,
            'status' => $request->status ?? 'Aktif',
        ]);

        return response()->json(['message' => 'Mesin berhasil ditambahkan', 'data' => $mesin], 201);
    }

    // Detail satu mesin
    public function show($id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        return response()->json(['message' => 'Sukses', 'data' => $mesin], 200);
    }

    // Update data mesin
    public function update(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $request->validate([
            'kode_mesin' => 'required|unique:mesin_produksi,kode_mesin,' . $id,
            'nama_mesin' => 'required|string',
            'lokasi_ruang' => 'required|string',
            // PERBAIKAN: Validasi disesuaikan dengan nilai "Aktif" dan "Tidak Aktif"
            'status' => 'sometimes|string|in:Aktif,Tidak Aktif'
        ]);

        $mesin->update($request->all());

        return response()->json(['message' => 'Data mesin berhasil diperbarui', 'data' => $mesin], 200);
    }

    // Hapus data mesin
    public function destroy($id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $mesin->delete();

        return response()->json(['message' => 'Data mesin berhasil dihapus'], 200);
    }

    // ---- METHOD BARU UNTUK TOGGLE STATUS ----
    public function toggleStatus($id)
    {
        try {
            $mesin = MesinProduksi::findOrFail($id);
            
            // PERBAIKAN: Ubah menjadi Aktif / Tidak Aktif
            $mesin->status = ($mesin->status === 'Aktif') ? 'Tidak Aktif' : 'Aktif';
            $mesin->save();

            return response()->json([
                'success' => true,
                'message' => 'Status mesin berhasil diubah menjadi ' . $mesin->status,
                'data' => $mesin
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status: ' . $e->getMessage()
            ], 500);
        }
    }
}
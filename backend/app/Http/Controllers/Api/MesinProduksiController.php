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
            // Perbaikan ada di baris ini: pastikan merujuk ke tabel mesin_produksi (tanpa 's')
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
}
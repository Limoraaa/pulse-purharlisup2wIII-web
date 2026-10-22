<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Str; // tambahkan di bagian atas file
use App\Http\Controllers\Controller;
use App\Models\MesinProduksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MesinProduksiController extends Controller
{
    // Tampilkan semua data master mesin
    public function index()
    {
        $mesin = MesinProduksi::withCount(MesinProduksi::RELASI_RIWAYAT)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                // Dipakai halaman Data Mesin untuk menentukan boleh dihapus atau hanya dinonaktifkan
                $item->jumlah_riwayat = collect(MesinProduksi::RELASI_RIWAYAT)
                    ->sum(fn ($relasi) => $item->{Str::snake($relasi) . '_count'});
                return $item;
            });

        return response()->json(['message' => 'Sukses', 'data' => $mesin], 200);
    }

    // Tambah data mesin baru
    // Tambah data mesin baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_mesin' => 'required|unique:mesin_produksi,kode_mesin',
            'nama_mesin' => 'required|string',
            'lokasi_ruang' => 'required|string',
            'status' => 'sometimes|string|in:Aktif,Tidak Aktif,Maintenance,Rusak',
            'foto_katalog' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048', // Validasi foto
        ], [
            'kode_mesin.required' => 'Kode mesin wajib diisi.',
            'kode_mesin.unique'   => 'Kode mesin ":input" sudah digunakan mesin lain.',
        ]);

        $fotoKatalogUrl = null;
        if ($request->hasFile('foto_katalog')) {
            $path = $request->file('foto_katalog')->store('katalog-mesin', 'public');
            $fotoKatalogUrl = asset('storage/' . $path);
        }

        $mesin = MesinProduksi::create([
            'kode_mesin' => $validated['kode_mesin'],
            'nama_mesin' => $validated['nama_mesin'],
            'lokasi_ruang' => $validated['lokasi_ruang'],
            'status' => $validated['status'] ?? 'Aktif',
            'foto_katalog' => $fotoKatalogUrl, // Simpan ke database
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

        // Dikirim sebagai POST + _method=PUT dari frontend agar file foto ikut terbaca
        $validated = $request->validate([
            'kode_mesin' => 'required|unique:mesin_produksi,kode_mesin,' . $id,
            'nama_mesin' => 'required|string',
            'lokasi_ruang' => 'required|string',
            'status' => 'sometimes|string|in:Aktif,Tidak Aktif,Maintenance,Rusak',
            'foto_katalog' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'hapus_foto' => 'sometimes|boolean',
        ], [
            'kode_mesin.required' => 'Kode mesin wajib diisi.',
            'kode_mesin.unique'   => 'Kode mesin ":input" sudah digunakan mesin lain.',
        ]);

        $data = collect($validated)->except(['foto_katalog', 'hapus_foto'])->all();

        if ($request->hasFile('foto_katalog') || $request->boolean('hapus_foto')) {
            $this->hapusFileFoto($mesin->foto_katalog);
            $data['foto_katalog'] = $request->hasFile('foto_katalog')
                ? asset('storage/' . $request->file('foto_katalog')->store('katalog-mesin', 'public'))
                : null;
        }

        $mesin->update($data);

        return response()->json(['message' => 'Data mesin berhasil diperbarui', 'data' => $mesin], 200);
    }

    // Hapus data mesin
    public function destroy($id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        // Menghapus mesin ikut menghapus seluruh riwayatnya (cascade), jadi hanya boleh untuk mesin tanpa riwayat
        $jumlahRiwayat = $mesin->jumlahRiwayat();
        if ($jumlahRiwayat > 0) {
            return response()->json([
                'message' => "Mesin ini sudah memiliki {$jumlahRiwayat} catatan riwayat dan tidak bisa dihapus. Gunakan Nonaktifkan.",
            ], 422);
        }

        $this->hapusFileFoto($mesin->foto_katalog);
        $this->hapusFileFoto($mesin->gambar_url); // gambar peta part
        $mesin->delete();

        return response()->json(['message' => 'Data mesin berhasil dihapus'], 200);
    }

    private function hapusFileFoto(?string $url): void
    {
        // Hanya file di folder storage; gambar statis frontend tidak disentuh
        if ($url && str_contains($url, '/storage/')) {
            Storage::disk('public')->delete(MesinProduksi::kePathStorage($url));
        }
    }

    // ---- METHOD TOGGLE STATUS ----
    public function toggleStatus($id)
    {
        try {
            $mesin = MesinProduksi::findOrFail($id);

            // Nonaktifkan dari status apa pun (Aktif/Maintenance/Rusak); aktifkan kembali menjadi Aktif
            $mesin->status = ($mesin->status === 'Tidak Aktif') ? 'Aktif' : 'Tidak Aktif';
            $mesin->save();

            return response()->json([
                'success' => true,
                'message' => 'Status mesin berhasil diubah menjadi ' . $mesin->status,
                'data' => $mesin
            ], 200);
        } catch (\Exception $e) {
            Log::error('Gagal toggle status mesin_produksi', [
                'mesin_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status mesin',
            ], 500);
        }
    }

    // ---- PETA PART & CHECKLIST VISUAL ----

    // GET /mesin-produksi/{id}/part-mapping
    // Dipakai PartMappingEditor (admin) DAN PartMappingChecklistModal (teknisi).
    public function getPartMapping($id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        // URL lengkap disusun otomatis oleh model (lihat Concerns\PunyaFotoStorage)
        return response()->json([
            'gambarUrl' => $mesin->gambar_url,
            'parts' => $mesin->part_mapping ?? [],
        ]);
    }

    // PUT /mesin-produksi/{id}/part-mapping
    // Cuma admin (izin manage_pemeliharaan_mesin) yang boleh mengubah mapping.
    public function savePartMapping(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $validated = $request->validate([
            'gambarUrl' => 'nullable|string',
            'parts' => 'required|array',
            'parts.*.id' => 'required|string',
            'parts.*.partNumber' => 'required|string',
            'parts.*.partName' => 'required|string',
            'parts.*.checklistItems' => 'required|array|min:1',
            'parts.*.checklistItems.*' => 'required|string',
            'parts.*.xPercent' => 'required|numeric|min:0|max:100',
            'parts.*.yPercent' => 'required|numeric|min:0|max:100',
        ]);

        $mesin->gambar_url = $validated['gambarUrl'] ?? $mesin->gambar_url;
        $mesin->part_mapping = $validated['parts'];
        $mesin->save();

        return response()->json([
            'success' => true,
            'message' => 'Mapping part berhasil disimpan',
            'data' => [
                'gambarUrl' => $mesin->gambar_url,
                'parts' => $mesin->part_mapping,
            ],
        ], 200);
    }

    // POST /mesin-produksi/{id}/upload-gambar
    // Validasi tipe & ukuran file supaya tidak jadi celah arbitrary file upload.
    public function uploadGambar(Request $request, $id)
    {
        MesinProduksi::findOrFail($id); // pastikan mesin-nya ada sebelum terima file

        $request->validate([
            'gambar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048', // max 2MB
        ]);

        $path = $request->file('gambar')->store('mesin-produksi', 'public');
        $url = asset('storage/' . $path);

        return response()->json(['url' => $url], 201);
    }
}
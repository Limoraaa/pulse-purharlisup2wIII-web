<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Str; // tambahkan di bagian atas file
use App\Http\Controllers\Controller;
use App\Models\MesinProduksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MesinProduksiController extends Controller
{
    // Tampilkan semua data master mesin
    public function index()
    {
        $mesin = MesinProduksi::with('oli:id,kode_oli,nama_oli,satuan')
            ->withCount(MesinProduksi::RELASI_RIWAYAT)
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_mesin' => 'required|unique:mesin_produksi,kode_mesin',
            'nama_mesin' => 'required|string',
            'lokasi_ruang' => 'required|string',
            'status' => 'sometimes|string|in:Aktif,Tidak Aktif,Maintenance,Rusak',
            'oli_id' => 'nullable|integer|exists:olis,id', // oli standar mesin
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
            'oli_id' => $validated['oli_id'] ?? null,
            'foto_katalog' => $fotoKatalogUrl, // Simpan ke database
        ]);

        return response()->json(['message' => 'Mesin berhasil ditambahkan', 'data' => $mesin], 201);
    }

    // Detail satu mesin
    public function show($id)
    {
        $mesin = MesinProduksi::with('oli:id,kode_oli,nama_oli,satuan,stok')->findOrFail($id);
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
            'oli_id' => 'sometimes|nullable|integer|exists:olis,id', // oli standar mesin
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

        return response()->json(['message' => 'Data mesin berhasil diperbarui', 'data' => $mesin->load('oli:id,kode_oli,nama_oli,satuan')], 200);
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
        // Semua gambar peta part (view pertama & view lain), hanya yang ada di folder peta part
        foreach ($this->semuaPathPeta($mesin) as $path) {
            if (MesinProduksi::pathDiFolder($path, self::FOLDER_PETA)) {
                Storage::disk('public')->delete($path);
            }
        }
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

    private const FOLDER_PETA = 'mesin-produksi';

    // Semua path file gambar peta (gambar utama + semua view), dalam bentuk path relatif
    private function semuaPathPeta(MesinProduksi $mesin): array
    {
        $paths = array_map(fn ($v) => MesinProduksi::kePathStorage($v['gambarUrl'] ?? null), $this->bacaViews($mesin));
        $paths[] = $mesin->getRawOriginal('gambar_url') ?? $mesin->getAttributes()['gambar_url'] ?? null;

        return array_values(array_unique(array_filter($paths)));
    }

    // Views untuk dikirim ke frontend: path relatif diubah ke URL lengkap server yang sedang berjalan
    private function viewsDenganUrl(MesinProduksi $mesin): array
    {
        return array_map(fn ($v) => array_merge($v, ['gambarUrl' => MesinProduksi::keUrlStorage($v['gambarUrl'] ?? null)]), $this->bacaViews($mesin));
    }

    // Daftar view peta part (kolom views_peta, JSON). Kosong untuk mesin yang belum pakai multi-view.
    private function bacaViews(MesinProduksi $mesin): array
    {
        $raw = $mesin->getRawOriginal('views_peta');
        if (is_array($raw)) {
            return $raw;
        }
        $decoded = $raw ? json_decode($raw, true) : [];

        return is_array($decoded) ? $decoded : [];
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

        // views kosong untuk mesin lama: frontend otomatis membuat 1 view dari gambarUrl
        return response()->json([
            'gambarUrl' => $mesin->gambar_url,
            'views' => $this->viewsDenganUrl($mesin),
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
            'views' => 'nullable|array|max:20',
            'views.*.id' => 'required|string|max:64|distinct',
            'views.*.nama' => 'required|string|max:100',
            'views.*.gambarUrl' => 'required|string',
            // 'present' (bukan 'required'): view boleh disimpan walau belum ada part
            'parts' => 'present|array',
            'parts.*.id' => 'required|string',
            'parts.*.viewId' => 'nullable|string',
            'parts.*.partNumber' => 'required|string',
            'parts.*.partName' => 'required|string',
            'parts.*.checklistItems' => 'required|array|min:1',
            'parts.*.checklistItems.*' => 'required|string',
            'parts.*.xPercent' => 'required|numeric|min:0|max:100',
            'parts.*.yPercent' => 'required|numeric|min:0|max:100',
        ]);

        $views = array_values(array_map(fn ($v) => [
            'id' => $v['id'],
            'nama' => trim($v['nama']),
            'gambarUrl' => $v['gambarUrl'],
        ], $validated['views'] ?? []));
        $parts = $validated['parts'];

        // Nomor part unik per mesin (lintas view)
        $nomor = array_column($parts, 'partNumber');
        if (count($nomor) !== count(array_unique($nomor))) {
            throw ValidationException::withMessages([
                'parts' => 'Nomor part harus unik per mesin (lintas view).',
            ]);
        }

        // Setiap part harus menunjuk ke view yang ada
        if (!empty($views)) {
            $viewIds = array_column($views, 'id');
            foreach ($parts as $p) {
                if (!in_array($p['viewId'] ?? null, $viewIds, true)) {
                    throw ValidationException::withMessages([
                        'parts' => "Part {$p['partNumber']} tidak terhubung ke view yang valid.",
                    ]);
                }
            }
        }

        // Gambar view disimpan sebagai path relatif ("mesin-produksi/a.png") agar tetap tampil setelah
        // aplikasi pindah server/domain. File di storage hanya boleh dari folder unggahan peta part,
        // supaya alamat kiriman tidak bisa menunjuk (lalu menghapus) file lain seperti foto profil.
        $pathLama = $this->semuaPathPeta($mesin);
        foreach ($views as $i => $v) {
            $path = MesinProduksi::kePathStorage($v['gambarUrl']);
            if (MesinProduksi::adalahFileStorage($path) && ! MesinProduksi::pathDiFolder($path, self::FOLDER_PETA)
                && ! in_array($path, $pathLama, true)) {
                throw ValidationException::withMessages([
                    "views.{$i}.gambarUrl" => "Gambar view \"{$v['nama']}\" tidak valid. Unggah ulang gambarnya.",
                ]);
            }
            $views[$i]['gambarUrl'] = $path;
        }

        // gambar_url = gambar view pertama (kompatibilitas halaman/kode lain yang masih membaca 1 gambar)
        $gambarUtama = $views[0]['gambarUrl'] ?? MesinProduksi::kePathStorage($validated['gambarUrl'] ?? null);
        if ($gambarUtama !== null && MesinProduksi::adalahFileStorage($gambarUtama)
            && ! MesinProduksi::pathDiFolder($gambarUtama, self::FOLDER_PETA) && ! in_array($gambarUtama, $pathLama, true)) {
            throw ValidationException::withMessages(['gambarUrl' => 'Gambar peta tidak valid. Unggah ulang gambarnya.']);
        }
        if ($gambarUtama !== null) {
            $mesin->gambar_url = $gambarUtama;
        }

        // Hanya kolom yang dikenal yang disimpan (oli kini per mesin, bukan per part)
        $mesin->part_mapping = array_map(fn ($p) => [
            'id' => $p['id'],
            'viewId' => $p['viewId'] ?? null,
            'partNumber' => $p['partNumber'],
            'partName' => $p['partName'],
            'checklistItems' => array_values($p['checklistItems']),
            'xPercent' => $p['xPercent'],
            'yPercent' => $p['yPercent'],
        ], $parts);
        $mesin->views_peta = json_encode($views, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $mesin->save();

        // Hapus file gambar yang tidak dipakai lagi oleh view mana pun (hanya dari folder peta part)
        $pathBaru = $this->semuaPathPeta($mesin);
        foreach (array_diff($pathLama, $pathBaru) as $path) {
            if (MesinProduksi::pathDiFolder($path, self::FOLDER_PETA)) {
                Storage::disk('public')->delete($path);
            }
        }

        $views = $this->viewsDenganUrl($mesin);

        return response()->json([
            'success' => true,
            'message' => 'Mapping part berhasil disimpan',
            'data' => [
                'gambarUrl' => $mesin->gambar_url,
                'views' => $views,
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
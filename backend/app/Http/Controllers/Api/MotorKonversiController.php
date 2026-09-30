<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MotorKonversi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; 

class MotorKonversiController extends Controller
{
    // Tampilkan semua data master motor konversi
    public function index()
    {
        $motor = MotorKonversi::orderBy('created_at', 'desc')->get();
        return response()->json(['message' => 'Sukses', 'data' => $motor], 200);
    }

    // Tambah data motor konversi baru
    public function store(Request $request)
    {
        $request->validate([
            'kode_motor' => 'nullable|string', 
            'nomor_polisi' => 'required|unique:motor_konversi,nomor_polisi',
            'nama_motor' => 'required|string',
            'merek' => 'nullable|string',
            'warna' => 'required|string',
            'lokasi_penempatan' => 'required|string',
            'foto_katalog' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', 
        ]);

        $fotoPath = null;

        // Proses Upload Foto Katalog jika ada
        if ($request->hasFile('foto_katalog')) {
            $path = $request->file('foto_katalog')->store('katalog_motor', 'public');
            $fotoPath = asset('storage/' . $path);
        }

        $motor = MotorKonversi::create([
            'kode_motor' => $request->kode_motor,
            'nomor_polisi' => $request->nomor_polisi,
            'nama_motor' => $request->nama_motor,
            'merek' => $request->merek,
            'warna' => $request->warna,
            'lokasi_penempatan' => $request->lokasi_penempatan,
            'status' => $request->status ?? 'Aktif',
            'foto_katalog' => $fotoPath,
        ]);

        return response()->json(['message' => 'Motor konversi berhasil ditambahkan', 'data' => $motor], 201);
    }

    // Detail satu motor konversi
    public function show($id)
    {
        $motor = MotorKonversi::findOrFail($id);
        return response()->json(['message' => 'Sukses', 'data' => $motor], 200);
    }

    // Update data motor konversi
    public function update(Request $request, $id)
    {
        $motor = MotorKonversi::findOrFail($id);

        $request->validate([
            'kode_motor' => 'nullable|string',
            'nomor_polisi' => 'required|unique:motor_konversi,nomor_polisi,' . $id,
            'nama_motor' => 'required|string',
            'merek' => 'nullable|string',
            'warna' => 'required|string',
            'lokasi_penempatan' => 'required|string',
            'status' => 'sometimes|string|in:Aktif,Tidak Aktif,Maintenance,Rusak',
            'foto_katalog' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $dataToUpdate = $request->except(['foto_katalog']);

        if ($request->hasFile('foto_katalog')) {
            if ($motor->foto_katalog) {
                $oldPath = str_replace(asset('storage/') . '/', '', $motor->foto_katalog);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('foto_katalog')->store('katalog_motor', 'public');
            $dataToUpdate['foto_katalog'] = asset('storage/' . $path);
        }

        $motor->update($dataToUpdate);

        return response()->json(['message' => 'Data motor konversi berhasil diperbarui', 'data' => $motor], 200);
    }

    // Hapus data motor konversi
    public function destroy($id)
    {
        $motor = MotorKonversi::findOrFail($id);

        if ($motor->foto_katalog) {
            $oldPath = str_replace(asset('storage/') . '/', '', $motor->foto_katalog);
            Storage::disk('public')->delete($oldPath);
        }

        // Hapus gambar part mapping juga jika ada
        if ($motor->gambar_url) {
            $oldMappingPath = str_replace(asset('storage/') . '/', '', $motor->gambar_url);
            Storage::disk('public')->delete($oldMappingPath);
        }

        $motor->delete();

        return response()->json(['message' => 'Data motor konversi berhasil dihapus'], 200);
    }

    // ---- METHOD TOGGLE STATUS ----
    public function toggleStatus($id)
    {
        try {
            $motor = MotorKonversi::findOrFail($id);

            $motor->status = ($motor->status === 'Aktif') ? 'Tidak Aktif' : 'Aktif';
            $motor->save();

            return response()->json([
                'success' => true,
                'message' => 'Status motor konversi berhasil diubah menjadi ' . $motor->status,
                'data' => $motor
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // FUNGSI PART MAPPING & CHECKLIST VISUAL
    // ==========================================

    // Mengambil data peta komponen (GET)
    public function getPartMapping($id)
    {
        $motor = MotorKonversi::findOrFail($id);
        
        return response()->json([
            'gambarUrl' => $motor->gambar_url,
            // Decode dari JSON string ke Array, jika kosong kembalikan array kosong
            'parts' => $motor->part_mapping ? json_decode($motor->part_mapping) : []
        ], 200);
    }

    // Menyimpan data koordinat titik-titik komponen (PUT)
    public function savePartMapping(Request $request, $id)
    {
        $motor = MotorKonversi::findOrFail($id);
        
        $request->validate([
            'gambarUrl' => 'nullable|string',
            'parts' => 'nullable|array'
        ]);

        $motor->gambar_url = $request->gambarUrl;
        // Encode dari Array ke JSON string untuk disimpan di database
        $motor->part_mapping = json_encode($request->parts);
        $motor->save();

        return response()->json(['message' => 'Mapping komponen motor berhasil disimpan'], 200);
    }

    // Mengunggah gambar blueprint/background untuk mapping (POST)
    public function uploadGambar(Request $request, $id)
    {
        $motor = MotorKonversi::findOrFail($id);
        
        $request->validate([
            'gambar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // Maks 5MB
        ]);

        if ($request->hasFile('gambar')) {
            // Hapus gambar blueprint lama jika sebelumnya sudah ada
            if ($motor->gambar_url) {
                $oldPath = str_replace(asset('storage/') . '/', '', $motor->gambar_url);
                Storage::disk('public')->delete($oldPath);
            }

            // Simpan gambar baru ke folder storage/app/public/motor-mapping
            $path = $request->file('gambar')->store('motor-mapping', 'public');
            $url = asset('storage/' . $path);
            
            // Simpan URL gambar ke database
            $motor->gambar_url = $url;
            $motor->save();

            return response()->json(['url' => $url], 200);
        }

        return response()->json(['message' => 'Tidak ada file gambar yang diunggah'], 400);
    }
}
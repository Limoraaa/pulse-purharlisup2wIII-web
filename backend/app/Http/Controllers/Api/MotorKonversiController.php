<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MotorKonversi;
use Illuminate\Http\Request;

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
            'nomor_polisi' => 'required|unique:motor_konversi,nomor_polisi',
            'nama_motor' => 'required|string',
            'merek' => 'nullable|string', // Diubah jadi nullable
            'warna' => 'required|string',
            'lokasi_penempatan' => 'required|string',
        ]);

        $motor = MotorKonversi::create([
            'nomor_polisi' => $request->nomor_polisi,
            'nama_motor' => $request->nama_motor,
            'merek' => $request->merek,
            'warna' => $request->warna,
            'lokasi_penempatan' => $request->lokasi_penempatan,
            'status' => $request->status ?? 'Aktif',
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
            'nomor_polisi' => 'required|unique:motor_konversi,nomor_polisi,' . $id,
            'nama_motor' => 'required|string',
            'merek' => 'nullable|string', // Diubah jadi nullable
            'warna' => 'required|string',
            'lokasi_penempatan' => 'required|string',
            'status' => 'sometimes|string|in:Aktif,Tidak Aktif'
        ]);

        $motor->update($request->all());

        return response()->json(['message' => 'Data motor konversi berhasil diperbarui', 'data' => $motor], 200);
    }

    // Hapus data motor konversi
    public function destroy($id)
    {
        $motor = MotorKonversi::findOrFail($id);
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
}
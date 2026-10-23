<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KalibrasiMesin;
use App\Models\RencanaPemeliharaanMesin; // Pastikan import nama model Rencana Anda yang benar
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KalibrasiMesinController extends Controller
{
    // Mengambil semua data kalibrasi (untuk tabel Kalibrasi Manager)
    public function index()
    {
        $data = KalibrasiMesin::with(['mesin', 'rencana'])->latest()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'mesin_id' => $item->mesin_produksi_id,
                'rencana_id' => $item->rencana_pemeliharaan_id,
                'kode_mesin' => $item->mesin->kode_mesin ?? 'N/A',
                'nama_mesin' => $item->mesin->nama_mesin ?? 'N/A',
                'tanggal_kalibrasi' => $item->tanggal_kalibrasi,
                'tanggal_jatuh_tempo' => $item->tanggal_jatuh_tempo,
                'nomor_sertifikat' => $item->nomor_sertifikat,
                'kalibrator' => $item->kalibrator,
                'hasil_status' => $item->hasil_status,
                'file_sertifikat' => $item->file_sertifikat ? asset('storage/' . $item->file_sertifikat) : null,
                'keterangan' => $item->keterangan,
            ];
        });

        // PERBAIKAN: Format response yang benar agar terbaca oleh SWR Frontend
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // Mengambil riwayat kalibrasi khusus untuk 1 mesin tertentu
    public function getByMesin($mesin_id)
    {
        $data = KalibrasiMesin::where('mesin_produksi_id', $mesin_id)->latest()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'tanggal_kalibrasi' => $item->tanggal_kalibrasi,
                'tanggal_jatuh_tempo' => $item->tanggal_jatuh_tempo,
                'nomor_sertifikat' => $item->nomor_sertifikat,
                'kalibrator' => $item->kalibrator,
                'hasil_status' => $item->hasil_status,
                'keterangan' => $item->keterangan,
                'file_sertifikat' => $item->file_sertifikat ? asset('storage/' . $item->file_sertifikat) : null,
            ];
        });

        // PERBAIKAN: Format response yang benar agar terbaca oleh SWR Frontend
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // Menyimpan data kalibrasi baru
    public function store(Request $request)
    {
        $request->validate([
            'mesin_produksi_id' => 'required|exists:mesin_produksi,id',
            'rencana_pemeliharaan_id' => 'nullable|exists:rencana_pemeliharaan_mesin,id', // Sesuaikan nama tabel jika berbeda
            'tanggal_kalibrasi' => 'required|date',
            'tanggal_jatuh_tempo' => 'required|date|after:tanggal_kalibrasi',
            'nomor_sertifikat' => 'required|string|max:255',
            'kalibrator' => 'required|string|max:255',
            'hasil_status' => 'required|in:Lulus,Perlu Penyesuaian,Tidak Layak',
            'file_sertifikat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // Maks 5MB
        ]);

        DB::beginTransaction();
        try {
            $data = $request->except('file_sertifikat');

            // Rencana yang ditutup harus rencana KALIBRASI milik mesin yang sama dan belum selesai
            if ($request->rencana_pemeliharaan_id) {
                $rencana = RencanaPemeliharaanMesin::lockForUpdate()->find($request->rencana_pemeliharaan_id);
                $pesan = match (true) {
                    (int) $rencana->mesin_id !== (int) $request->mesin_produksi_id => 'Rencana ini bukan milik mesin yang dipilih.',
                    $rencana->aksi !== 'K' => 'Rencana ini bukan rencana kalibrasi.',
                    $rencana->status === 'Selesai' => 'Rencana ini sudah selesai dikerjakan.',
                    default => null,
                };
                if ($pesan) {
                    throw ValidationException::withMessages(['rencana_pemeliharaan_id' => $pesan]);
                }
            }

            // Handle Upload File Sertifikat
            if ($request->hasFile('file_sertifikat')) {
                $file = $request->file('file_sertifikat');
                $filename = time() . '_sertifikat_' . $request->mesin_produksi_id . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('kalibrasi_sertifikat', $filename, 'public');
                $data['file_sertifikat'] = $path;
            }

            // Simpan Data Kalibrasi
            $kalibrasi = KalibrasiMesin::create($data);

            // AUTO-SELESAI RENCANA PEMELIHARAAN
            if ($request->rencana_pemeliharaan_id) {
                RencanaPemeliharaanMesin::where('id', $request->rencana_pemeliharaan_id)->update([
                    'status' => 'Selesai' // Mengubah status menjadi selesai otomatis
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Data kalibrasi berhasil disimpan',
                'data' => $kalibrasi
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data: ' . $e->getMessage()
            ], 500);
        }
    }

    // Mengupdate data kalibrasi
    public function update(Request $request, $id)
    {
        $kalibrasi = KalibrasiMesin::findOrFail($id);

        $request->validate([
            'tanggal_kalibrasi' => 'required|date',
            'tanggal_jatuh_tempo' => 'required|date|after:tanggal_kalibrasi',
            'nomor_sertifikat' => 'required|string|max:255',
            'kalibrator' => 'required|string|max:255',
            'hasil_status' => 'required|in:Lulus,Perlu Penyesuaian,Tidak Layak',
            'keterangan' => 'nullable|string',
            'file_sertifikat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Hanya kolom di atas yang boleh diubah; mesin & rencana yang tertaut tidak bisa dipindah lewat edit
        $data = $request->only(['tanggal_kalibrasi', 'tanggal_jatuh_tempo', 'nomor_sertifikat', 'kalibrator', 'hasil_status', 'keterangan']);

        // Handle Update File Sertifikat
        if ($request->hasFile('file_sertifikat')) {
            // Hapus file lama jika ada
            if ($kalibrasi->file_sertifikat && Storage::disk('public')->exists($kalibrasi->file_sertifikat)) {
                Storage::disk('public')->delete($kalibrasi->file_sertifikat);
            }
            
            $file = $request->file('file_sertifikat');
            $filename = time() . '_sertifikat_' . $kalibrasi->mesin_produksi_id . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('kalibrasi_sertifikat', $filename, 'public');
            $data['file_sertifikat'] = $path;
        }

        $kalibrasi->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Data kalibrasi berhasil diupdate',
            'data' => $kalibrasi
        ]);
    }

    // Menghapus data kalibrasi
    public function destroy($id)
    {
        $kalibrasi = KalibrasiMesin::findOrFail($id);

        // Hapus file fisik jika ada
        if ($kalibrasi->file_sertifikat && Storage::disk('public')->exists($kalibrasi->file_sertifikat)) {
            Storage::disk('public')->delete($kalibrasi->file_sertifikat);
        }

        DB::transaction(function () use ($kalibrasi) {
            // Rencana yang ditutup oleh kalibrasi ini dibuka kembali (kecuali sudah ditutup log pemeliharaan)
            if ($kalibrasi->rencana_pemeliharaan_id) {
                RencanaPemeliharaanMesin::where('id', $kalibrasi->rencana_pemeliharaan_id)
                    ->whereDoesntHave('log')
                    ->update(['status' => 'Terjadwal']);
            }
            $kalibrasi->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Data kalibrasi berhasil dihapus'
        ]);
    }
}
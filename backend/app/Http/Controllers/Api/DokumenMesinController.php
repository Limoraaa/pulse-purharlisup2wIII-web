<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DokumenMesin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Dokumen rahasia mesin: IK Operasional & IK Pemeliharaan (1 per mesin) dan HIRARC (1 untuk semua mesin).
 * - File disimpan di disk privat (storage/app/private), tidak bisa dibuka lewat URL publik.
 * - File hanya dikirim lewat endpoint /file setelah login & hak akses dicek, dan tidak bisa diunduh dari UI.
 */
class DokumenMesinController extends Controller
{
    private const DISK = 'local';

    // Hak akses per jenis dokumen: [permission lihat (salah satu cukup), permission kelola]
    private const AKSES = [
        // process_* = level "Isi catatan" (pekerja/vendor): boleh membaca, tidak boleh mengunggah/menghapus
        'ik_operasional'  => [['view_operasional_mesin', 'process_operasional_mesin'], 'manage_operasional_mesin'],
        'ik_pemeliharaan' => [['view_pemeliharaan_mesin', 'process_pemeliharaan_mesin'], 'manage_pemeliharaan_mesin'],
        // HIRARC tampil di halaman Operasional maupun Pemeliharaan
        'hirarc'          => [['view_operasional_mesin', 'view_pemeliharaan_mesin', 'process_operasional_mesin', 'process_pemeliharaan_mesin'], 'manage_pemeliharaan_mesin'],
    ];

    // Metadata dokumen aktif untuk satu jenis (dan satu mesin, kecuali HIRARC)
    public function show(Request $request)
    {
        $validated = $request->validate([
            'jenis'    => ['required', Rule::in(array_keys(self::AKSES))],
            'mesin_id' => 'required_unless:jenis,hirarc|nullable|integer',
        ]);
        $this->pastikanAkses($request, $validated['jenis'], false);

        $dokumen = $this->cariDokumen($validated['jenis'], $validated['mesin_id'] ?? null);

        return response()->json([
            'success' => true,
            'data'    => $dokumen ? $this->format($dokumen) : null,
        ]);
    }

    // Isi file PDF, ditampilkan di viewer aplikasi (bukan untuk diunduh)
    public function file(Request $request, $id)
    {
        $dokumen = DokumenMesin::findOrFail($id);
        $this->pastikanAkses($request, $dokumen->jenis, false);

        abort_unless(Storage::disk(self::DISK)->exists($dokumen->file_path), 404, 'File dokumen tidak ditemukan.');

        return Storage::disk(self::DISK)->response($dokumen->file_path, null, [
            'Content-Type'           => 'application/pdf',
            'Content-Disposition'    => 'inline',
            'Cache-Control'          => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    // Upload dokumen baru; kalau sudah ada, dokumen lama diganti
    public function store(Request $request)
    {
        $validated = $request->validate([
            'jenis'         => ['required', Rule::in(array_keys(self::AKSES))],
            'mesin_id'      => 'required_unless:jenis,hirarc|nullable|integer|exists:mesin_produksi,id',
            'judul'         => 'required|string|max:255',
            'nomor_dokumen' => 'nullable|string|max:100',
            'revisi'        => 'nullable|string|max:50',
            'file'          => 'required|file|mimes:pdf|max:10240', // Maks 10MB
        ]);
        $this->pastikanAkses($request, $validated['jenis'], true);

        $mesinId = $validated['jenis'] === 'hirarc' ? null : $validated['mesin_id'];
        $file = $request->file('file');
        $path = $file->store('dokumen-mesin', self::DISK);

        $data = [
            'jenis'             => $validated['jenis'],
            'mesin_produksi_id' => $mesinId,
            'judul'             => $validated['judul'],
            'nomor_dokumen'     => $validated['nomor_dokumen'] ?? null,
            'revisi'            => $validated['revisi'] ?? null,
            'file_path'         => $path,
            'ukuran'            => $file->getSize(),
            'diunggah_oleh'     => $request->user()->id,
        ];

        $lama = $this->cariDokumen($validated['jenis'], $mesinId);
        if ($lama) {
            // File lama baru dihapus setelah data baru tersimpan
            $fileLama = $lama->file_path;
            $lama->update($data);
            Storage::disk(self::DISK)->delete($fileLama);
            $dokumen = $lama;
        } else {
            $dokumen = DokumenMesin::create($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil disimpan',
            'data'    => $this->format($dokumen->fresh()),
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $dokumen = DokumenMesin::findOrFail($id);
        $this->pastikanAkses($request, $dokumen->jenis, true);

        Storage::disk(self::DISK)->delete($dokumen->file_path);
        $dokumen->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil dihapus',
        ]);
    }

    private function cariDokumen(string $jenis, $mesinId): ?DokumenMesin
    {
        return DokumenMesin::with('pengunggah:id,full_name')
            ->where('jenis', $jenis)
            ->when(
                $jenis === 'hirarc',
                fn ($q) => $q->whereNull('mesin_produksi_id'),
                fn ($q) => $q->where('mesin_produksi_id', $mesinId)
            )
            ->first();
    }

    private function pastikanAkses(Request $request, string $jenis, bool $kelola): void
    {
        [$lihat, $kelolaPerm] = self::AKSES[$jenis];
        $user = $request->user();

        $boleh = $kelola
            ? $user->can($kelolaPerm)
            : collect($lihat)->contains(fn ($perm) => $user->can($perm));

        abort_unless($boleh, 403, 'Anda tidak memiliki akses ke dokumen ini.');
    }

    private function format(DokumenMesin $dokumen): array
    {
        return [
            'id'            => $dokumen->id,
            'jenis'         => $dokumen->jenis,
            'judul'         => $dokumen->judul,
            'nomor_dokumen' => $dokumen->nomor_dokumen,
            'revisi'        => $dokumen->revisi,
            'ukuran'        => $dokumen->ukuran,
            'diunggah_oleh' => $dokumen->pengunggah?->full_name,
            'diperbarui'    => $dokumen->updated_at,
        ];
    }
}

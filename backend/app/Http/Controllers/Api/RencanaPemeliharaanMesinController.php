<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KalibrasiMesin;
use App\Models\LogPemeliharaanMesin;
use App\Models\RencanaPemeliharaanMesin;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RencanaPemeliharaanMesinController extends Controller
{
    // GET /rencana-pemeliharaan?tahun=2026
    //     /rencana-pemeliharaan?mesin_id=1&status=belum   (rencana yang belum dikerjakan)
    //
    // Respons:
    //   data            : plotting rencana (sudah lewat transform())
    //   di_luar_rencana : log pemeliharaan + kalibrasi yang TIDAK terhubung ke plotting mana pun,
    //                     dipakai untuk baris Realisasi.
    public function index(Request $request): JsonResponse
    {
        $tahun   = $request->filled('tahun') ? (int) $request->tahun : null;
        $mesinId = $request->filled('mesin_id') ? (int) $request->mesin_id : null;

        $rencana = RencanaPemeliharaanMesin::with([
                'mesin:id,kode_mesin,nama_mesin',
                'log:id,rencana_id,waktu_pelaksana',
            ])
            ->when($tahun, fn ($q) => $q->where('tahun', $tahun))
            ->when($mesinId, fn ($q) => $q->where('mesin_id', $mesinId))
            ->when($request->status === 'belum', fn ($q) => $q->where('status', '!=', 'Selesai'))
            ->orderBy('tahun')->orderBy('bulan')->orderBy('minggu')
            ->get()
            ->map(fn ($r) => $this->transform($r))
            ->values();

        return response()->json([
            'success'         => true,
            'data'            => $rencana,
            'di_luar_rencana' => $this->logDiLuarRencana($tahun, $mesinId),
        ]);
    }

    // POST /rencana-pemeliharaan
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(), $this->messages());
        $this->assertUnik($data);

        $rencana = RencanaPemeliharaanMesin::create($data);

        return response()->json([
            'message' => 'Rencana pemeliharaan berhasil ditambahkan.',
            'data'    => $this->transform($rencana->load(['mesin:id,kode_mesin,nama_mesin', 'log:id,rencana_id,waktu_pelaksana'])),
        ], 201);
    }

    // PUT /rencana-pemeliharaan/{id}
    public function update(Request $request, $id): JsonResponse
    {
        $rencana = RencanaPemeliharaanMesin::findOrFail($id);
        $this->assertBelumSelesai($rencana, 'diubah');

        // Mesin tidak boleh diganti saat edit (select dikunci di frontend).
        $request->merge(['mesin_id' => $rencana->mesin_id]);

        $data = $request->validate($this->rules(), $this->messages());
        $this->assertUnik($data, $rencana->id);

        $rencana->update($data);

        return response()->json([
            'message' => 'Rencana pemeliharaan berhasil diperbarui.',
            'data'    => $this->transform($rencana->load(['mesin:id,kode_mesin,nama_mesin', 'log:id,rencana_id,waktu_pelaksana'])),
        ]);
    }

    // DELETE /rencana-pemeliharaan/{id}
    public function destroy($id): JsonResponse
    {
        $rencana = RencanaPemeliharaanMesin::findOrFail($id);
        $this->assertBelumSelesai($rencana, 'dihapus');

        $rencana->delete();

        return response()->json(['message' => 'Rencana pemeliharaan berhasil dihapus.']);
    }

    private function rules(): array
    {
        return [
            'mesin_id'   => ['required', 'exists:mesin_produksi,id'],
            'tahun'      => ['required', 'integer', 'between:2000,2100'],
            'bulan'      => ['required', 'integer', 'between:1,12'],
            'minggu'     => ['required', 'integer', 'between:1,4'],
            'aksi'       => ['required', Rule::in(['C', 'L', 'P', 'M'])],
            'rab'        => ['sometimes', 'nullable', 'integer', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ];
    }

    // Status "Selesai" diatur otomatis oleh LogPemeliharaanMesinController,
    // jadi rencana yang sudah selesai tidak boleh diubah/dihapus dari sini.
    private function assertBelumSelesai(RencanaPemeliharaanMesin $rencana, string $aksi): void
    {
        if ($rencana->status === 'Selesai') {
            throw ValidationException::withMessages([
                'status' => "Rencana yang sudah selesai tidak dapat {$aksi}. Hapus log pemeliharaannya terlebih dahulu jika ingin membuka kembali.",
            ]);
        }
    }

    // Satu mesin tidak boleh punya tindakan yang sama di minggu yang sama.
    private function assertUnik(array $data, ?int $ignoreId = null): void
    {
        $exists = RencanaPemeliharaanMesin::query()
            ->where('mesin_id', $data['mesin_id'])
            ->where('tahun', $data['tahun'])
            ->where('bulan', $data['bulan'])
            ->where('minggu', $data['minggu'])
            ->where('aksi', $data['aksi'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'aksi' => 'Mesin ini sudah punya tindakan yang sama di minggu tersebut.',
            ]);
        }
    }

    private function messages(): array
    {
        return [
            'mesin_id.required' => 'Mesin wajib dipilih.',
            'mesin_id.exists'   => 'Mesin tidak ditemukan.',
            'minggu.between'    => 'Minggu harus antara 1 sampai 4.',
        ];
    }

    // Log pemeliharaan yang tidak menyelesaikan plotting mana pun (rencana_id kosong),
    // ditambah kalibrasi yang tidak terhubung ke rencana.
    // Dipakai untuk menggambar pekerjaan di luar rencana pada baris Realisasi.
    private function logDiLuarRencana(?int $tahun, $mesinId): array
    {
        $logs = LogPemeliharaanMesin::query()
            ->whereNull('rencana_id')
            ->when($tahun, fn ($q) => $q->whereYear('waktu_pelaksana', $tahun))
            ->when($mesinId, fn ($q) => $q->where('mesin_produksi_id', $mesinId))
            ->orderBy('waktu_pelaksana')
            ->get(['id', 'mesin_produksi_id', 'aksi', 'uraian_pemeliharaan', 'waktu_pelaksana'])
            ->map(function ($log) {
                $dt = Carbon::parse($log->waktu_pelaksana);
                return [
                    'id'                  => $log->id,
                    'mesin_id'            => $log->mesin_produksi_id,
                    'aksi'                => $log->aksi ?? 'M',
                    'uraian_pemeliharaan' => $log->uraian_pemeliharaan,
                    'tanggal'             => $log->waktu_pelaksana,
                    'tahun'               => (int) $dt->year,
                    'bulan'               => (int) $dt->month,
                    'minggu'              => min(4, max(1, (int) ceil($dt->day / 7))),
                ];
            })
            ->all();

        return array_merge($logs, $this->kalibrasiDiLuarRencana($tahun, $mesinId));
    }

    // Kalibrasi ditampilkan sebagai badge "K" di baris Realisasi.
    // - Nama kolom dideteksi otomatis (mesin_produksi_id / mesin_id, nomor_sertifikat / no_sertifikat).
    // - Kalibrasi yang sudah terhubung ke rencana TIDAK ikut (rencananya sendiri yang tampil hijau),
    //   supaya tidak muncul dobel.
    // - Error tidak ditelan diam-diam: dicatat di storage/logs/laravel.log.
    private function kalibrasiDiLuarRencana(?int $tahun, $mesinId): array
    {
        try {
            $tabel = (new KalibrasiMesin())->getTable();

            $kolomMesin = Schema::hasColumn($tabel, 'mesin_produksi_id') ? 'mesin_produksi_id' : 'mesin_id';
            $kolomSertifikat = Schema::hasColumn($tabel, 'nomor_sertifikat') ? 'nomor_sertifikat' : 'no_sertifikat';
            $kolomRencana = collect(['rencana_pemeliharaan_id', 'rencana_id'])
                ->first(fn ($c) => Schema::hasColumn($tabel, $c));

            return KalibrasiMesin::query()
                ->when($kolomRencana, fn ($q) => $q->whereNull($kolomRencana))
                ->when($tahun, fn ($q) => $q->whereYear('tanggal_kalibrasi', $tahun))
                ->when($mesinId, fn ($q) => $q->where($kolomMesin, $mesinId))
                ->orderBy('tanggal_kalibrasi')
                ->get()
                ->map(function ($k) use ($kolomMesin, $kolomSertifikat) {
                    $dt = Carbon::parse($k->tanggal_kalibrasi);
                    return [
                        'id'                  => 'K-' . $k->id, // string agar tidak bentrok dengan id log biasa
                        'mesin_id'            => $k->{$kolomMesin},
                        'aksi'                => 'K',
                        'uraian_pemeliharaan' => 'Kalibrasi. No Sertifikat: ' . ($k->{$kolomSertifikat} ?? '-'),
                        'tanggal'             => $k->tanggal_kalibrasi,
                        'tahun'               => (int) $dt->year,
                        'bulan'               => (int) $dt->month,
                        'minggu'              => min(4, max(1, (int) ceil($dt->day / 7))),
                    ];
                })
                ->all();
        } catch (\Throwable $e) {
            Log::warning('Gagal memuat kalibrasi untuk matrix rencana pemeliharaan', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function transform(RencanaPemeliharaanMesin $r): array
    {
        $waktuPelaksana  = $r->log->waktu_pelaksana ?? null;
        $tahunRealisasi  = null;
        $bulanRealisasi  = null;
        $mingguRealisasi = null;

        if ($r->status === 'Selesai') {
            if ($waktuPelaksana) {
                $dt = Carbon::parse($waktuPelaksana);
                $tahunRealisasi  = (int) $dt->year;
                $bulanRealisasi  = (int) $dt->month;
                $mingguRealisasi = min(4, max(1, (int) ceil($dt->day / 7)));
            } else {
                $tahunRealisasi  = $r->tahun;
                $bulanRealisasi  = $r->bulan;
                $mingguRealisasi = $r->minggu;
            }
        }

        return [
            'id'               => $r->id,
            'mesin_id'         => $r->mesin_id,
            'kode_mesin'       => $r->mesin->kode_mesin ?? null,
            'nama_mesin'       => $r->mesin->nama_mesin ?? null,
            'tahun'            => $r->tahun,
            'bulan'            => $r->bulan,
            'minggu'           => $r->minggu,
            'aksi'             => $r->aksi,
            'status'           => $r->status,
            'rab'              => $r->rab,
            'keterangan'       => $r->keterangan,
            'log_id'           => $r->log->id ?? null,
            'tanggal_selesai'  => $waktuPelaksana,
            'tahun_realisasi'  => $tahunRealisasi,
            'bulan_realisasi'  => $bulanRealisasi,
            'minggu_realisasi' => $mingguRealisasi,
            'jenis_pelaksana'  => $r->jenis_pelaksana,
            'nama_vendor'      => $r->nama_vendor,
            'no_po'            => $r->no_po,
            'biaya_aktual'     => $r->biaya_aktual,
        ];
    }
}
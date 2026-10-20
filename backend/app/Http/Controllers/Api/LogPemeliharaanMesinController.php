<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KalibrasiMesin;
use App\Models\LogAktivitasMesin;
use App\Models\LogPemeliharaanMesin;
use App\Models\MesinProduksi;
use App\Models\RencanaPemeliharaanMesin;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LogPemeliharaanMesinController extends Controller
{
    private const STATUS_SELESAI = 'Selesai';
    private const STATUS_BELUM = 'Terjadwal';

    private const AKSI = ['C', 'L', 'P', 'M'];

    private const LOOKAHEAD_MINGGU = 4;

    public function index()
    {
        $logs = LogPemeliharaanMesin::orderBy('waktu_pelaksana', 'desc')->get()->map(function ($item) {
            $mesin = MesinProduksi::find($item->mesin_produksi_id);
            return [
                'id' => $item->id,
                'kode_mesin' => $mesin ? $mesin->kode_mesin : '-',
                'nama_mesin' => $mesin ? $mesin->nama_mesin : '-',
                'aksi' => $item->aksi,
                'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
                'waktu_pelaksana' => $item->waktu_pelaksana,
                'keterangan' => $item->keterangan,
                'paraf' => $item->paraf,
                'status' => $item->status,
                'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
                'jumlah_part_total' => $item->jumlah_part_total,
            ];
        });

        return response()->json(['data' => $logs], 200);
    }

    public function getDashboardStats()
    {
        try {
            // Mesin nonaktif (pensiun) tidak dihitung sebagai mesin terdaftar
            $totalMesin = MesinProduksi::where('status', '!=', 'Tidak Aktif')->count();
            $mesinPerbaikan = MesinProduksi::whereIn('status', ['Maintenance', 'Rusak'])->count();
            $totalLogPemeliharaan = LogPemeliharaanMesin::count();
            $totalLogAktivitas = LogAktivitasMesin::count();

            $hari = min(max((int) request('hari', 30), 1), 365);
            $mulai = now()->subDays($hari - 1)->startOfDay();

            // Tren harian log pemeliharaan & log aktivitas (alias "tgl" agar tidak bentrok dengan kolom "tanggal")
            $perHariPemeliharaan = LogPemeliharaanMesin::where('waktu_pelaksana', '>=', $mulai)
                ->selectRaw('DATE(waktu_pelaksana) as tgl, COUNT(*) as total')
                ->groupBy('tgl')
                ->pluck('total', 'tgl');
            $perHariAktivitas = LogAktivitasMesin::where('tanggal', '>=', $mulai->toDateString())
                ->selectRaw('DATE(tanggal) as tgl, COUNT(*) as total')
                ->groupBy('tgl')
                ->pluck('total', 'tgl');

            $tren = collect(range(0, $hari - 1))->map(function ($i) use ($mulai, $perHariPemeliharaan, $perHariAktivitas) {
                $tgl = $mulai->copy()->addDays($i)->toDateString();
                $pemeliharaan = (int) ($perHariPemeliharaan[$tgl] ?? 0);
                $aktivitas = (int) ($perHariAktivitas[$tgl] ?? 0);
                return ['tanggal' => $tgl, 'pemeliharaan' => $pemeliharaan, 'aktivitas' => $aktivitas, 'total' => $pemeliharaan + $aktivitas];
            });

            // Log terbaru: gabungan log pemeliharaan & log aktivitas, urut paling baru
            $logPemeliharaan = LogPemeliharaanMesin::with('mesinProduksi:id,nama_mesin')
                ->orderBy('waktu_pelaksana', 'desc')
                ->take(8)
                ->get()
                ->map(fn ($item) => [
                    'id' => 'pemeliharaan-' . $item->id,
                    'jenis' => 'pemeliharaan',
                    'nama_mesin' => $item->mesinProduksi?->nama_mesin ?? 'Mesin #' . $item->mesin_produksi_id,
                    'deskripsi' => $item->uraian_pemeliharaan,
                    'tanggal' => $item->waktu_pelaksana ? Carbon::parse($item->waktu_pelaksana)->toIso8601String() : null,
                    'status' => $item->status,
                ]);
            $logAktivitas = LogAktivitasMesin::with('mesinProduksi:id,nama_mesin')
                ->orderBy('tanggal', 'desc')
                ->orderBy('waktu_mulai', 'desc')
                ->take(8)
                ->get()
                ->map(fn ($item) => [
                    'id' => 'aktivitas-' . $item->id,
                    'jenis' => 'aktivitas',
                    'nama_mesin' => $item->mesinProduksi?->nama_mesin ?? 'Mesin #' . $item->mesin_produksi_id,
                    'deskripsi' => $item->uraian_pekerjaan,
                    'tanggal' => Carbon::parse(Carbon::parse($item->tanggal)->toDateString() . ' ' . $item->waktu_mulai)->toIso8601String(),
                    'status' => null,
                ]);
            $aktivitasTerbaru = $logPemeliharaan->concat($logAktivitas)
                ->sortByDesc('tanggal')
                ->take(8)
                ->values();

            // Reminder kalibrasi: kalibrasi terakhir tiap mesin aktif yang jatuh temponya sudah lewat / <= 30 hari lagi
            $hariIni = now()->startOfDay();
            $batas = now()->addDays(30)->endOfDay();
            $kalibrasiMendekat = KalibrasiMesin::with('mesin:id,kode_mesin,nama_mesin,status')
                ->orderBy('tanggal_kalibrasi', 'desc')
                ->orderBy('id', 'desc')
                ->get()
                ->unique('mesin_produksi_id')
                ->filter(fn ($k) => $k->mesin && $k->mesin->status !== 'Tidak Aktif'
                    && Carbon::parse($k->tanggal_jatuh_tempo)->lte($batas))
                ->sortBy('tanggal_jatuh_tempo')
                ->map(fn ($k) => [
                    'id' => $k->id,
                    'mesin_id' => $k->mesin_produksi_id,
                    'kode_mesin' => $k->mesin->kode_mesin,
                    'nama_mesin' => $k->mesin->nama_mesin,
                    'jatuh_tempo' => Carbon::parse($k->tanggal_jatuh_tempo)->toDateString(),
                    'status' => Carbon::parse($k->tanggal_jatuh_tempo)->lt($hariIni) ? 'terlewat' : 'mendekat',
                ])
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_mesin' => $totalMesin,
                    'mesin_perbaikan' => $mesinPerbaikan,
                    'pemeliharaan_rutin' => $totalLogPemeliharaan,
                    'total_log_aktivitas' => $totalLogAktivitas,
                    'aktivitas_terbaru' => $aktivitasTerbaru,
                    'kalibrasi_mendekat' => $kalibrasiMendekat,
                    'tren' => $tren,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal memuat statistik dashboard pemeliharaan', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat statistik pemeliharaan'
            ], 500);
        }
    }

    public function getByMesin($mesin_id)
    {
        $logs = LogPemeliharaanMesin::where('mesin_produksi_id', $mesin_id)
                ->orderBy('waktu_pelaksana', 'desc')
                ->orderBy('id', 'desc')
                ->get();

        return response()->json(['message' => 'Sukses', 'data' => $logs], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_produksi_id' => 'required|exists:mesin_produksi,id',
            'waktu_pelaksana' => 'required|date',
            'paraf' => 'required|string',
            'rencana_id' => 'nullable|integer|exists:rencana_pemeliharaan_mesin,id',
            // AKSI WAJIB DIPILIH AGAR TIDAK MUNCUL TANDA TANYA (?)
            'aksi' => ['required', Rule::in(self::AKSI)],
            'uraian_pemeliharaan' => 'required_without:hasil_checklist|nullable|string',
            'keterangan' => 'nullable|string',
            'hasil_checklist' => 'required_without:uraian_pemeliharaan|nullable|array|min:1',
            'hasil_checklist.*.partId' => 'required|string',
            'hasil_checklist.*.partName' => 'required|string',
            'hasil_checklist.*.items' => 'required|array|min:1',
            'hasil_checklist.*.items.*.item' => 'required|string',
            'hasil_checklist.*.items.*.status' => 'required|in:baik,perlu_perhatian,rusak',
            'hasil_checklist.*.catatan' => 'nullable|string',
            'jumlah_part_total' => 'nullable|integer|min:0',
        ]);

        $data = [
            'mesin_produksi_id' => $validated['mesin_produksi_id'],
            'waktu_pelaksana' => $validated['waktu_pelaksana'],
            'paraf' => $validated['paraf'],
            'aksi' => $validated['aksi'],
        ];

        if (!empty($validated['hasil_checklist'])) {
            $hasil = $validated['hasil_checklist'];
            [$status] = $this->ringkasHasil($hasil);

            $diperiksa = count($hasil);
            $total = max($validated['jumlah_part_total'] ?? $diperiksa, $diperiksa);

            $data += [
                'uraian_pemeliharaan' => "Pemeliharaan preventif ({$diperiksa} dari {$total} part): "
                    . implode(', ', array_column($hasil, 'partName')),
                'keterangan' => $this->susunKeterangan($hasil),
                'hasil_checklist' => $hasil,
                'status' => $status,
                'jumlah_part_diperiksa' => $diperiksa,
                'jumlah_part_total' => $total,
            ];
        } else {
            $data += [
                'uraian_pemeliharaan' => $validated['uraian_pemeliharaan'],
                'keterangan' => $validated['keterangan'] ?? '',
            ];
        }

        $log = DB::transaction(function () use ($data, $validated) {
            if (!empty($validated['rencana_id'])) {
                $rencana = RencanaPemeliharaanMesin::lockForUpdate()->findOrFail($validated['rencana_id']);

                if ((int) $rencana->mesin_id !== (int) $validated['mesin_produksi_id']) {
                    throw ValidationException::withMessages([
                        'rencana_id' => 'Rencana ini bukan milik mesin yang dipilih.',
                    ]);
                }

                if ($rencana->status === self::STATUS_SELESAI) {
                    throw ValidationException::withMessages([
                        'rencana_id' => 'Rencana ini sudah selesai dikerjakan.',
                    ]);
                }

                if ($validated['aksi'] !== $rencana->aksi) {
                    throw ValidationException::withMessages([
                        'aksi' => 'Tindakan tidak sama dengan tindakan pada rencana.',
                    ]);
                }

                $log = LogPemeliharaanMesin::create(
                    $data + ['rencana_id' => $rencana->id, 'aksi' => $rencana->aksi]
                );
                $rencana->update(['status' => self::STATUS_SELESAI]);

                return $log;
            }

            $aksi = $validated['aksi'];
            $rencana = $this->cariRencanaCocok($data['mesin_produksi_id'], $aksi, $data['waktu_pelaksana']);

            $log = LogPemeliharaanMesin::create(
                $data + ['aksi' => $aksi, 'rencana_id' => $rencana?->id]
            );

            if ($rencana) {
                $rencana->update(['status' => self::STATUS_SELESAI]);
            }

            return $log;
        });

        return response()->json(['message' => 'Kegiatan pemeliharaan berhasil dicatat', 'data' => $log], 201);
    }

    public function update(Request $request, $id)
    {
        $log = LogPemeliharaanMesin::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        $request->validate([
            'uraian_pemeliharaan' => 'required|string',
            'waktu_pelaksana' => 'required|date',
            'keterangan' => 'nullable|string',
            'paraf' => 'required|string',
        ]);

        $log->update([
            'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
            'waktu_pelaksana' => $request->waktu_pelaksana,
            'keterangan' => $request->keterangan ?? '',
            'paraf' => $request->paraf,
        ]);

        return response()->json(['message' => 'Log pemeliharaan berhasil diperbarui', 'data' => $log], 200);
    }

    public function destroy($id)
    {
        $log = LogPemeliharaanMesin::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($log) {
            if ($log->rencana_id) {
                RencanaPemeliharaanMesin::where('id', $log->rencana_id)
                    ->update(['status' => self::STATUS_BELUM]);
            }

            $log->delete();
        });

        return response()->json(['message' => 'Log pemeliharaan berhasil dihapus'], 200);
    }

    private function susunKeterangan(array $hasil): string
    {
        $label = ['baik' => 'Baik', 'perlu_perhatian' => 'Perlu perhatian', 'rusak' => 'Rusak'];
        $baris = [];

        foreach ($hasil as $part) {
            $items = array_map(
                fn ($it) => "{$it['item']} ({$label[$it['status']]})",
                $part['items']
            );
            $baris[] = "{$part['partName']}: " . implode('; ', $items);

            if (!empty($part['catatan'])) {
                $baris[] = "Catatan {$part['partName']}: {$part['catatan']}";
            }
        }

        return implode(' | ', $baris);
    }

    private function ringkasHasil(array $hasil): array
    {
        $urutan = ['baik' => 0, 'perlu_perhatian' => 1, 'rusak' => 2];
        $label = ['perlu_perhatian' => 'Perlu perhatian', 'rusak' => 'Rusak'];

        $terburuk = 'baik';
        $temuan = [];

        foreach ($hasil as $part) {
            foreach ($part['items'] as $it) {
                if ($urutan[$it['status']] > $urutan[$terburuk]) {
                    $terburuk = $it['status'];
                }
                if ($it['status'] !== 'baik') {
                    $temuan[] = "{$part['partName']} - {$it['item']}: {$label[$it['status']]}";
                }
            }
            if (!empty($part['catatan'])) {
                $temuan[] = "Catatan {$part['partName']}: {$part['catatan']}";
            }
        }

        return [$terburuk, $temuan];
    }

    private function slot(int $tahun, int $bulan, int $minggu): int
    {
        return $tahun * 48 + ($bulan - 1) * 4 + ($minggu - 1);
    }

    private function cariRencanaCocok($mesinId, string $aksi, $waktuPelaksana): ?RencanaPemeliharaanMesin
    {
        $dt = Carbon::parse($waktuPelaksana);
        $slotLog = $this->slot($dt->year, $dt->month, min(4, max(1, (int) ceil($dt->day / 7))));

        $kandidat = RencanaPemeliharaanMesin::where('mesin_id', $mesinId)
            ->where('aksi', $aksi)
            ->where('status', '!=', self::STATUS_SELESAI)
            ->orderBy('tahun')->orderBy('bulan')->orderBy('minggu')
            ->lockForUpdate()
            ->get();

        $jatuhTempo = $kandidat->first(
            fn ($r) => $this->slot($r->tahun, $r->bulan, $r->minggu) <= $slotLog
        );
        if ($jatuhTempo) {
            return $jatuhTempo;
        }

        return $kandidat->first(
            fn ($r) => $this->slot($r->tahun, $r->bulan, $r->minggu) - $slotLog <= self::LOOKAHEAD_MINGGU
        );
    }
}
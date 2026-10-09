<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogPemeliharaanMesin;
use App\Models\MesinProduksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogPemeliharaanMesinController extends Controller
{
    // Mengambil SEMUA log pemeliharaan dari semua mesin
    public function index()
    {
        $logs = LogPemeliharaanMesin::orderBy('waktu_pelaksana', 'desc')->get()->map(function ($item) {
            $mesin = MesinProduksi::find($item->mesin_produksi_id);
            return [
                'id' => $item->id,
                'kode_mesin' => $mesin ? $mesin->kode_mesin : '-',
                'nama_mesin' => $mesin ? $mesin->nama_mesin : '-',
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

    // Method untuk statistik dashboard pemeliharaan terpisah
    public function getDashboardStats()
    {
        try {
            $totalMesin = MesinProduksi::count();
            $totalLogPemeliharaan = LogPemeliharaanMesin::count();
            $mesinPerbaikan = MesinProduksi::where('status', 'Maintenance')->count();

            // Tren aktivitas: jumlah log per hari, default 30 hari terakhir
            $hari = min(max((int) request('hari', 30), 1), 365);
            $mulai = now()->subDays($hari - 1)->startOfDay();

            $perHari = LogPemeliharaanMesin::where('waktu_pelaksana', '>=', $mulai)
                ->selectRaw('DATE(waktu_pelaksana) as tanggal, COUNT(*) as total')
                ->groupBy('tanggal')
                ->pluck('total', 'tanggal');

            // Hari tanpa log tetap ditampilkan dengan nilai 0
            $tren = collect(range(0, $hari - 1))->map(function ($i) use ($mulai, $perHari) {
                $tgl = $mulai->copy()->addDays($i)->toDateString();
                return ['tanggal' => $tgl, 'total' => (int) ($perHari[$tgl] ?? 0)];
            });

            // Mengambil 5 aktivitas pemeliharaan terbaru berdasarkan waktu pelaksana
            $aktivitasTerbaru = LogPemeliharaanMesin::orderBy('waktu_pelaksana', 'desc')
                ->take(5)
                ->get()
                ->map(function ($item) {
                    // Cari data mesin secara manual berdasarkan foreign key untuk mencegah error relasi
                    $mesin = MesinProduksi::find($item->mesin_produksi_id);

                    return [
                        'id' => $item->id,
                        'nama_mesin' => $mesin ? $mesin->nama_mesin : 'Mesin #' . $item->mesin_produksi_id,
                        'deskripsi' => $item->uraian_pemeliharaan,
                        'tanggal' => $item->waktu_pelaksana,
                        'status' => $item->status,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_mesin' => $totalMesin,
                    'mesin_perbaikan' => $mesinPerbaikan,
                    'pemeliharaan_rutin' => $totalLogPemeliharaan,
                    'aktivitas_terbaru' => $aktivitasTerbaru,
                    'tren' => $tren,
                ]
            ]);
        } catch (\Exception $e) {
            // Detail error dicatat di log server, tidak dikirim ke client.
            Log::error('Gagal memuat statistik dashboard pemeliharaan', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat statistik pemeliharaan'
            ], 500);
        }
    }

    // Mengambil log berdasarkan ID Mesin (Untuk tabel riwayat di Frontend)
    public function getByMesin($mesin_id)
    {
        $logs = LogPemeliharaanMesin::where('mesin_produksi_id', $mesin_id)
                ->orderBy('waktu_pelaksana', 'desc')
                ->orderBy('id', 'desc')
                ->get();

        return response()->json(['message' => 'Sukses', 'data' => $logs], 200);
    }

    // Tambah SATU KEGIATAN pemeliharaan.
    // Mode baru  : kirim hasil_checklist (banyak part) -> uraian, keterangan, status
    //              dihitung server, jadi tidak bisa dimanipulasi dari client.
    // Mode lama  : kirim uraian_pemeliharaan (+ keterangan) seperti sebelumnya.
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_produksi_id' => 'required|exists:mesin_produksi,id',
            'waktu_pelaksana' => 'required|date',
            'paraf' => 'required|string', // Diisi nama user login/teknisi

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

        $log = LogPemeliharaanMesin::create($data);

        return response()->json(['message' => 'Kegiatan pemeliharaan berhasil dicatat', 'data' => $log], 201);
    }

    // Memperbarui log pemeliharaan berdasarkan ID
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

    // Menghapus log pemeliharaan berdasarkan ID
    public function destroy($id)
    {
        $log = LogPemeliharaanMesin::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        $log->delete();

        return response()->json(['message' => 'Log pemeliharaan berhasil dihapus'], 200);
    }

    // Keterangan lengkap untuk Kartu Gantung dalam SATU baris teks: tiap part berisi semua
    // item beserta statusnya, antar part dipisah " | ", catatan temuan menyusul setelah part-nya.
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

    // Status terburuk dari semua item + daftar temuan (item yang bukan "baik" & catatan).
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
}

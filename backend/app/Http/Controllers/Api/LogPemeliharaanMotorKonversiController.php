<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogPemeliharaanMotorKonversi;
use App\Models\MotorKonversi;
use Illuminate\Http\Request;

class LogPemeliharaanMotorKonversiController extends Controller
{
    // Mengambil SEMUA log pemeliharaan dari semua motor konversi
    public function index()
    {
        $logs = LogPemeliharaanMotorKonversi::orderBy('waktu_pelaksana', 'desc')->get()->map(function ($item) {
            $motor = MotorKonversi::find($item->motor_konversi_id);
            return [
                'id' => $item->id,
                'motor_konversi_id' => $item->motor_konversi_id,
                'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
                'nama_motor' => $motor ? $motor->nama_motor : '-',
                'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
                'waktu_pelaksana' => $item->waktu_pelaksana,
                'keterangan' => $item->keterangan,
                'paraf' => $item->paraf,
                // Tambahan field untuk Checklist Visual & Peta Part
                'status' => $item->status,
                'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
                'jumlah_part_total' => $item->jumlah_part_total,
            ];
        });

        return response()->json(['data' => $logs], 200);
    }

    public function show($id)
    {
        // Cari log berdasarkan id
        $item = LogPemeliharaanMotorKonversi::find($id);

        if (!$item) {
            return response()->json([
                'message' => 'Data log pemeliharaan motor konversi tidak ditemukan'
            ], 404);
        }

        $motor = MotorKonversi::find($item->motor_konversi_id);

        $logFormatted = [
            'id' => $item->id,
            'motor_konversi_id' => $item->motor_konversi_id,
            'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
            'nama_motor' => $motor ? $motor->nama_motor : '-',
            'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
            'waktu_pelaksana' => $item->waktu_pelaksana,
            'keterangan' => $item->keterangan,
            'paraf' => $item->paraf,
            // Tambahan field untuk Checklist Visual
            'status' => $item->status,
            'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
            'jumlah_part_total' => $item->jumlah_part_total,
        ];

        return response()->json([
            'success' => true,
            'data' => $logFormatted
        ], 200);
    }

    // Method untuk statistik dashboard pemeliharaan terpisah
    public function getDashboardStats()
    {
        try {
            $totalMotor = MotorKonversi::count();
            $totalLogPemeliharaan = LogPemeliharaanMotorKonversi::count();
            $motorPerbaikan = MotorKonversi::where('status', 'Maintenance')->count();

            // Tren aktivitas: jumlah log per hari, default 30 hari terakhir
            $hari = min(max((int) request('hari', 30), 1), 365);
            $mulai = now(config('app.timezone_lokal'))->subDays($hari - 1)->startOfDay();

            $perHari = LogPemeliharaanMotorKonversi::where('waktu_pelaksana', '>=', $mulai)
                ->selectRaw('DATE(waktu_pelaksana) as tanggal, COUNT(*) as total')
                ->groupBy('tanggal')
                ->pluck('total', 'tanggal');

            // Hari tanpa log tetap ditampilkan dengan nilai 0
            $tren = collect(range(0, $hari - 1))->map(function ($i) use ($mulai, $perHari) {
                $tgl = $mulai->copy()->addDays($i)->toDateString();
                return ['tanggal' => $tgl, 'total' => (int) ($perHari[$tgl] ?? 0)];
            });

            // Mengambil 5 aktivitas pemeliharaan terbaru berdasarkan waktu pelaksana
            $aktivitasTerbaru = LogPemeliharaanMotorKonversi::orderBy('waktu_pelaksana', 'desc')
                ->take(5)
                ->get()
                ->map(function ($item) {
                    $motor = MotorKonversi::find($item->motor_konversi_id);

                    return [
                        'id' => $item->id,
                        'nama_motor' => $motor ? $motor->nama_motor : 'Motor #' . $item->motor_konversi_id,
                        'deskripsi' => $item->uraian_pemeliharaan,
                        'tanggal' => $item->waktu_pelaksana,
                        'status' => $item->status,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_motor' => $totalMotor,
                    'motor_perbaikan' => $motorPerbaikan,
                    'pemeliharaan_rutin' => $totalLogPemeliharaan,
                    'aktivitas_terbaru' => $aktivitasTerbaru,
                    'tren' => $tren,
                ]
            ]);
        } catch (\Exception $e) {
            report($e); // detail error masuk log server, tidak dikirim ke pengguna
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi Admin.'
            ], 500);
        }
    }

    // Mengambil log berdasarkan ID Motor Konversi (Untuk Tab Log Pemeliharaan di Frontend)
    public function getByMotor($motor_id)
    {
        try {
            $logs = LogPemeliharaanMotorKonversi::where('motor_konversi_id', $motor_id)
                ->orderBy('waktu_pelaksana', 'desc')
                ->get()
                ->map(function ($item) {
                    $motor = MotorKonversi::find($item->motor_konversi_id);
                    return [
                        'id' => $item->id,
                        'motor_konversi_id' => $item->motor_konversi_id,
                        'nomor_polisi' => $motor ? $motor->nomor_polisi : '-',
                        'nama_motor' => $motor ? $motor->nama_motor : '-',
                        'uraian_pemeliharaan' => $item->uraian_pemeliharaan,
                        'waktu_pelaksana' => $item->waktu_pelaksana,
                        'keterangan' => $item->keterangan,
                        'paraf' => $item->paraf,
                        // Field wajib untuk Checklist Visual
                        'status' => $item->status,
                        'jumlah_part_diperiksa' => $item->jumlah_part_diperiksa,
                        'jumlah_part_total' => $item->jumlah_part_total,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Sukses mengambil log',
                'data' => $logs
            ], 200);

        } catch (\Exception $e) {
            report($e); // detail error masuk log server, tidak dikirim ke pengguna
            // Menghindari CORS Error dengan mengembalikan JSON Error 500
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memuat log. Silakan coba lagi atau hubungi Admin.',
                'data' => []
            ], 500);
        }
    }

    // Tambah log pemeliharaan baru dari form manual atau Checklist Visual
    public function store(Request $request)
    {
        $validated = $request->validate([
            'motor_konversi_id' => 'required|exists:motor_konversi,id',
            'waktu_pelaksana' => 'required|date',
            'paraf' => 'required|string',

            'uraian_pemeliharaan' => 'required_without:hasil_checklist|nullable|string',
            'keterangan' => 'nullable|string',

            'hasil_checklist' => 'required_without:uraian_pemeliharaan|nullable|array|min:1',
            'hasil_checklist.*.partId' => 'required|string',
            'hasil_checklist.*.partName' => 'required|string',
            'hasil_checklist.*.items' => 'required|array|min:1',
            'hasil_checklist.*.items.*.item' => 'required|string',
            'hasil_checklist.*.items.*.status' => 'required|in:baik,perlu_perhatian,rusak',
            'hasil_checklist.*.items.*.catatan' => 'nullable|string',
            'hasil_checklist.*.catatan' => 'nullable|string',
            'jumlah_part_total' => 'nullable|integer|min:0',
        ]);

        $data = [
            'motor_konversi_id' => $validated['motor_konversi_id'],
            'waktu_pelaksana' => $validated['waktu_pelaksana'],
            'paraf' => $validated['paraf'],
        ];

        if (!empty($validated['hasil_checklist'])) {
            $hasil = $validated['hasil_checklist'];
            $diperiksa = count($hasil);
            $total = max($validated['jumlah_part_total'] ?? $diperiksa, $diperiksa);

            $data += [
                'uraian_pemeliharaan' => "Pemeliharaan preventif ({$diperiksa} dari {$total} part): "
                    . implode(', ', array_column($hasil, 'partName')),
                'keterangan' => $this->susunKeterangan($hasil),
                'hasil_checklist' => $hasil,
                'status' => $this->statusTerburuk($hasil),
                'jumlah_part_diperiksa' => $diperiksa,
                'jumlah_part_total' => $total,
            ];
        } else {
            $data += [
                'uraian_pemeliharaan' => $validated['uraian_pemeliharaan'],
                'keterangan' => $validated['keterangan'] ?? '',
            ];
        }

        try {
            $log = LogPemeliharaanMotorKonversi::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Log pemeliharaan berhasil dicatat',
                'data' => $log
            ], 201);
        } catch (\Exception $e) {
            report($e); // detail error masuk log server, tidak dikirim ke pengguna
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan log. Silakan coba lagi atau hubungi Admin.'
            ], 500);
        }
    }

    // Keterangan lengkap dalam satu baris: tiap part berisi semua item beserta statusnya,
    // antar part dipisah " | ", catatan temuan menyusul setelah part-nya.
    private function susunKeterangan(array $hasil): string
    {
        $label = ['baik' => 'Baik', 'perlu_perhatian' => 'Perlu perhatian', 'rusak' => 'Rusak'];
        $baris = [];

        foreach ($hasil as $part) {
            $items = array_map(
                fn ($it) => "{$it['item']} ({$label[$it['status']]}"
                    . (!empty($it['catatan']) ? ": {$it['catatan']}" : '') . ')',
                $part['items']
            );
            $baris[] = "{$part['partName']}: " . implode('; ', $items);

            if (!empty($part['catatan'])) {
                $baris[] = "Catatan {$part['partName']}: {$part['catatan']}";
            }
        }

        return implode(' | ', $baris);
    }

    // Status terburuk dari semua item di semua part.
    private function statusTerburuk(array $hasil): string
    {
        $urutan = ['baik' => 0, 'perlu_perhatian' => 1, 'rusak' => 2];
        $terburuk = 'baik';

        foreach ($hasil as $part) {
            foreach ($part['items'] as $it) {
                if ($urutan[$it['status']] > $urutan[$terburuk]) {
                    $terburuk = $it['status'];
                }
            }
        }

        return $terburuk;
    }

    // Memperbarui log pemeliharaan berdasarkan ID (Untuk Fitur Edit)
    public function update(Request $request, $id)
    {
        $log = LogPemeliharaanMotorKonversi::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        $request->validate([
            'uraian_pemeliharaan' => 'required|string',
            'waktu_pelaksana' => 'required|date',
            'keterangan' => 'nullable|string',
            'paraf' => 'required|string',
            // Validasi tambahan untuk fitur Checklist Visual
            'status' => 'nullable|string|in:baik,perlu_perhatian,rusak',
            'jumlah_part_diperiksa' => 'nullable|integer',
            'jumlah_part_total' => 'nullable|integer',
        ]);

        try {
            $log->update([
                'uraian_pemeliharaan' => $request->uraian_pemeliharaan,
                'waktu_pelaksana' => $request->waktu_pelaksana,
                'keterangan' => $request->keterangan ?? '',
                'paraf' => $request->paraf,
                // Update data tambahan
                'status' => $request->status,
                'jumlah_part_diperiksa' => $request->jumlah_part_diperiksa,
                'jumlah_part_total' => $request->jumlah_part_total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log pemeliharaan berhasil diperbarui',
                'data' => $log
            ], 200);
        } catch (\Exception $e) {
            report($e); // detail error masuk log server, tidak dikirim ke pengguna
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui log. Silakan coba lagi atau hubungi Admin.'
            ], 500);
        }
    }

    // Menghapus log pemeliharaan berdasarkan ID (Untuk Fitur Hapus)
    public function destroy($id)
    {
        $log = LogPemeliharaanMotorKonversi::find($id);

        if (!$log) {
            return response()->json(['message' => 'Data log pemeliharaan tidak ditemukan'], 404);
        }

        try {
            $log->delete();

            return response()->json([
                'success' => true,
                'message' => 'Log pemeliharaan berhasil dihapus'
            ], 200);
        } catch (\Exception $e) {
            report($e); // detail error masuk log server, tidak dikirim ke pengguna
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus log. Silakan coba lagi atau hubungi Admin.'
            ], 500);
        }
    }
}
